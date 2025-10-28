// Compare organic vs paid cohort expansion performance
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
    WITH user_cohorts AS (
        SELECT
            YEAR(u.created_on) AS signup_year,
            u.dim_signup_attribution,
            u.dim_market_segmentation AS segment,
            u.user_id,
            u.ts_first_subscription,
            -- Categorize attribution
            CASE
                WHEN u.dim_signup_attribution = 'organic' THEN 'Organic'
                WHEN u.dim_signup_attribution = 'paid' THEN 'Paid'
                ELSE 'Other'
            END AS attribution_category
        FROM
            analytics.webflow.dim_user_attributions u
        WHERE
            u.created_on >= '2023-01-01'
            AND u.created_on < '2025-01-01'
            AND u.dim_market_segmentation IN ('Professional Creator', 'In-House Team', 'DIY Business', 'Other')
            AND u.ts_first_subscription IS NOT NULL
    ),

    user_customers AS (
        SELECT
            c.signup_year,
            c.attribution_category,
            c.segment,
            c.user_id,
            c.ts_first_subscription,
            uc.customer_id
        FROM
            user_cohorts c
        INNER JOIN
            analytics.webflow.report__users_workspaces_customers uc
            ON c.user_id = uc.user_id
        WHERE
            uc.customer_id IS NOT NULL
    ),

    customer_monthly_mrr AS (
        SELECT
            uc.signup_year,
            uc.attribution_category,
            uc.segment,
            uc.customer_id,
            DATE_TRUNC('month', s.period_start) AS month,
            s.plan_object_tier,
            SUM(s.mrr) AS total_mrr,
            -- Categorize expansion type
            CASE
                WHEN s.plan_object_tier IN ('workspace_plan_growth', 'workspace_plan_agency')
                    THEN 'workspace_tier'
                WHEN s.plan_name LIKE '%Full Add-on%' OR s.plan_name LIKE '%Seat%'
                    THEN 'user_seats'
                WHEN s.plan_sku_type = 'hosting'
                    THEN 'hosting'
                WHEN s.plan_name LIKE '%Bandwidth%' OR s.plan_name LIKE '%Localization%'
                    THEN 'add_ons'
                ELSE 'other'
            END AS expansion_type
        FROM
            user_customers uc
        INNER JOIN
            analytics.webflow.fct_subscription_line_item_mrr s
            ON uc.customer_id = s.customer_id
        WHERE
            s.is_paid_invoice = TRUE
            AND s.mrr > 0
            AND s.period_start >= uc.ts_first_subscription
        GROUP BY 1, 2, 3, 4, 5, 6, 8
    ),

    mrr_with_previous AS (
        SELECT
            signup_year,
            attribution_category,
            segment,
            customer_id,
            month,
            expansion_type,
            total_mrr,
            LAG(total_mrr) OVER (PARTITION BY customer_id ORDER BY month) AS prev_month_mrr
        FROM customer_monthly_mrr
    ),

    expansion_events AS (
        SELECT
            signup_year,
            attribution_category,
            segment,
            customer_id,
            month,
            expansion_type,
            total_mrr,
            prev_month_mrr,
            (total_mrr - prev_month_mrr) AS expansion_mrr
        FROM mrr_with_previous
        WHERE
            prev_month_mrr IS NOT NULL
            AND total_mrr > prev_month_mrr
            AND (total_mrr - prev_month_mrr) >= 1
    ),

    summary AS (
        SELECT
            signup_year,
            attribution_category,
            segment,
            expansion_type,
            SUM(expansion_mrr) AS total_expansion_mrr,
            COUNT(DISTINCT customer_id) AS customers_expanded,
            AVG(expansion_mrr) AS avg_expansion_amount
        FROM expansion_events
        GROUP BY 1, 2, 3, 4
    )

    SELECT * FROM summary
    ORDER BY signup_year DESC, attribution_category, segment, total_expansion_mrr DESC
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
        console.log('\n📊 ORGANIC vs PAID COHORT EXPANSION COMPARISON');
        console.log('═'.repeat(180));
        console.log('');
        console.log('Comparing expansion performance by signup attribution');
        console.log('═'.repeat(180));
        console.log('');

        // Organize data
        const data = {};
        rows.forEach(row => {
          const year = row.SIGNUP_YEAR;
          const attr = row.ATTRIBUTION_CATEGORY;
          const seg = row.SEGMENT;
          const type = row.EXPANSION_TYPE;

          if (!data[year]) data[year] = {};
          if (!data[year][attr]) data[year][attr] = {};
          if (!data[year][attr][seg]) data[year][attr][seg] = {};

          data[year][attr][seg][type] = {
            mrr: row.TOTAL_EXPANSION_MRR,
            customers: row.CUSTOMERS_EXPANDED,
            avg: row.AVG_EXPANSION_AMOUNT
          };
        });

        // Display by segment
        ['Professional Creator', 'In-House Team', 'DIY Business', 'Other'].forEach(segment => {
          console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`🎯 ${segment.toUpperCase()}`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log('');
          console.log('Attribution  │ Year │ Expansion Type    │ Customers │ Total Exp MRR │ Avg Expansion │ YoY Change');
          console.log('─'.repeat(180));

          ['Organic', 'Paid'].forEach(attr => {
            const data2023 = data[2023]?.[attr]?.[segment] || {};
            const data2024 = data[2024]?.[attr]?.[segment] || {};

            // Calculate totals
            const expansionTypes = ['workspace_tier', 'user_seats', 'hosting', 'add_ons', 'other'];

            let total2023 = 0, total2024 = 0, cust2023 = 0, cust2024 = 0;
            expansionTypes.forEach(type => {
              total2023 += data2023[type]?.mrr || 0;
              total2024 += data2024[type]?.mrr || 0;
              cust2023 += data2023[type]?.customers || 0;
              cust2024 += data2024[type]?.customers || 0;
            });

            if (total2023 > 1000 || total2024 > 1000) {
              // 2023
              console.log(`${attr.padEnd(12)} │ 2023 │ ${'TOTAL'.padEnd(17)} │ ${cust2023.toLocaleString().padStart(9)} │ $${(total2023 / 1000).toFixed(1)}k`.padStart(14) + ` │ $${(total2023 / cust2023).toFixed(0).padStart(6)}`.padStart(14) + ` │ ${' '.repeat(10)}`);

              // 2024
              const change = total2024 - total2023;
              const changePct = total2023 > 0 ? ((change / total2023) * 100) : 0;
              console.log(`${attr.padEnd(12)} │ 2024 │ ${'TOTAL'.padEnd(17)} │ ${cust2024.toLocaleString().padStart(9)} │ $${(total2024 / 1000).toFixed(1)}k`.padStart(14) + ` │ $${(total2024 / cust2024).toFixed(0).padStart(6)}`.padStart(14) + ` │ ${change >= 0 ? '+' : ''}${(change / 1000).toFixed(1)}k (${changePct.toFixed(1)}%)`);

              // Breakdown by type
              expansionTypes.forEach(type => {
                const mrr2023 = data2023[type]?.mrr || 0;
                const mrr2024 = data2024[type]?.mrr || 0;
                const customers2024 = data2024[type]?.customers || 0;

                if (mrr2024 > 5000) {
                  const typeLabel = type.replace('_', ' ');
                  console.log(`${' '.padEnd(12)} │ 2024 │ ${('  → ' + typeLabel).padEnd(17)} │ ${customers2024.toLocaleString().padStart(9)} │ $${(mrr2024 / 1000).toFixed(1)}k`.padStart(14) + ` │ ${' '.repeat(14)} │ ${' '.repeat(10)}`);
                }
              });

              console.log('─'.repeat(180));
            }
          });
        });

        // High-level summary
        console.log('\n\n═'.repeat(180));
        console.log('📈 HIGH-LEVEL SUMMARY: ORGANIC vs PAID');
        console.log('═'.repeat(180));

        ['Organic', 'Paid'].forEach(attr => {
          let total2023 = 0, total2024 = 0;

          Object.keys(data[2023]?.[attr] || {}).forEach(seg => {
            Object.keys(data[2023][attr][seg]).forEach(type => {
              total2023 += data[2023][attr][seg][type].mrr;
            });
          });

          Object.keys(data[2024]?.[attr] || {}).forEach(seg => {
            Object.keys(data[2024][attr][seg]).forEach(type => {
              total2024 += data[2024][attr][seg][type].mrr;
            });
          });

          const change = total2024 - total2023;
          const changePct = total2023 > 0 ? ((change / total2023) * 100) : 0;

          console.log(`\n${attr.toUpperCase()}`);
          console.log(`   2023: $${(total2023 / 1000).toFixed(1)}k`);
          console.log(`   2024: $${(total2024 / 1000).toFixed(1)}k`);
          console.log(`   Change: ${change >= 0 ? '+' : ''}$${(change / 1000).toFixed(1)}k (${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%)`);
        });

        console.log('\n═'.repeat(180));

        // Key insights
        console.log('\n💡 KEY INSIGHTS');
        console.log('═'.repeat(180));

        // Calculate organic vs paid performance
        let organicTotal2023 = 0, organicTotal2024 = 0;
        let paidTotal2023 = 0, paidTotal2024 = 0;

        Object.keys(data[2023]?.['Organic'] || {}).forEach(seg => {
          Object.keys(data[2023]['Organic'][seg]).forEach(type => {
            organicTotal2023 += data[2023]['Organic'][seg][type].mrr;
          });
        });

        Object.keys(data[2024]?.['Organic'] || {}).forEach(seg => {
          Object.keys(data[2024]['Organic'][seg]).forEach(type => {
            organicTotal2024 += data[2024]['Organic'][seg][type].mrr;
          });
        });

        Object.keys(data[2023]?.['Paid'] || {}).forEach(seg => {
          Object.keys(data[2023]['Paid'][seg]).forEach(type => {
            paidTotal2023 += data[2023]['Paid'][seg][type].mrr;
          });
        });

        Object.keys(data[2024]?.['Paid'] || {}).forEach(seg => {
          Object.keys(data[2024]['Paid'][seg]).forEach(type => {
            paidTotal2024 += data[2024]['Paid'][seg][type].mrr;
          });
        });

        const organicChange = organicTotal2024 - organicTotal2023;
        const paidChange = paidTotal2024 - paidTotal2023;

        console.log('\n1. ORGANIC COHORTS:');
        console.log(`   • ${organicChange >= 0 ? '✅' : '⚠️ '} Expansion ${organicChange >= 0 ? 'grew' : 'declined'} by $${Math.abs(organicChange / 1000).toFixed(1)}k (${((organicChange / organicTotal2023) * 100).toFixed(1)}%)`);

        console.log('\n2. PAID COHORTS:');
        console.log(`   • ${paidChange >= 0 ? '✅' : '⚠️ '} Expansion ${paidChange >= 0 ? 'grew' : 'declined'} by $${Math.abs(paidChange / 1000).toFixed(1)}k (${((paidChange / paidTotal2023) * 100).toFixed(1)}%)`);

        console.log('\n3. RELATIVE PERFORMANCE:');
        if (paidChange > organicChange) {
          console.log(`   • ⚠️  Paid cohorts expanding ${(paidChange - organicChange) / 1000 >= 0 ? '+' : ''}${((paidChange - organicChange) / 1000).toFixed(1)}k MORE than organic`);
        } else {
          console.log(`   • ✅ Organic cohorts expanding ${(organicChange - paidChange) / 1000 >= 0 ? '+' : ''}${((organicChange - paidChange) / 1000).toFixed(1)}k MORE than paid`);
        }

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
