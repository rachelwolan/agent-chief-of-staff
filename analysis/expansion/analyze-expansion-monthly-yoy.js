// Monthly self-serve expansion MRR by category with YoY comparison
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
    WITH monthly_expansion AS (
        SELECT
            DATE_TRUNC('month', s.period_start) AS month,
            s.customer_id,
            s.plan_object_tier,
            s.plan_sku_type,
            s.plan_name,
            SUM(s.mrr) AS total_mrr,
            -- Categorize expansion types
            CASE
                -- Workspace tier upgrades
                WHEN s.plan_object_tier IN ('workspace_plan_growth', 'workspace_plan_agency')
                    THEN 'Workspace Tier Upgrades'
                WHEN s.plan_object_tier = 'workspace_plan_core'
                    THEN 'Workspace Core'
                -- User seat add-ons
                WHEN s.plan_name LIKE '%Full Add-on%' OR s.plan_name LIKE '%Full Seat%'
                    THEN 'User Seats (Full)'
                WHEN s.plan_name LIKE '%Limited Add-on%' OR s.plan_name LIKE '%Limited Seat%'
                    THEN 'User Seats (Limited)'
                -- Hosting plans
                WHEN s.plan_sku_type = 'hosting' AND s.plan_object_tier LIKE 'site_plan_%'
                    THEN 'Site Hosting Plans'
                -- Add-ons
                WHEN s.plan_name LIKE '%Bandwidth%'
                    THEN 'Bandwidth Add-ons'
                WHEN s.plan_name LIKE '%Localization%'
                    THEN 'Localization Add-ons'
                WHEN s.plan_name LIKE '%CMS Items%'
                    THEN 'CMS Items Add-ons'
                -- Ecommerce
                WHEN s.plan_sku_type = 'ecomm'
                    THEN 'Ecommerce Plans'
                -- Enterprise
                WHEN s.plan_object_tier LIKE '%enterprise%' OR s.plan_name LIKE '%Enterprise%'
                    THEN 'Enterprise'
                -- Other
                ELSE 'Other'
            END AS expansion_category
        FROM
            analytics.webflow.fct_subscription_line_item_mrr s
        WHERE
            s.is_paid_invoice = TRUE
            AND s.mrr > 0
            AND s.period_start >= '2023-01-01'
            AND s.period_start < '2025-09-01'
            -- Exclude enterprise billing (sales-assisted)
            AND s.is_enterprise_subscription_item = FALSE
        GROUP BY 1, 2, 3, 4, 5, 7
    ),

    mrr_with_previous AS (
        SELECT
            month,
            customer_id,
            expansion_category,
            total_mrr,
            LAG(total_mrr) OVER (PARTITION BY customer_id ORDER BY month) AS prev_month_mrr
        FROM monthly_expansion
    ),

    expansion_events AS (
        SELECT
            month,
            customer_id,
            expansion_category,
            total_mrr,
            prev_month_mrr,
            (total_mrr - prev_month_mrr) AS expansion_mrr
        FROM mrr_with_previous
        WHERE
            prev_month_mrr IS NOT NULL
            AND total_mrr > prev_month_mrr
            AND (total_mrr - prev_month_mrr) >= 1
    ),

    monthly_summary AS (
        SELECT
            month,
            expansion_category,
            SUM(expansion_mrr) AS total_expansion_mrr,
            COUNT(DISTINCT customer_id) AS customers_expanded
        FROM expansion_events
        GROUP BY 1, 2
    )

    SELECT * FROM monthly_summary
    ORDER BY month DESC, total_expansion_mrr DESC
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
        console.log('\n📊 MONTHLY SELF-SERVE EXPANSION MRR BY CATEGORY');
        console.log('═'.repeat(180));
        console.log('');
        console.log('Note: Excludes enterprise billing (sales-assisted)');
        console.log('      Shows month-over-month MRR increases by expansion type');
        console.log('═'.repeat(180));
        console.log('');

        // Group by month and category
        const monthlyData = {};
        const categories = new Set();

        rows.forEach(row => {
          const month = new Date(row.MONTH);
          const monthKey = month.toISOString().substring(0, 7); // YYYY-MM
          const category = row.EXPANSION_CATEGORY;

          categories.add(category);

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              date: month,
              categories: {},
              total: 0,
              customers: 0
            };
          }

          monthlyData[monthKey].categories[category] = {
            mrr: row.TOTAL_EXPANSION_MRR,
            customers: row.CUSTOMERS_EXPANDED
          };
          monthlyData[monthKey].total += row.TOTAL_EXPANSION_MRR;
          monthlyData[monthKey].customers += row.CUSTOMERS_EXPANDED;
        });

        // Sort months
        const sortedMonths = Object.keys(monthlyData).sort();

        // Display by category
        const categoryList = Array.from(categories).sort();

        console.log('\n━━━ EXPANSION BY CATEGORY (Monthly Trend) ━━━\n');

        categoryList.forEach(category => {
          console.log(`\n📈 ${category.toUpperCase()}`);
          console.log('─'.repeat(180));
          console.log('Month        │ 2023 MRR │ 2024 MRR │ 2025 MRR │ 2024 vs 2023 │ 2025 vs 2024 │ Customers 2023 │ Customers 2024 │ Customers 2025');
          console.log('─'.repeat(180));

          // Group by month name (Jan, Feb, etc) for YoY comparison
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

          monthNames.forEach(monthName => {
            const m2023 = monthlyData[`2023-${monthNames.indexOf(monthName) + 1}`.padStart(7, '0')]?.categories[category];
            const m2024 = monthlyData[`2024-${monthNames.indexOf(monthName) + 1}`.padStart(7, '0')]?.categories[category];
            const m2025 = monthlyData[`2025-${monthNames.indexOf(monthName) + 1}`.padStart(7, '0')]?.categories[category];

            if (m2023 || m2024 || m2025) {
              const mrr2023 = m2023?.mrr || 0;
              const mrr2024 = m2024?.mrr || 0;
              const mrr2025 = m2025?.mrr || 0;

              const change2024 = mrr2024 - mrr2023;
              const change2025 = mrr2025 - mrr2024;

              const cust2023 = m2023?.customers || 0;
              const cust2024 = m2024?.customers || 0;
              const cust2025 = m2025?.customers || 0;

              console.log(
                `${monthName.padEnd(12)} │ ${mrr2023 > 0 ? ('$' + (mrr2023 / 1000).toFixed(1) + 'k').padStart(8) : '—'.padStart(8)} │ ${mrr2024 > 0 ? ('$' + (mrr2024 / 1000).toFixed(1) + 'k').padStart(8) : '—'.padStart(8)} │ ${mrr2025 > 0 ? ('$' + (mrr2025 / 1000).toFixed(1) + 'k').padStart(8) : '—'.padStart(8)} │ ${mrr2023 > 0 ? (change2024 >= 0 ? '+' : '') + (change2024 / 1000).toFixed(1) + 'k' : '—'} `.padEnd(14) +
                `│ ${mrr2024 > 0 ? (change2025 >= 0 ? '+' : '') + (change2025 / 1000).toFixed(1) + 'k' : '—'} `.padEnd(14) +
                `│ ${cust2023.toLocaleString().padStart(14)} │ ${cust2024.toLocaleString().padStart(14)} │ ${cust2025.toLocaleString().padStart(14)}`
              );
            }
          });
        });

        // Total expansion summary
        console.log('\n\n━━━ TOTAL SELF-SERVE EXPANSION ━━━\n');
        console.log('Month        │ 2023 Total │ 2024 Total │ 2025 Total │ YoY Change │ Total Customers');
        console.log('─'.repeat(180));

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        monthNames.forEach(monthName => {
          const monthIdx = monthNames.indexOf(monthName) + 1;
          const m2023Key = `2023-${monthIdx.toString().padStart(2, '0')}`;
          const m2024Key = `2024-${monthIdx.toString().padStart(2, '0')}`;
          const m2025Key = `2025-${monthIdx.toString().padStart(2, '0')}`;

          const m2023 = monthlyData[m2023Key];
          const m2024 = monthlyData[m2024Key];
          const m2025 = monthlyData[m2025Key];

          if (m2023 || m2024 || m2025) {
            const total2023 = m2023?.total || 0;
            const total2024 = m2024?.total || 0;
            const total2025 = m2025?.total || 0;

            const change = total2024 - total2023;
            const changePct = total2023 > 0 ? ((change / total2023) * 100) : 0;

            const totalCust = (m2023?.customers || 0) + (m2024?.customers || 0) + (m2025?.customers || 0);

            console.log(
              `${monthName.padEnd(12)} │ ${total2023 > 0 ? ('$' + (total2023 / 1000).toFixed(1) + 'k').padStart(10) : '—'.padStart(10)} │ ${total2024 > 0 ? ('$' + (total2024 / 1000).toFixed(1) + 'k').padStart(10) : '—'.padStart(10)} │ ${total2025 > 0 ? ('$' + (total2025 / 1000).toFixed(1) + 'k').padStart(10) : '—'.padStart(10)} │ ${total2023 > 0 ? (change >= 0 ? '+' : '') + changePct.toFixed(1) + '%' : '—'} `.padEnd(12) +
              `│ ${totalCust.toLocaleString().padStart(15)}`
            );
          }
        });

        // Annual summary
        console.log('\n\n═'.repeat(180));
        console.log('📊 ANNUAL SUMMARY');
        console.log('═'.repeat(180));

        let total2023 = 0, total2024 = 0, total2025 = 0;

        categoryList.forEach(category => {
          let cat2023 = 0, cat2024 = 0, cat2025 = 0;

          sortedMonths.forEach(monthKey => {
            const year = monthKey.substring(0, 4);
            const mrr = monthlyData[monthKey].categories[category]?.mrr || 0;

            if (year === '2023') cat2023 += mrr;
            if (year === '2024') cat2024 += mrr;
            if (year === '2025') cat2025 += mrr;
          });

          total2023 += cat2023;
          total2024 += cat2024;
          total2025 += cat2025;

          if (cat2023 > 1000 || cat2024 > 1000 || cat2025 > 1000) {
            const change = cat2024 - cat2023;
            console.log(
              `\n${category.padEnd(30)} │ 2023: $${(cat2023 / 1000).toFixed(1)}k │ 2024: $${(cat2024 / 1000).toFixed(1)}k │ 2025 YTD: $${(cat2025 / 1000).toFixed(1)}k │ YoY: ${change >= 0 ? '+' : ''}${(change / 1000).toFixed(1)}k (${((change / cat2023) * 100).toFixed(1)}%)`
            );
          }
        });

        const totalChange = total2024 - total2023;
        console.log('\n' + '─'.repeat(180));
        console.log(
          `${'TOTAL'.padEnd(30)} │ 2023: $${(total2023 / 1000).toFixed(1)}k │ 2024: $${(total2024 / 1000).toFixed(1)}k │ 2025 YTD: $${(total2025 / 1000).toFixed(1)}k │ YoY: ${totalChange >= 0 ? '+' : ''}${(totalChange / 1000).toFixed(1)}k (${((totalChange / total2023) * 100).toFixed(1)}%)`
        );
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
