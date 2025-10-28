// Compare workspace plan growth vs user plan growth expansion impact
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
            AND u.created_on < '2025-01-01'
            AND u.dim_market_segmentation IN ('Professional Creator', 'In-House Team', 'DIY Business', 'Other')
            AND u.ts_first_subscription IS NOT NULL
    ),

    user_customers AS (
        SELECT
            o.signup_year,
            o.segment,
            o.user_id,
            o.ts_first_subscription,
            uc.customer_id
        FROM
            organic_users o
        INNER JOIN
            analytics.webflow.report__users_workspaces_customers uc
            ON o.user_id = uc.user_id
        WHERE
            uc.customer_id IS NOT NULL
    ),

    customer_monthly_mrr AS (
        SELECT
            uc.signup_year,
            uc.segment,
            uc.customer_id,
            DATE_TRUNC('month', s.period_start) AS month,
            s.plan_name,
            s.plan_object_tier,
            s.plan_sku_type,
            SUM(s.mrr) AS total_mrr,
            -- Categorize into old vs new model
            CASE
                WHEN s.plan_object_tier IN ('workspace_plan_growth', 'workspace_plan_core', 'workspace_plan_agency')
                    THEN 'workspace_based'
                WHEN s.plan_name LIKE '%Full Add-on%' OR s.plan_name LIKE '%Limited Add-on%'
                    OR s.plan_object_tier LIKE '%seat%'
                    THEN 'user_seat_based'
                ELSE 'other'
            END AS plan_model
        FROM
            user_customers uc
        INNER JOIN
            analytics.webflow.fct_subscription_line_item_mrr s
            ON uc.customer_id = s.customer_id
        WHERE
            s.is_paid_invoice = TRUE
            AND s.mrr > 0
            AND s.period_start >= uc.ts_first_subscription
        GROUP BY 1, 2, 3, 4, 5, 6, 7, 9
    ),

    mrr_with_previous AS (
        SELECT
            signup_year,
            segment,
            customer_id,
            month,
            plan_name,
            plan_object_tier,
            plan_sku_type,
            plan_model,
            total_mrr,
            LAG(total_mrr) OVER (PARTITION BY customer_id ORDER BY month) AS prev_month_mrr
        FROM customer_monthly_mrr
    ),

    expansion_events AS (
        SELECT
            signup_year,
            segment,
            customer_id,
            month,
            plan_name,
            plan_object_tier,
            plan_model,
            total_mrr,
            prev_month_mrr,
            (total_mrr - prev_month_mrr) AS mrr_increase
        FROM mrr_with_previous
        WHERE
            prev_month_mrr IS NOT NULL
            AND total_mrr > prev_month_mrr
            AND (total_mrr - prev_month_mrr) >= 1
    ),

    summary AS (
        SELECT
            signup_year,
            segment,
            plan_model,
            COUNT(DISTINCT customer_id) AS customers_expanded,
            SUM(mrr_increase) AS total_expansion_mrr,
            AVG(mrr_increase) AS avg_expansion_amount
        FROM expansion_events
        GROUP BY 1, 2, 3
    )

    SELECT * FROM summary
    ORDER BY signup_year DESC, segment ASC, total_expansion_mrr DESC
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
        console.log('\n📊 WORKSPACE-BASED vs USER-SEAT-BASED EXPANSION COMPARISON');
        console.log('═'.repeat(160));
        console.log('');
        console.log('Workspace-based: Core/Growth/Agency workspace tiers');
        console.log('User-seat-based: Full/Limited seat add-ons');
        console.log('═'.repeat(160));
        console.log('');

        // Group data
        const data = {};
        rows.forEach(row => {
          const year = row.SIGNUP_YEAR;
          const seg = row.SEGMENT;
          const model = row.PLAN_MODEL;
          if (!data[year]) data[year] = {};
          if (!data[year][seg]) data[year][seg] = {};
          data[year][seg][model] = row;
        });

        // Display by segment
        ['Professional Creator', 'In-House Team', 'DIY Business', 'Other'].forEach(segment => {
          console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`🎯 ${segment.toUpperCase()}`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log('');
          console.log('Model            │ Year │ Customers │ Total Exp MRR │ Avg Expansion │ YoY Change');
          console.log('─'.repeat(160));

          const data2023 = data[2023]?.[segment] || {};
          const data2024 = data[2024]?.[segment] || {};

          // Workspace-based
          const ws2023 = data2023.workspace_based || {};
          const ws2024 = data2024.workspace_based || {};

          if (ws2023.TOTAL_EXPANSION_MRR || ws2024.TOTAL_EXPANSION_MRR) {
            console.log(`Workspace-based  │ 2023 │ ${(ws2023.CUSTOMERS_EXPANDED || 0).toLocaleString().padStart(9)} │ $${((ws2023.TOTAL_EXPANSION_MRR || 0) / 1000).toFixed(1)}k`.padStart(14) + ` │ $${(ws2023.AVG_EXPANSION_AMOUNT || 0).toFixed(0).padStart(6)}`.padStart(14) + ` │ ${' '.repeat(10)}`);
            console.log(`Workspace-based  │ 2024 │ ${(ws2024.CUSTOMERS_EXPANDED || 0).toLocaleString().padStart(9)} │ $${((ws2024.TOTAL_EXPANSION_MRR || 0) / 1000).toFixed(1)}k`.padStart(14) + ` │ $${(ws2024.AVG_EXPANSION_AMOUNT || 0).toFixed(0).padStart(6)}`.padStart(14) + ` │ ${ws2023.TOTAL_EXPANSION_MRR ? ((ws2024.TOTAL_EXPANSION_MRR || 0) - (ws2023.TOTAL_EXPANSION_MRR || 0) >= 0 ? '+' : '') + (((ws2024.TOTAL_EXPANSION_MRR || 0) - (ws2023.TOTAL_EXPANSION_MRR || 0)) / 1000).toFixed(1) + 'k' : '—'}`);
            console.log('─'.repeat(160));
          }

          // User-seat-based
          const us2023 = data2023.user_seat_based || {};
          const us2024 = data2024.user_seat_based || {};

          if (us2023.TOTAL_EXPANSION_MRR || us2024.TOTAL_EXPANSION_MRR) {
            console.log(`User-seat-based  │ 2023 │ ${(us2023.CUSTOMERS_EXPANDED || 0).toLocaleString().padStart(9)} │ $${((us2023.TOTAL_EXPANSION_MRR || 0) / 1000).toFixed(1)}k`.padStart(14) + ` │ $${(us2023.AVG_EXPANSION_AMOUNT || 0).toFixed(0).padStart(6)}`.padStart(14) + ` │ ${' '.repeat(10)}`);
            console.log(`User-seat-based  │ 2024 │ ${(us2024.CUSTOMERS_EXPANDED || 0).toLocaleString().padStart(9)} │ $${((us2024.TOTAL_EXPANSION_MRR || 0) / 1000).toFixed(1)}k`.padStart(14) + ` │ $${(us2024.AVG_EXPANSION_AMOUNT || 0).toFixed(0).padStart(6)}`.padStart(14) + ` │ ${us2023.TOTAL_EXPANSION_MRR ? ((us2024.TOTAL_EXPANSION_MRR || 0) - (us2023.TOTAL_EXPANSION_MRR || 0) >= 0 ? '+' : '') + (((us2024.TOTAL_EXPANSION_MRR || 0) - (us2023.TOTAL_EXPANSION_MRR || 0)) / 1000).toFixed(1) + 'k' : '—'}`);
            console.log('─'.repeat(160));
          }

          // Net impact
          const total2023 = (ws2023.TOTAL_EXPANSION_MRR || 0) + (us2023.TOTAL_EXPANSION_MRR || 0);
          const total2024 = (ws2024.TOTAL_EXPANSION_MRR || 0) + (us2024.TOTAL_EXPANSION_MRR || 0);
          const netChange = total2024 - total2023;

          console.log(`TOTAL            │ 2023 │ ${' '.repeat(9)} │ $${(total2023 / 1000).toFixed(1)}k`.padStart(14) + ` │ ${' '.repeat(14)} │ ${' '.repeat(10)}`);
          console.log(`TOTAL            │ 2024 │ ${' '.repeat(9)} │ $${(total2024 / 1000).toFixed(1)}k`.padStart(14) + ` │ ${' '.repeat(14)} │ ${netChange >= 0 ? '+' : ''}${(netChange / 1000).toFixed(1)}k (${((netChange / total2023) * 100).toFixed(1)}%)`);
        });

        // Summary
        console.log('\n\n═'.repeat(160));
        console.log('📈 FINANCIAL IMPACT SUMMARY');
        console.log('═'.repeat(160));

        ['Professional Creator', 'In-House Team', 'DIY Business', 'Other'].forEach(segment => {
          const data2023 = data[2023]?.[segment] || {};
          const data2024 = data[2024]?.[segment] || {};

          const ws2023 = data2023.workspace_based || {};
          const ws2024 = data2024.workspace_based || {};
          const us2023 = data2023.user_seat_based || {};
          const us2024 = data2024.user_seat_based || {};

          const wsChange = (ws2024.TOTAL_EXPANSION_MRR || 0) - (ws2023.TOTAL_EXPANSION_MRR || 0);
          const usChange = (us2024.TOTAL_EXPANSION_MRR || 0) - (us2023.TOTAL_EXPANSION_MRR || 0);
          const netChange = wsChange + usChange;

          if (Math.abs(netChange) > 1000) {
            console.log(`\n🎯 ${segment.toUpperCase()}`);
            console.log(`   Workspace-based change: ${wsChange >= 0 ? '+' : ''}$${(wsChange / 1000).toFixed(1)}k`);
            console.log(`   User-seat-based change: ${usChange >= 0 ? '+' : ''}$${(usChange / 1000).toFixed(1)}k`);
            console.log(`   NET IMPACT: ${netChange >= 0 ? '✅ +' : '⚠️  '}$${(netChange / 1000).toFixed(1)}k (${((netChange / (ws2023.TOTAL_EXPANSION_MRR + us2023.TOTAL_EXPANSION_MRR)) * 100).toFixed(1)}%)`);
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
