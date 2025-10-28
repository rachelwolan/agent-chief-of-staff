// Analyze organic signup quality using activation + retention by segment
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
    WITH organic_cohorts AS (
        SELECT
            DATE_TRUNC('month', u.created_on) AS signup_month,
            u.dim_market_segmentation AS segment,
            u.user_id,
            u.ds_first_activated,
            u.ts_first_subscription,
            DATEDIFF('day', u.created_on, u.ds_first_activated) AS days_to_activation,
            DATEDIFF('day', u.created_on, u.ts_first_subscription) AS days_to_first_sub
        FROM
            analytics.webflow.dim_user_attributions u
        WHERE
            u.dim_signup_attribution = 'organic'
            AND u.created_on >= '2023-01-01'
            AND u.created_on < DATE_TRUNC('month', CURRENT_DATE)
            AND u.dim_market_segmentation IN ('Professional Creator', 'In-House Team', 'DIY Business', 'Other')
    ),

    cohort_metrics AS (
        SELECT
            signup_month,
            segment,
            COUNT(DISTINCT user_id) AS organic_signups,

            -- Activation metrics
            COUNT(DISTINCT CASE WHEN ds_first_activated IS NOT NULL THEN user_id END) AS activated_users,
            COUNT(DISTINCT CASE WHEN days_to_activation <= 7 THEN user_id END) AS activated_7d,
            COUNT(DISTINCT CASE WHEN days_to_activation <= 30 THEN user_id END) AS activated_30d,

            -- Conversion (for comparison)
            COUNT(DISTINCT CASE WHEN days_to_first_sub <= 30 THEN user_id END) AS converted_30d,

            -- Get list of users who activated for retention analysis
            ARRAY_AGG(DISTINCT CASE WHEN ds_first_activated IS NOT NULL THEN user_id END) AS activated_user_ids

        FROM organic_cohorts
        GROUP BY 1, 2
    ),

    -- Get retention data for activated users who converted
    retention_data AS (
        SELECT
            DATE_TRUNC('month', u.created_on) AS signup_month,
            u.dim_market_segmentation AS segment,
            r.wf_customer_id,

            -- 3 month retention (90 days)
            MAX(CASE WHEN r.trailing_months_offset = 3 THEN r.trailing_mrr END) AS mrr_start_3mo,
            MAX(CASE WHEN r.trailing_months_offset = 3 THEN r.trailing_mrr + r.net_mrr END) AS mrr_end_3mo,

            -- 12 month retention (1 year)
            MAX(CASE WHEN r.trailing_months_offset = 12 THEN r.trailing_mrr END) AS mrr_start_12mo,
            MAX(CASE WHEN r.trailing_months_offset = 12 THEN r.trailing_mrr + r.net_mrr END) AS mrr_end_12mo

        FROM
            analytics.webflow.dim_user_attributions u
        INNER JOIN
            analytics.webflow.report__customer_trailing_retention r
            ON u.user_id = r.user_id
        WHERE
            u.dim_signup_attribution = 'organic'
            AND u.created_on >= '2023-01-01'
            AND u.created_on < DATE_TRUNC('month', CURRENT_DATE)
            AND u.dim_market_segmentation IN ('Professional Creator', 'In-House Team', 'DIY Business', 'Other')
            AND u.ts_first_subscription IS NOT NULL
        GROUP BY 1, 2, 3
    ),

    retention_summary AS (
        SELECT
            signup_month,
            segment,

            -- 90-day net retention
            COUNT(DISTINCT CASE WHEN mrr_start_3mo > 0 THEN wf_customer_id END) AS cohort_size_3mo,
            SUM(CASE WHEN mrr_start_3mo > 0 THEN mrr_start_3mo ELSE 0 END) AS total_mrr_start_3mo,
            SUM(CASE WHEN mrr_start_3mo > 0 THEN mrr_end_3mo ELSE 0 END) AS total_mrr_end_3mo,

            -- 1-year net retention
            COUNT(DISTINCT CASE WHEN mrr_start_12mo > 0 THEN wf_customer_id END) AS cohort_size_12mo,
            SUM(CASE WHEN mrr_start_12mo > 0 THEN mrr_start_12mo ELSE 0 END) AS total_mrr_start_12mo,
            SUM(CASE WHEN mrr_start_12mo > 0 THEN mrr_end_12mo ELSE 0 END) AS total_mrr_end_12mo

        FROM retention_data
        GROUP BY 1, 2
    )

    SELECT
        c.signup_month,
        c.segment,
        c.organic_signups,
        c.activated_users,
        c.activated_7d,
        c.activated_30d,
        c.converted_30d,

        -- Activation rates
        ROUND(c.activated_users::FLOAT / NULLIF(c.organic_signups, 0) * 100, 1) AS activation_rate_lifetime,
        ROUND(c.activated_7d::FLOAT / NULLIF(c.organic_signups, 0) * 100, 1) AS activation_rate_7d,
        ROUND(c.activated_30d::FLOAT / NULLIF(c.organic_signups, 0) * 100, 1) AS activation_rate_30d,

        -- Conversion rate (for reference)
        ROUND(c.converted_30d::FLOAT / NULLIF(c.organic_signups, 0) * 100, 2) AS conversion_rate_30d,

        -- Retention metrics
        r.cohort_size_3mo,
        r.cohort_size_12mo,
        ROUND((r.total_mrr_end_3mo / NULLIF(r.total_mrr_start_3mo, 0) * 100), 1) AS net_retention_90d,
        ROUND((r.total_mrr_end_12mo / NULLIF(r.total_mrr_start_12mo, 0) * 100), 1) AS net_retention_1y

    FROM cohort_metrics c
    LEFT JOIN retention_summary r
        ON c.signup_month = r.signup_month
        AND c.segment = r.segment
    WHERE c.signup_month >= '2023-02-01'
    ORDER BY c.signup_month ASC, c.segment ASC
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
        console.log('\n📊 ORGANIC SIGNUP QUALITY: ACTIVATION + RETENTION BY SEGMENT');
        console.log('═'.repeat(180));
        console.log('');

        // Group by segment
        const segments = {};
        rows.forEach(row => {
          const seg = row.SEGMENT || 'Other';
          if (!segments[seg]) segments[seg] = [];
          segments[seg].push(row);
        });

        // Display each segment
        Object.keys(segments).sort().forEach(segment => {
          console.log(`\n🎯 SEGMENT: ${segment.toUpperCase()}`);
          console.log('─'.repeat(180));
          console.log('Month     │ Signups │ 7d Act % │ 30d Act % │ Life Act % │ 30d Conv % │ 90d Retention │ 1Y Retention │ MoM Act │ YoY Act');
          console.log('─'.repeat(180));

          const segmentData = segments[segment];

          segmentData.forEach((row, idx) => {
            const date = new Date(row.SIGNUP_MONTH);
            const monthStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            const signups = row.ORGANIC_SIGNUPS;
            const act7d = row.ACTIVATION_RATE_7D || 0;
            const act30d = row.ACTIVATION_RATE_30D || 0;
            const actLife = row.ACTIVATION_RATE_LIFETIME || 0;
            const conv30d = row.CONVERSION_RATE_30D || 0;
            const ret90d = row.NET_RETENTION_90D || 0;
            const ret1y = row.NET_RETENTION_1Y || 0;

            // MoM activation
            let momAct = '';
            if (idx > 0) {
              const prevAct = segmentData[idx - 1].ACTIVATION_RATE_30D || 0;
              const momActPct = ((act30d - prevAct) / (prevAct || 0.01) * 100);
              momAct = `${momActPct >= 0 ? '+' : ''}${momActPct.toFixed(1)}%`;
            } else {
              momAct = '—';
            }

            // YoY activation
            let yoyAct = '';
            if (idx >= 12) {
              const prevYearAct = segmentData[idx - 12].ACTIVATION_RATE_30D || 0;
              const yoyActPct = ((act30d - prevYearAct) / (prevYearAct || 0.01) * 100);
              yoyAct = `${yoyActPct >= 0 ? '+' : ''}${yoyActPct.toFixed(1)}%`;
            } else {
              yoyAct = '—';
            }

            const ret90dStr = ret90d > 0 ? `${ret90d.toFixed(1)}%` : '—';
            const ret1yStr = ret1y > 0 ? `${ret1y.toFixed(1)}%` : '—';

            console.log(
              `${monthStr.padEnd(9)} │ ${signups.toLocaleString().padStart(7)} │ ${act7d.toFixed(1).padStart(7)}% │ ${act30d.toFixed(1).padStart(8)}% │ ${actLife.toFixed(1).padStart(9)}% │ ${conv30d.toFixed(2).padStart(9)}% │ ${ret90dStr.padStart(13)} │ ${ret1yStr.padStart(12)} │ ${momAct.padStart(7)} │ ${yoyAct.padStart(7)}`
            );
          });
        });

        // Summary stats
        console.log('\n\n📈 SEGMENT COMPARISON SUMMARY');
        console.log('═'.repeat(180));
        console.log('Segment              │ Total Signups │ Avg 30d Act │ Avg Conv │ Avg 90d Ret │ Avg 1Y Ret │ 2024 Act │ 2025 Act │ Act Change');
        console.log('─'.repeat(180));

        Object.keys(segments).sort().forEach(segment => {
          const segmentData = segments[segment];
          const totalSignups = segmentData.reduce((sum, r) => sum + r.ORGANIC_SIGNUPS, 0);
          const avgAct30d = segmentData.reduce((sum, r) => sum + (r.ACTIVATION_RATE_30D || 0), 0) / segmentData.length;
          const avgConv = segmentData.reduce((sum, r) => sum + (r.CONVERSION_RATE_30D || 0), 0) / segmentData.length;

          // Average retention (only from months with data)
          const ret90dData = segmentData.filter(r => r.NET_RETENTION_90D > 0);
          const avgRet90d = ret90dData.length > 0
            ? ret90dData.reduce((sum, r) => sum + r.NET_RETENTION_90D, 0) / ret90dData.length
            : 0;

          const ret1yData = segmentData.filter(r => r.NET_RETENTION_1Y > 0);
          const avgRet1y = ret1yData.length > 0
            ? ret1yData.reduce((sum, r) => sum + r.NET_RETENTION_1Y, 0) / ret1yData.length
            : 0;

          // 2024 vs 2025 activation
          const data2024 = segmentData.filter(r => new Date(r.SIGNUP_MONTH).getFullYear() === 2024);
          const data2025 = segmentData.filter(r => new Date(r.SIGNUP_MONTH).getFullYear() === 2025);

          const act2024 = data2024.length > 0
            ? data2024.reduce((sum, r) => sum + (r.ACTIVATION_RATE_30D || 0), 0) / data2024.length
            : 0;
          const act2025 = data2025.length > 0
            ? data2025.reduce((sum, r) => sum + (r.ACTIVATION_RATE_30D || 0), 0) / data2025.length
            : 0;
          const actChange = ((act2025 - act2024) / act2024 * 100);

          const ret90dStr = avgRet90d > 0 ? `${avgRet90d.toFixed(1)}%` : '—';
          const ret1yStr = avgRet1y > 0 ? `${avgRet1y.toFixed(1)}%` : '—';

          console.log(
            `${segment.padEnd(20)} │ ${totalSignups.toLocaleString().padStart(13)} │ ${avgAct30d.toFixed(1).padStart(10)}% │ ${avgConv.toFixed(2).padStart(7)}% │ ${ret90dStr.padStart(11)} │ ${ret1yStr.padStart(10)} │ ${act2024.toFixed(1).padStart(7)}% │ ${act2025.toFixed(1).padStart(7)}% │ ${actChange >= 0 ? '+' : ''}${actChange.toFixed(1)}%`
          );
        });

        console.log('═'.repeat(180));

      } else {
        console.log('No data found');
      }

      connection.destroy((err) => {
        if (err) console.error('Error destroying connection:', err);
      });
    },
  });
});
