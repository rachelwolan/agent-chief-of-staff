// Break down expansion, contraction, and churn for organic cohorts
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
            u.user_id
        FROM
            analytics.webflow.dim_user_attributions u
        WHERE
            u.dim_signup_attribution = 'organic'
            AND u.created_on >= '2024-01-01'
            AND u.created_on < '2025-09-01'
            AND u.dim_market_segmentation IN ('Professional Creator', 'In-House Team', 'DIY Business', 'Other')
            AND u.ts_first_subscription IS NOT NULL
    ),

    -- 12-month retention with expansion breakdown
    retention_12mo AS (
        SELECT
            o.signup_year,
            o.segment,
            r.wf_customer_id,

            -- Starting MRR (12 months ago)
            MAX(CASE WHEN r.trailing_months_offset = 12 THEN r.trailing_mrr END) AS starting_mrr,

            -- MRR movement components over 12 months
            MAX(CASE WHEN r.trailing_months_offset = 12 THEN r.expansion_mrr END) AS expansion_mrr,
            MAX(CASE WHEN r.trailing_months_offset = 12 THEN r.contraction_mrr END) AS contraction_mrr,
            MAX(CASE WHEN r.trailing_months_offset = 12 THEN r.payment_churn_mrr END) AS churn_mrr,
            MAX(CASE WHEN r.trailing_months_offset = 12 THEN r.reactivation_mrr END) AS reactivation_mrr,
            MAX(CASE WHEN r.trailing_months_offset = 12 THEN r.net_mrr END) AS net_mrr,

            -- Ending MRR
            MAX(CASE WHEN r.trailing_months_offset = 12 THEN r.trailing_mrr + r.net_mrr END) AS ending_mrr

        FROM
            organic_users o
        INNER JOIN
            analytics.webflow.report__customer_trailing_retention r
            ON o.user_id = r.user_id
        WHERE
            r.trailing_months_offset = 12
        GROUP BY 1, 2, 3
    ),

    summary AS (
        SELECT
            signup_year,
            segment,

            -- Customer counts
            COUNT(DISTINCT wf_customer_id) AS cohort_size,

            -- Total MRR values
            SUM(starting_mrr) AS total_starting_mrr,
            SUM(ending_mrr) AS total_ending_mrr,

            -- MRR movement components
            SUM(expansion_mrr) AS total_expansion_mrr,
            SUM(ABS(contraction_mrr)) AS total_contraction_mrr,
            SUM(ABS(churn_mrr)) AS total_churn_mrr,
            SUM(reactivation_mrr) AS total_reactivation_mrr,
            SUM(net_mrr) AS total_net_mrr,

            -- Calculate rates
            ROUND((SUM(ending_mrr) / NULLIF(SUM(starting_mrr), 0) * 100), 1) AS net_retention_12mo,
            ROUND((SUM(expansion_mrr) / NULLIF(SUM(starting_mrr), 0) * 100), 1) AS expansion_rate,
            ROUND((SUM(ABS(contraction_mrr)) / NULLIF(SUM(starting_mrr), 0) * 100), 1) AS contraction_rate,
            ROUND((SUM(ABS(churn_mrr)) / NULLIF(SUM(starting_mrr), 0) * 100), 1) AS churn_rate,
            ROUND(((SUM(ABS(contraction_mrr)) + SUM(ABS(churn_mrr))) / NULLIF(SUM(starting_mrr), 0) * 100), 1) AS gross_revenue_churn_rate

        FROM retention_12mo
        WHERE starting_mrr > 0
        GROUP BY 1, 2
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
        console.log('\n📊 12-MONTH EXPANSION & CHURN BREAKDOWN BY SEGMENT');
        console.log('═'.repeat(180));
        console.log('');
        console.log('Note: All rates shown as % of starting MRR');
        console.log('      NDR = Starting MRR + Expansion - Contraction - Churn + Reactivation');
        console.log('      Gross Churn = Contraction + Churn');
        console.log('═'.repeat(180));
        console.log('');

        // Group by segment
        const segments = {};
        rows.forEach(row => {
          const seg = row.SEGMENT || 'Other';
          if (!segments[seg]) segments[seg] = {};
          segments[seg][row.SIGNUP_YEAR] = row;
        });

        // Display comparison table
        console.log('Segment              │ Year │ Cohort │ Start MRR │  End MRR  │  NDR  │ Expansion │ Contract │  Churn  │ Gross Churn │ Net MRR');
        console.log('─'.repeat(180));

        Object.keys(segments).sort().forEach(segment => {
          const data2024 = segments[segment][2024] || {};
          const data2025 = segments[segment][2025] || {};

          // 2024 row
          if (data2024.COHORT_SIZE) {
            console.log(
              `${segment.padEnd(20)} │ 2024 │ ${(data2024.COHORT_SIZE || 0).toLocaleString().padStart(6)} │ $${((data2024.TOTAL_STARTING_MRR || 0) / 1000).toFixed(0)}k`.padStart(11) +
              ` │ $${((data2024.TOTAL_ENDING_MRR || 0) / 1000).toFixed(0)}k`.padStart(11) +
              ` │ ${(data2024.NET_RETENTION_12MO || 0).toFixed(1)}%`.padStart(7) +
              ` │ ${(data2024.EXPANSION_RATE || 0).toFixed(1)}%`.padStart(10) +
              ` │ ${(data2024.CONTRACTION_RATE || 0).toFixed(1)}%`.padStart(9) +
              ` │ ${(data2024.CHURN_RATE || 0).toFixed(1)}%`.padStart(8) +
              ` │ ${(data2024.GROSS_REVENUE_CHURN_RATE || 0).toFixed(1)}%`.padStart(12) +
              ` │ $${((data2024.TOTAL_NET_MRR || 0) / 1000).toFixed(0)}k`
            );
          }

          // 2025 row
          if (data2025.COHORT_SIZE) {
            console.log(
              `${segment.padEnd(20)} │ 2025 │ ${(data2025.COHORT_SIZE || 0).toLocaleString().padStart(6)} │ $${((data2025.TOTAL_STARTING_MRR || 0) / 1000).toFixed(0)}k`.padStart(11) +
              ` │ $${((data2025.TOTAL_ENDING_MRR || 0) / 1000).toFixed(0)}k`.padStart(11) +
              ` │ ${(data2025.NET_RETENTION_12MO || 0).toFixed(1)}%`.padStart(7) +
              ` │ ${(data2025.EXPANSION_RATE || 0).toFixed(1)}%`.padStart(10) +
              ` │ ${(data2025.CONTRACTION_RATE || 0).toFixed(1)}%`.padStart(9) +
              ` │ ${(data2025.CHURN_RATE || 0).toFixed(1)}%`.padStart(8) +
              ` │ ${(data2025.GROSS_REVENUE_CHURN_RATE || 0).toFixed(1)}%`.padStart(12) +
              ` │ $${((data2025.TOTAL_NET_MRR || 0) / 1000).toFixed(0)}k`
            );
          }

          // YoY change
          if (data2024.COHORT_SIZE && data2025.COHORT_SIZE) {
            const ndrChange = (data2025.NET_RETENTION_12MO || 0) - (data2024.NET_RETENTION_12MO || 0);
            const expChange = (data2025.EXPANSION_RATE || 0) - (data2024.EXPANSION_RATE || 0);
            const contrChange = (data2025.CONTRACTION_RATE || 0) - (data2024.CONTRACTION_RATE || 0);
            const churnChange = (data2025.CHURN_RATE || 0) - (data2024.CHURN_RATE || 0);
            const grossChurnChange = (data2025.GROSS_REVENUE_CHURN_RATE || 0) - (data2024.GROSS_REVENUE_CHURN_RATE || 0);

            console.log(
              `${' '.repeat(20)} │ YoY  │ ${' '.repeat(6)} │ ${' '.repeat(11)} │ ${' '.repeat(11)} │ ${ndrChange >= 0 ? '+' : ''}${ndrChange.toFixed(1)}pp`.padStart(7) +
              ` │ ${expChange >= 0 ? '+' : ''}${expChange.toFixed(1)}pp`.padStart(10) +
              ` │ ${contrChange >= 0 ? '+' : ''}${contrChange.toFixed(1)}pp`.padStart(9) +
              ` │ ${churnChange >= 0 ? '+' : ''}${churnChange.toFixed(1)}pp`.padStart(8) +
              ` │ ${grossChurnChange >= 0 ? '+' : ''}${grossChurnChange.toFixed(1)}pp`.padStart(12) +
              ` │ ${' '.repeat(8)}`
            );
          }
          console.log('─'.repeat(180));
        });

        // Key insights
        console.log('\n\n📈 KEY DRIVERS OF NDR IMPROVEMENT');
        console.log('═'.repeat(180));

        Object.keys(segments).sort().forEach(segment => {
          const data2024 = segments[segment][2024] || {};
          const data2025 = segments[segment][2025] || {};

          if (data2024.COHORT_SIZE && data2025.COHORT_SIZE) {
            console.log(`\n🎯 ${segment.toUpperCase()}`);

            const ndrChange = data2025.NET_RETENTION_12MO - data2024.NET_RETENTION_12MO;
            const expChange = data2025.EXPANSION_RATE - data2024.EXPANSION_RATE;
            const contrChange = data2025.CONTRACTION_RATE - data2024.CONTRACTION_RATE;
            const churnChange = data2025.CHURN_RATE - data2024.CHURN_RATE;

            console.log(`   12mo NDR:      ${data2024.NET_RETENTION_12MO.toFixed(1)}% → ${data2025.NET_RETENTION_12MO.toFixed(1)}% (${ndrChange >= 0 ? '📈 +' : '📉 '}${ndrChange.toFixed(1)}pp)`);
            console.log('');
            console.log(`   Drivers:`);
            console.log(`   • Expansion:   ${data2024.EXPANSION_RATE.toFixed(1)}% → ${data2025.EXPANSION_RATE.toFixed(1)}% (${expChange >= 0 ? '+' : ''}${expChange.toFixed(1)}pp) ${expChange > 0 ? '✅' : expChange < 0 ? '⚠️' : '→'}`);
            console.log(`   • Contraction: ${data2024.CONTRACTION_RATE.toFixed(1)}% → ${data2025.CONTRACTION_RATE.toFixed(1)}% (${contrChange >= 0 ? '+' : ''}${contrChange.toFixed(1)}pp) ${contrChange < 0 ? '✅' : contrChange > 0 ? '⚠️' : '→'}`);
            console.log(`   • Churn:       ${data2024.CHURN_RATE.toFixed(1)}% → ${data2025.CHURN_RATE.toFixed(1)}% (${churnChange >= 0 ? '+' : ''}${churnChange.toFixed(1)}pp) ${churnChange < 0 ? '✅' : churnChange > 0 ? '⚠️' : '→'}`);
            console.log(`   • Gross Churn: ${data2024.GROSS_REVENUE_CHURN_RATE.toFixed(1)}% → ${data2025.GROSS_REVENUE_CHURN_RATE.toFixed(1)}%`);
            console.log('');

            // Calculate contribution to NDR change
            const expContribution = expChange;
            const contrContribution = -contrChange; // Negative because less contraction is good
            const churnContribution = -churnChange; // Negative because less churn is good

            console.log(`   NDR Change Breakdown:`);
            console.log(`   • From Expansion:   ${expContribution >= 0 ? '+' : ''}${expContribution.toFixed(1)}pp`);
            console.log(`   • From Contraction: ${contrContribution >= 0 ? '+' : ''}${contrContribution.toFixed(1)}pp`);
            console.log(`   • From Churn:       ${churnContribution >= 0 ? '+' : ''}${churnContribution.toFixed(1)}pp`);
          }
        });

        console.log('\n═'.repeat(180));

      } else {
        console.log('No data found');
      }

      connection.destroy((err) => {
        if (err) console.error('Error destroying connection:', err);
      });
    },
  });
});
