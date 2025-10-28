// Expansion analysis: What % of organic customers expand within first 90 days / 6 months?
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
    WITH organic_users AS (
        SELECT
            YEAR(u.created_on) AS signup_year,
            u.dim_market_segmentation AS segment,
            u.user_id,
            u.ts_first_subscription
        FROM
            analytics.webflow.dim_user_attributions u
        WHERE
            u.dim_signup_attribution = 'organic'
            AND u.created_on >= '2023-01-01'
            AND u.created_on < '2025-01-01'  -- Full years only
            AND u.dim_market_segmentation IN ('Professional Creator', 'In-House Team', 'DIY Business', 'Other')
            AND u.ts_first_subscription IS NOT NULL
    ),

    -- Get expansion data at 3mo and 6mo marks
    expansion_3mo AS (
        SELECT
            o.signup_year,
            o.segment,
            r.wf_customer_id,
            r.trailing_mrr AS starting_mrr,
            r.expansion_mrr AS expansion_3mo,
            CASE WHEN r.expansion_mrr > 0 THEN 1 ELSE 0 END AS expanded_3mo
        FROM
            organic_users o
        INNER JOIN
            analytics.webflow.report__customer_trailing_retention r
            ON o.user_id = r.user_id
        WHERE
            r.trailing_months_offset = 3
            AND r.trailing_mrr > 0
    ),

    expansion_6mo AS (
        SELECT
            o.signup_year,
            o.segment,
            r.wf_customer_id,
            r.trailing_mrr AS starting_mrr,
            r.expansion_mrr AS expansion_6mo,
            CASE WHEN r.expansion_mrr > 0 THEN 1 ELSE 0 END AS expanded_6mo
        FROM
            organic_users o
        INNER JOIN
            analytics.webflow.report__customer_trailing_retention r
            ON o.user_id = r.user_id
        WHERE
            r.trailing_months_offset = 6
            AND r.trailing_mrr > 0
    ),

    summary_3mo AS (
        SELECT
            signup_year,
            segment,
            COUNT(DISTINCT wf_customer_id) AS cohort_size_3mo,
            SUM(expanded_3mo) AS customers_expanded_3mo,
            SUM(expansion_3mo) AS total_expansion_mrr_3mo,
            SUM(starting_mrr) AS total_starting_mrr_3mo,
            ROUND((SUM(expanded_3mo)::FLOAT / NULLIF(COUNT(DISTINCT wf_customer_id), 0) * 100), 1) AS pct_customers_expanded_3mo,
            ROUND((SUM(expansion_3mo) / NULLIF(SUM(starting_mrr), 0) * 100), 1) AS expansion_rate_3mo
        FROM expansion_3mo
        GROUP BY 1, 2
    ),

    summary_6mo AS (
        SELECT
            signup_year,
            segment,
            COUNT(DISTINCT wf_customer_id) AS cohort_size_6mo,
            SUM(expanded_6mo) AS customers_expanded_6mo,
            SUM(expansion_6mo) AS total_expansion_mrr_6mo,
            SUM(starting_mrr) AS total_starting_mrr_6mo,
            ROUND((SUM(expanded_6mo)::FLOAT / NULLIF(COUNT(DISTINCT wf_customer_id), 0) * 100), 1) AS pct_customers_expanded_6mo,
            ROUND((SUM(expansion_6mo) / NULLIF(SUM(starting_mrr), 0) * 100), 1) AS expansion_rate_6mo
        FROM expansion_6mo
        GROUP BY 1, 2
    ),

    summary AS (
        SELECT
            COALESCE(s3.signup_year, s6.signup_year) AS signup_year,
            COALESCE(s3.segment, s6.segment) AS segment,
            s3.cohort_size_3mo,
            s3.customers_expanded_3mo,
            s3.pct_customers_expanded_3mo,
            s3.expansion_rate_3mo,
            s6.cohort_size_6mo,
            s6.customers_expanded_6mo,
            s6.pct_customers_expanded_6mo,
            s6.expansion_rate_6mo
        FROM summary_3mo s3
        FULL OUTER JOIN summary_6mo s6
            ON s3.signup_year = s6.signup_year
            AND s3.segment = s6.segment
    )

    SELECT * FROM summary
    ORDER BY segment ASC, signup_year ASC
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
        console.log('\n📊 EXPANSION ANALYSIS: Organic Customers by Segment');
        console.log('═'.repeat(160));
        console.log('');
        console.log('Note: "% Customers Expanded" = % of paying customers who had ANY expansion');
        console.log('      "Expansion Rate" = Total expansion MRR / Starting MRR');
        console.log('═'.repeat(160));
        console.log('');

        // Group by segment
        const segments = {};
        rows.forEach(row => {
          const seg = row.SEGMENT || 'Other';
          if (!segments[seg]) segments[seg] = {};
          segments[seg][row.SIGNUP_YEAR] = row;
        });

        // Display 3-month expansion
        console.log('╔═══════════════════════════════════════════════════════════════════╗');
        console.log('║                    3-MONTH EXPANSION METRICS                      ║');
        console.log('╚═══════════════════════════════════════════════════════════════════╝');
        console.log('');
        console.log('Segment              │ Year │ Cohort │ # Expanded │ % Expanded │ Expansion Rate');
        console.log('─'.repeat(160));

        Object.keys(segments).sort().forEach(segment => {
          const data2023 = segments[segment][2023] || {};
          const data2024 = segments[segment][2024] || {};

          // 2023
          if (data2023.COHORT_SIZE_3MO) {
            console.log(
              `${segment.padEnd(20)} │ 2023 │ ${(data2023.COHORT_SIZE_3MO || 0).toLocaleString().padStart(6)} │ ${(data2023.CUSTOMERS_EXPANDED_3MO || 0).toLocaleString().padStart(10)} │ ${(data2023.PCT_CUSTOMERS_EXPANDED_3MO || 0).toFixed(1)}%`.padStart(12) +
              ` │ ${(data2023.EXPANSION_RATE_3MO || 0).toFixed(1)}%`
            );
          }

          // 2024
          if (data2024.COHORT_SIZE_3MO) {
            console.log(
              `${segment.padEnd(20)} │ 2024 │ ${(data2024.COHORT_SIZE_3MO || 0).toLocaleString().padStart(6)} │ ${(data2024.CUSTOMERS_EXPANDED_3MO || 0).toLocaleString().padStart(10)} │ ${(data2024.PCT_CUSTOMERS_EXPANDED_3MO || 0).toFixed(1)}%`.padStart(12) +
              ` │ ${(data2024.EXPANSION_RATE_3MO || 0).toFixed(1)}%`
            );
          }

          // YoY
          if (data2023.COHORT_SIZE_3MO && data2024.COHORT_SIZE_3MO) {
            const pctChange = (data2024.PCT_CUSTOMERS_EXPANDED_3MO || 0) - (data2023.PCT_CUSTOMERS_EXPANDED_3MO || 0);
            const rateChange = (data2024.EXPANSION_RATE_3MO || 0) - (data2023.EXPANSION_RATE_3MO || 0);
            console.log(
              `${' '.repeat(20)} │ YoY  │ ${' '.repeat(6)} │ ${' '.repeat(10)} │ ${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}pp`.padStart(12) +
              ` │ ${rateChange >= 0 ? '+' : ''}${rateChange.toFixed(1)}pp`
            );
          }
          console.log('─'.repeat(160));
        });

        // Display 6-month expansion
        console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
        console.log('║                    6-MONTH EXPANSION METRICS                      ║');
        console.log('╚═══════════════════════════════════════════════════════════════════╝');
        console.log('');
        console.log('Segment              │ Year │ Cohort │ # Expanded │ % Expanded │ Expansion Rate');
        console.log('─'.repeat(160));

        Object.keys(segments).sort().forEach(segment => {
          const data2023 = segments[segment][2023] || {};
          const data2024 = segments[segment][2024] || {};

          // 2023
          if (data2023.COHORT_SIZE_6MO) {
            console.log(
              `${segment.padEnd(20)} │ 2023 │ ${(data2023.COHORT_SIZE_6MO || 0).toLocaleString().padStart(6)} │ ${(data2023.CUSTOMERS_EXPANDED_6MO || 0).toLocaleString().padStart(10)} │ ${(data2023.PCT_CUSTOMERS_EXPANDED_6MO || 0).toFixed(1)}%`.padStart(12) +
              ` │ ${(data2023.EXPANSION_RATE_6MO || 0).toFixed(1)}%`
            );
          }

          // 2024
          if (data2024.COHORT_SIZE_6MO) {
            console.log(
              `${segment.padEnd(20)} │ 2024 │ ${(data2024.COHORT_SIZE_6MO || 0).toLocaleString().padStart(6)} │ ${(data2024.CUSTOMERS_EXPANDED_6MO || 0).toLocaleString().padStart(10)} │ ${(data2024.PCT_CUSTOMERS_EXPANDED_6MO || 0).toFixed(1)}%`.padStart(12) +
              ` │ ${(data2024.EXPANSION_RATE_6MO || 0).toFixed(1)}%`
            );
          }

          // YoY
          if (data2023.COHORT_SIZE_6MO && data2024.COHORT_SIZE_6MO) {
            const pctChange = (data2024.PCT_CUSTOMERS_EXPANDED_6MO || 0) - (data2023.PCT_CUSTOMERS_EXPANDED_6MO || 0);
            const rateChange = (data2024.EXPANSION_RATE_6MO || 0) - (data2023.EXPANSION_RATE_6MO || 0);
            console.log(
              `${' '.repeat(20)} │ YoY  │ ${' '.repeat(6)} │ ${' '.repeat(10)} │ ${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}pp`.padStart(12) +
              ` │ ${rateChange >= 0 ? '+' : ''}${rateChange.toFixed(1)}pp`
            );
          }
          console.log('─'.repeat(160));
        });

        // Key insights
        console.log('\n\n📈 KEY INSIGHTS');
        console.log('═'.repeat(160));

        Object.keys(segments).sort().forEach(segment => {
          const data2023 = segments[segment][2023] || {};
          const data2024 = segments[segment][2024] || {};

          if (data2023.COHORT_SIZE_3MO && data2024.COHORT_SIZE_3MO) {
            console.log(`\n🎯 ${segment.toUpperCase()}`);

            const pct3moChange = data2024.PCT_CUSTOMERS_EXPANDED_3MO - data2023.PCT_CUSTOMERS_EXPANDED_3MO;
            const pct6moChange = data2024.PCT_CUSTOMERS_EXPANDED_6MO - data2023.PCT_CUSTOMERS_EXPANDED_6MO;

            console.log(`   3-Month: ${data2023.PCT_CUSTOMERS_EXPANDED_3MO.toFixed(1)}% → ${data2024.PCT_CUSTOMERS_EXPANDED_3MO.toFixed(1)}% (${pct3moChange >= 0 ? '+' : ''}${pct3moChange.toFixed(1)}pp) of customers expanded`);
            console.log(`   6-Month: ${data2023.PCT_CUSTOMERS_EXPANDED_6MO.toFixed(1)}% → ${data2024.PCT_CUSTOMERS_EXPANDED_6MO.toFixed(1)}% (${pct6moChange >= 0 ? '+' : ''}${pct6moChange.toFixed(1)}pp) of customers expanded`);

            if (pct3moChange > 2) {
              console.log(`   ✅ More customers expanding in first 3 months`);
            } else if (pct3moChange < -2) {
              console.log(`   ⚠️  Fewer customers expanding in first 3 months`);
            }
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
