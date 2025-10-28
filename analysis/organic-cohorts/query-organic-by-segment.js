// Analyze organic signup performance by customer segment
import snowflake from 'snowflake-sdk';

const connection = snowflake.createConnection({
  account: 'wn71398.us-east-1',
  username: 'rachel.wolan@webflow.com',
  database: 'ANALYTICS',
  schema: 'WEBFLOW',
  warehouse: 'SNOWFLAKE_REPORTING_WH_4',
  authenticator: 'externalbrowser',
});

connection.connectAsync((err, conn) => {
  if (err) {
    console.error('Unable to connect: ' + err.message);
    process.exit(1);
  }

  const query = `
    WITH monthly_cohorts AS (
        SELECT
            DATE_TRUNC('month', u.created_on) AS signup_month,
            u.dim_market_segmentation AS segment,
            COUNT(DISTINCT u.user_id) AS organic_signups,

            -- Activation metrics
            COUNT(DISTINCT CASE WHEN u.ds_first_activated IS NOT NULL THEN u.user_id END) AS activated_users,
            COUNT(DISTINCT CASE WHEN DATEDIFF('day', u.created_on, u.ds_first_activated) = 0 THEN u.user_id END) AS activated_d0,

            -- Conversion metrics (30-day window)
            COUNT(DISTINCT CASE
                WHEN u.ts_first_subscription IS NOT NULL
                AND DATEDIFF('day', u.created_on, u.ts_first_subscription) <= 30
                THEN u.user_id
            END) AS ftc_30d,

            -- MRR from converters (30-day window)
            AVG(CASE
                WHEN u.ts_first_subscription IS NOT NULL
                AND DATEDIFF('day', u.created_on, u.ts_first_subscription) <= 30
                THEN u.m_revenue_attributed_1y
            END) AS avg_revenue_1y_per_converter

        FROM
            analytics.webflow.dim_user_attributions u
        WHERE
            u.dim_signup_attribution = 'organic'
            AND u.created_on >= '2023-01-01'
            AND u.created_on < DATE_TRUNC('month', CURRENT_DATE)
            AND u.dim_market_segmentation IN ('Professional Creator', 'In-House Team', 'DIY Business', 'Other')
        GROUP BY 1, 2
    )

    SELECT
        signup_month,
        segment,
        organic_signups,
        activated_users,
        activated_d0,
        ftc_30d,

        -- Calculated rates
        ROUND(activated_users::FLOAT / NULLIF(organic_signups, 0) * 100, 1) AS activation_rate,
        ROUND(activated_d0::FLOAT / NULLIF(organic_signups, 0) * 100, 1) AS d0_activation_rate,
        ROUND(ftc_30d::FLOAT / NULLIF(organic_signups, 0) * 100, 2) AS ftc_30d_rate,
        ROUND(avg_revenue_1y_per_converter, 2) AS avg_1y_revenue

    FROM monthly_cohorts
    WHERE signup_month >= '2023-02-01'
    ORDER BY signup_month ASC, segment ASC
  `;

  conn.execute({
    sqlText: query,
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('Failed:', err.message);
        connection.destroy((err) => {});
        process.exit(1);
      }

      if (rows && rows.length > 0) {
        console.log('\n📊 ORGANIC SIGNUP PERFORMANCE BY CUSTOMER SEGMENT');
        console.log('═'.repeat(160));
        console.log('');

        // Group by segment for analysis
        const segments = {};
        rows.forEach(row => {
          const seg = row.SEGMENT || 'Other';
          if (!segments[seg]) segments[seg] = [];
          segments[seg].push(row);
        });

        // Display each segment
        Object.keys(segments).sort().forEach(segment => {
          console.log(`\n🎯 SEGMENT: ${segment.toUpperCase()}`);
          console.log('─'.repeat(160));
          console.log('Month     │ Signups │ Activ Rate │ D0 Act % │ FTC 30d % │ Avg 1Y Rev │ MoM Signups │ MoM FTC │ YoY Signups │ YoY FTC');
          console.log('─'.repeat(160));

          const segmentData = segments[segment];

          segmentData.forEach((row, idx) => {
            const date = new Date(row.SIGNUP_MONTH);
            const monthStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            const signups = row.ORGANIC_SIGNUPS;
            const activationRate = row.ACTIVATION_RATE || 0;
            const d0Rate = row.D0_ACTIVATION_RATE || 0;
            const ftcRate = row.FTC_30D_RATE || 0;
            const avgRev = row.AVG_1Y_REVENUE || 0;

            // MoM calculations
            let momSignups = '';
            let momFTC = '';
            if (idx > 0) {
              const prevRow = segmentData[idx - 1];
              const momSignupsPct = ((signups - prevRow.ORGANIC_SIGNUPS) / prevRow.ORGANIC_SIGNUPS * 100);
              const momFTCPct = ((ftcRate - (prevRow.FTC_30D_RATE || 0)) / (prevRow.FTC_30D_RATE || 0.01) * 100);

              momSignups = `${momSignupsPct >= 0 ? '+' : ''}${momSignupsPct.toFixed(1)}%`;
              momFTC = `${momFTCPct >= 0 ? '+' : ''}${momFTCPct.toFixed(1)}%`;
            } else {
              momSignups = '—';
              momFTC = '—';
            }

            // YoY calculations
            let yoySignups = '';
            let yoyFTC = '';
            if (idx >= 12) {
              const prevYearRow = segmentData[idx - 12];
              const yoySignupsPct = ((signups - prevYearRow.ORGANIC_SIGNUPS) / prevYearRow.ORGANIC_SIGNUPS * 100);
              const yoyFTCPct = ((ftcRate - (prevYearRow.FTC_30D_RATE || 0)) / (prevYearRow.FTC_30D_RATE || 0.01) * 100);

              yoySignups = `${yoySignupsPct >= 0 ? '+' : ''}${yoySignupsPct.toFixed(1)}%`;
              yoyFTC = `${yoyFTCPct >= 0 ? '+' : ''}${yoyFTCPct.toFixed(1)}%`;
            } else {
              yoySignups = '—';
              yoyFTC = '—';
            }

            console.log(
              `${monthStr.padEnd(9)} │ ${signups.toLocaleString().padStart(7)} │ ${activationRate.toFixed(1).padStart(9)}% │ ${d0Rate.toFixed(1).padStart(7)}% │ ${ftcRate.toFixed(2).padStart(8)}% │ $${avgRev.toFixed(0).padStart(9)} │ ${momSignups.padStart(11)} │ ${momFTC.padStart(7)} │ ${yoySignups.padStart(11)} │ ${yoyFTC.padStart(7)}`
            );
          });
        });

        // Summary stats by segment
        console.log('\n\n📈 SEGMENT COMPARISON SUMMARY');
        console.log('═'.repeat(160));
        console.log('Segment              │ Total Signups │ Avg FTC Rate │ Avg Activ │ Avg 1Y Rev │ 2024 Avg FTC │ 2025 Avg FTC │ FTC Decline');
        console.log('─'.repeat(160));

        Object.keys(segments).sort().forEach(segment => {
          const segmentData = segments[segment];
          const totalSignups = segmentData.reduce((sum, r) => sum + r.ORGANIC_SIGNUPS, 0);
          const avgFTC = segmentData.reduce((sum, r) => sum + (r.FTC_30D_RATE || 0), 0) / segmentData.length;
          const avgActiv = segmentData.reduce((sum, r) => sum + (r.ACTIVATION_RATE || 0), 0) / segmentData.length;
          const avgRev = segmentData.reduce((sum, r) => sum + (r.AVG_1Y_REVENUE || 0), 0) / segmentData.length;

          // 2024 vs 2025 FTC rates
          const data2024 = segmentData.filter(r => {
            const year = new Date(r.SIGNUP_MONTH).getFullYear();
            return year === 2024;
          });
          const data2025 = segmentData.filter(r => {
            const year = new Date(r.SIGNUP_MONTH).getFullYear();
            return year === 2025;
          });

          const ftc2024 = data2024.length > 0
            ? data2024.reduce((sum, r) => sum + (r.FTC_30D_RATE || 0), 0) / data2024.length
            : 0;
          const ftc2025 = data2025.length > 0
            ? data2025.reduce((sum, r) => sum + (r.FTC_30D_RATE || 0), 0) / data2025.length
            : 0;
          const ftcDecline = ((ftc2025 - ftc2024) / ftc2024 * 100);

          console.log(
            `${segment.padEnd(20)} │ ${totalSignups.toLocaleString().padStart(13)} │ ${avgFTC.toFixed(2).padStart(11)}% │ ${avgActiv.toFixed(1).padStart(8)}% │ $${avgRev.toFixed(0).padStart(9)} │ ${ftc2024.toFixed(2).padStart(11)}% │ ${ftc2025.toFixed(2).padStart(11)}% │ ${ftcDecline >= 0 ? '+' : ''}${ftcDecline.toFixed(1)}%`
          );
        });

        console.log('═'.repeat(160));

      } else {
        console.log('No data found');
      }

      connection.destroy((err) => {
        if (err) console.error('Error destroying connection:', err);
      });
    },
  });
});
