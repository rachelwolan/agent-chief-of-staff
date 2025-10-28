// Compare 2024 vs 2025 organic performance by segment
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
            YEAR(u.created_on) AS signup_year,
            MONTH(u.created_on) AS signup_month,
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
            AND u.created_on >= '2024-01-01'
            AND u.created_on < '2025-09-01'  -- Through Aug 2025
            AND u.dim_market_segmentation IN ('Professional Creator', 'In-House Team', 'DIY Business', 'Other')
    ),

    yearly_metrics AS (
        SELECT
            signup_year,
            segment,
            COUNT(DISTINCT user_id) AS organic_signups,

            -- Activation metrics
            COUNT(DISTINCT CASE WHEN ds_first_activated IS NOT NULL THEN user_id END) AS activated_users,
            COUNT(DISTINCT CASE WHEN days_to_activation <= 7 THEN user_id END) AS activated_7d,
            COUNT(DISTINCT CASE WHEN days_to_activation <= 30 THEN user_id END) AS activated_30d,

            -- Conversion (30-day window)
            COUNT(DISTINCT CASE WHEN days_to_first_sub <= 30 THEN user_id END) AS converted_30d

        FROM organic_cohorts
        GROUP BY 1, 2
    ),

    -- Net Dollar Retention (NDR) data
    retention_data AS (
        SELECT
            YEAR(u.created_on) AS signup_year,
            u.dim_market_segmentation AS segment,
            r.wf_customer_id,

            -- 90-day Net Dollar Retention (3 months)
            MAX(CASE WHEN r.trailing_months_offset = 3 THEN r.trailing_mrr END) AS mrr_start_3mo,
            MAX(CASE WHEN r.trailing_months_offset = 3 THEN r.trailing_mrr + r.net_mrr END) AS mrr_end_3mo,

            -- 12-month Net Dollar Retention (1 year)
            MAX(CASE WHEN r.trailing_months_offset = 12 THEN r.trailing_mrr END) AS mrr_start_12mo,
            MAX(CASE WHEN r.trailing_months_offset = 12 THEN r.trailing_mrr + r.net_mrr END) AS mrr_end_12mo

        FROM
            analytics.webflow.dim_user_attributions u
        INNER JOIN
            analytics.webflow.report__customer_trailing_retention r
            ON u.user_id = r.user_id
        WHERE
            u.dim_signup_attribution = 'organic'
            AND u.created_on >= '2024-01-01'
            AND u.created_on < '2025-09-01'
            AND u.dim_market_segmentation IN ('Professional Creator', 'In-House Team', 'DIY Business', 'Other')
            AND u.ts_first_subscription IS NOT NULL
        GROUP BY 1, 2, 3
    ),

    retention_summary AS (
        SELECT
            signup_year,
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
        m.signup_year,
        m.segment,
        m.organic_signups,
        m.activated_users,
        m.activated_7d,
        m.activated_30d,
        m.converted_30d,

        -- Activation rates
        ROUND(m.activated_users::FLOAT / NULLIF(m.organic_signups, 0) * 100, 1) AS activation_rate_lifetime,
        ROUND(m.activated_7d::FLOAT / NULLIF(m.organic_signups, 0) * 100, 1) AS activation_rate_7d,
        ROUND(m.activated_30d::FLOAT / NULLIF(m.organic_signups, 0) * 100, 1) AS activation_rate_30d,

        -- Conversion rate
        ROUND(m.converted_30d::FLOAT / NULLIF(m.organic_signups, 0) * 100, 2) AS conversion_rate_30d,

        -- Net Dollar Retention (NDR) metrics
        r.cohort_size_3mo,
        r.cohort_size_12mo,
        ROUND((r.total_mrr_end_3mo / NULLIF(r.total_mrr_start_3mo, 0) * 100), 1) AS net_retention_90d,
        ROUND((r.total_mrr_end_12mo / NULLIF(r.total_mrr_start_12mo, 0) * 100), 1) AS net_retention_12mo

    FROM yearly_metrics m
    LEFT JOIN retention_summary r
        ON m.signup_year = r.signup_year
        AND m.segment = r.segment
    ORDER BY m.segment ASC, m.signup_year ASC
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
        console.log('\n📊 2024 vs 2025 ORGANIC PERFORMANCE BY SEGMENT (Jan-Aug comparison)');
        console.log('═'.repeat(160));
        console.log('');
        console.log('Note: NDR = Net Dollar Retention (ending MRR / starting MRR for cohort)');
        console.log('      90d NDR: Revenue retained/expanded after 3 months');
        console.log('      12mo NDR: Revenue retained/expanded after 12 months');
        console.log('      >100% = cohort expanded revenue (upgrades > churn+downgrades)');
        console.log('═'.repeat(160));
        console.log('');

        // Group by segment
        const segments = {};
        rows.forEach(row => {
          const seg = row.SEGMENT || 'Other';
          if (!segments[seg]) segments[seg] = {};
          segments[seg][row.SIGNUP_YEAR] = row;
        });

        // Display comparison table
        console.log('Segment              │ Year │  Signups  │ 7d Act % │ 30d Act % │ Life Act % │ 30d Conv % │ 90d NDR % │ 12mo NDR %');
        console.log('─'.repeat(160));

        Object.keys(segments).sort().forEach(segment => {
          const data2024 = segments[segment][2024] || {};
          const data2025 = segments[segment][2025] || {};

          // 2024 row
          console.log(
            `${segment.padEnd(20)} │ 2024 │ ${(data2024.ORGANIC_SIGNUPS || 0).toLocaleString().padStart(9)} │ ${(data2024.ACTIVATION_RATE_7D || 0).toFixed(1).padStart(7)}% │ ${(data2024.ACTIVATION_RATE_30D || 0).toFixed(1).padStart(8)}% │ ${(data2024.ACTIVATION_RATE_LIFETIME || 0).toFixed(1).padStart(9)}% │ ${(data2024.CONVERSION_RATE_30D || 0).toFixed(2).padStart(9)}% │ ${(data2024.NET_RETENTION_90D || 0).toFixed(1).padStart(8)}% │ ${(data2024.NET_RETENTION_12MO || 0).toFixed(1).padStart(9)}%`
          );

          // 2025 row
          console.log(
            `${segment.padEnd(20)} │ 2025 │ ${(data2025.ORGANIC_SIGNUPS || 0).toLocaleString().padStart(9)} │ ${(data2025.ACTIVATION_RATE_7D || 0).toFixed(1).padStart(7)}% │ ${(data2025.ACTIVATION_RATE_30D || 0).toFixed(1).padStart(8)}% │ ${(data2025.ACTIVATION_RATE_LIFETIME || 0).toFixed(1).padStart(9)}% │ ${(data2025.CONVERSION_RATE_30D || 0).toFixed(2).padStart(9)}% │ ${(data2025.NET_RETENTION_90D || 0).toFixed(1).padStart(8)}% │ ${(data2025.NET_RETENTION_12MO || 0).toFixed(1).padStart(9)}%`
          );

          // YoY change row
          const signupsChange = ((data2025.ORGANIC_SIGNUPS || 0) - (data2024.ORGANIC_SIGNUPS || 0)) / (data2024.ORGANIC_SIGNUPS || 1) * 100;
          const act7dChange = ((data2025.ACTIVATION_RATE_7D || 0) - (data2024.ACTIVATION_RATE_7D || 0));
          const act30dChange = ((data2025.ACTIVATION_RATE_30D || 0) - (data2024.ACTIVATION_RATE_30D || 0));
          const actLifeChange = ((data2025.ACTIVATION_RATE_LIFETIME || 0) - (data2024.ACTIVATION_RATE_LIFETIME || 0));
          const convChange = ((data2025.CONVERSION_RATE_30D || 0) - (data2024.CONVERSION_RATE_30D || 0));
          const ret90dChange = ((data2025.NET_RETENTION_90D || 0) - (data2024.NET_RETENTION_90D || 0));
          const ret12moChange = ((data2025.NET_RETENTION_12MO || 0) - (data2024.NET_RETENTION_12MO || 0));

          const formatChange = (val) => `${val >= 0 ? '+' : ''}${val.toFixed(1)}`;
          const formatPctChange = (val) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}`;

          console.log(
            `${' '.repeat(20)} │ YoY  │ ${formatChange(signupsChange)}%`.padEnd(32) +
            ` │ ${formatChange(act7dChange)}pp`.padEnd(11) +
            ` │ ${formatChange(act30dChange)}pp`.padEnd(11) +
            ` │ ${formatChange(actLifeChange)}pp`.padEnd(12) +
            ` │ ${formatPctChange(convChange)}pp`.padEnd(12) +
            ` │ ${formatChange(ret90dChange)}pp`.padEnd(11) +
            ` │ ${formatChange(ret12moChange)}pp`
          );
          console.log('─'.repeat(160));
        });

        // Summary insights
        console.log('\n\n📈 KEY INSIGHTS: 2024 vs 2025 (Jan-Aug YTD)');
        console.log('═'.repeat(160));

        Object.keys(segments).sort().forEach(segment => {
          const data2024 = segments[segment][2024] || {};
          const data2025 = segments[segment][2025] || {};

          console.log(`\n🎯 ${segment.toUpperCase()}`);

          // Volume
          const volChange = ((data2025.ORGANIC_SIGNUPS - data2024.ORGANIC_SIGNUPS) / data2024.ORGANIC_SIGNUPS * 100);
          const volTrend = volChange >= 0 ? '📈' : '📉';
          console.log(`   Volume:      ${data2024.ORGANIC_SIGNUPS.toLocaleString()} → ${data2025.ORGANIC_SIGNUPS.toLocaleString()} (${volTrend} ${volChange >= 0 ? '+' : ''}${volChange.toFixed(1)}%)`);

          // 30d Activation
          const actChange = data2025.ACTIVATION_RATE_30D - data2024.ACTIVATION_RATE_30D;
          const actTrend = actChange >= 0 ? '📈' : '📉';
          console.log(`   30d Act:     ${data2024.ACTIVATION_RATE_30D.toFixed(1)}% → ${data2025.ACTIVATION_RATE_30D.toFixed(1)}% (${actTrend} ${actChange >= 0 ? '+' : ''}${actChange.toFixed(1)}pp)`);

          // 30d Conversion
          const convChange = data2025.CONVERSION_RATE_30D - data2024.CONVERSION_RATE_30D;
          const convTrend = convChange >= 0 ? '📈' : '📉';
          console.log(`   30d Conv:    ${data2024.CONVERSION_RATE_30D.toFixed(2)}% → ${data2025.CONVERSION_RATE_30D.toFixed(2)}% (${convTrend} ${convChange >= 0 ? '+' : ''}${convChange.toFixed(2)}pp)`);

          // 90d Net Dollar Retention
          if (data2024.NET_RETENTION_90D > 0 && data2025.NET_RETENTION_90D > 0) {
            const retChange = data2025.NET_RETENTION_90D - data2024.NET_RETENTION_90D;
            const retTrend = retChange >= 0 ? '📈' : '📉';
            console.log(`   90d NDR:     ${data2024.NET_RETENTION_90D.toFixed(1)}% → ${data2025.NET_RETENTION_90D.toFixed(1)}% (${retTrend} ${retChange >= 0 ? '+' : ''}${retChange.toFixed(1)}pp)`);
          }

          // 12-Month Net Dollar Retention
          if (data2024.NET_RETENTION_12MO > 0 && data2025.NET_RETENTION_12MO > 0) {
            const ret12moChange = data2025.NET_RETENTION_12MO - data2024.NET_RETENTION_12MO;
            const ret12moTrend = ret12moChange >= 0 ? '📈' : '📉';
            console.log(`   12mo NDR:    ${data2024.NET_RETENTION_12MO.toFixed(1)}% → ${data2025.NET_RETENTION_12MO.toFixed(1)}% (${ret12moTrend} ${ret12moChange >= 0 ? '+' : ''}${ret12moChange.toFixed(1)}pp)`);
          }
        });

        console.log('\n═'.repeat(160));

      } else {
        console.log('No data found');
      }

      connection.destroy((err) => {
        if (err) console.error('Error destroying connection:', err);
      });
    },
  });
});
