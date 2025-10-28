// Top SKUs driving expansion by segment
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
            u.stripe_customer_id,
            u.ts_first_subscription
        FROM
            analytics.webflow.dim_user_attributions u
        WHERE
            u.dim_signup_attribution = 'organic'
            AND u.created_on >= '2023-01-01'
            AND u.created_on < '2025-01-01'  -- Full years only
            AND u.dim_market_segmentation IN ('Professional Creator', 'In-House Team', 'DIY Business', 'Other')
            AND u.ts_first_subscription IS NOT NULL
            AND u.stripe_customer_id IS NOT NULL
    ),

    -- Get monthly customer MRR by plan using invoice data
    customer_monthly_mrr AS (
        SELECT
            o.signup_year,
            o.segment,
            s.customer_id,
            DATE_TRUNC('month', s.period_start) AS month,
            s.plan_name,
            s.plan_object_tier,
            s.plan_sku_type,
            SUM(s.mrr) AS total_mrr
        FROM
            organic_users o
        INNER JOIN
            analytics.webflow.fct_subscription_line_item_mrr s
            ON o.stripe_customer_id = s.customer_id
        WHERE
            s.is_paid_invoice = TRUE
            AND s.mrr > 0
            AND s.period_start >= o.ts_first_subscription
        GROUP BY 1, 2, 3, 4, 5, 6, 7
    ),

    -- Track MRR changes month over month
    mrr_with_previous AS (
        SELECT
            signup_year,
            segment,
            customer_id,
            month,
            plan_name,
            plan_object_tier,
            plan_sku_type,
            total_mrr,
            LAG(total_mrr) OVER (PARTITION BY customer_id ORDER BY month) AS prev_month_mrr,
            LAG(plan_object_tier) OVER (PARTITION BY customer_id ORDER BY month) AS prev_tier
        FROM customer_monthly_mrr
    ),

    -- Identify expansion events
    expansion_events AS (
        SELECT
            signup_year,
            segment,
            customer_id,
            month,
            plan_name,
            plan_object_tier,
            plan_sku_type,
            prev_tier,
            total_mrr,
            prev_month_mrr,
            (total_mrr - prev_month_mrr) AS mrr_increase
        FROM mrr_with_previous
        WHERE
            prev_month_mrr IS NOT NULL
            AND total_mrr > prev_month_mrr
            AND (total_mrr - prev_month_mrr) >= 1  -- At least $1 increase
    ),

    -- Aggregate by plan/tier
    sku_summary AS (
        SELECT
            signup_year,
            segment,
            plan_object_tier AS sku,
            plan_sku_type AS sku_type,
            COUNT(DISTINCT customer_id) AS customers_expanded_to_sku,
            SUM(mrr_increase) AS total_expansion_mrr,
            AVG(mrr_increase) AS avg_expansion_amount,
            AVG(total_mrr) AS avg_new_mrr
        FROM expansion_events
        GROUP BY 1, 2, 3, 4
    )

    SELECT
        signup_year,
        segment,
        sku,
        sku_type,
        customers_expanded_to_sku,
        total_expansion_mrr,
        avg_expansion_amount,
        avg_new_mrr,
        RANK() OVER (PARTITION BY signup_year, segment ORDER BY total_expansion_mrr DESC) AS expansion_rank
    FROM sku_summary
    WHERE customers_expanded_to_sku >= 5  -- At least 5 customers
    QUALIFY expansion_rank <= 10  -- Top 10 SKUs per segment
    ORDER BY signup_year DESC, segment ASC, expansion_rank ASC
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
        console.log('\n📊 TOP EXPANSION SKUs BY SEGMENT');
        console.log('═'.repeat(180));
        console.log('');
        console.log('Note: Shows SKUs customers expanded INTO (not from)');
        console.log('      Ranked by total expansion MRR generated');
        console.log('═'.repeat(180));
        console.log('');

        // Group by year and segment
        const data = {};
        rows.forEach(row => {
          const year = row.SIGNUP_YEAR;
          const seg = row.SEGMENT || 'Other';
          if (!data[year]) data[year] = {};
          if (!data[year][seg]) data[year][seg] = [];
          data[year][seg].push(row);
        });

        // Display by year and segment
        Object.keys(data).sort().reverse().forEach(year => {
          console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`📅 ${year} COHORT`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

          Object.keys(data[year]).sort().forEach(segment => {
            const skus = data[year][segment];

            console.log(`\n🎯 ${segment.toUpperCase()}`);
            console.log('─'.repeat(180));
            console.log('Rank │ SKU Name                                      │ Customers │ Total Exp MRR │ Avg Exp Amount │ Avg New MRR');
            console.log('─'.repeat(180));

            skus.forEach(sku => {
              const rank = sku.EXPANSION_RANK;
              const name = (sku.SKU || 'Unknown').substring(0, 45);
              const skuType = sku.SKU_TYPE ? ` (${sku.SKU_TYPE})` : '';
              const customers = sku.CUSTOMERS_EXPANDED_TO_SKU;
              const totalMrr = sku.TOTAL_EXPANSION_MRR;
              const avgExp = sku.AVG_EXPANSION_AMOUNT;
              const avgNew = sku.AVG_NEW_MRR;

              console.log(
                `  ${rank.toString().padStart(2)}  │ ${(name + skuType).substring(0, 45).padEnd(45)} │ ${customers.toLocaleString().padStart(9)} │ $${(totalMrr / 1000).toFixed(1)}k`.padStart(14) +
                ` │ $${avgExp.toFixed(0).padStart(6)}`.padStart(9) +
                ` │ $${avgNew.toFixed(0).padStart(6)}`
              );
            });
          });
        });

        console.log('\n\n═'.repeat(180));
        console.log('\n📈 KEY INSIGHTS');
        console.log('═'.repeat(180));

        // Compare 2023 vs 2024 top SKUs
        if (data[2023] && data[2024]) {
          Object.keys(data[2024]).sort().forEach(segment => {
            if (data[2023][segment]) {
              console.log(`\n🎯 ${segment.toUpperCase()}: 2023 vs 2024 Comparison`);

              const top2024 = data[2024][segment][0];
              const top2023 = data[2023][segment][0];

              console.log(`   Top SKU 2024: ${top2024.SKU} ($${(top2024.TOTAL_EXPANSION_MRR / 1000).toFixed(1)}k expansion MRR)`);
              console.log(`   Top SKU 2023: ${top2023.SKU} ($${(top2023.TOTAL_EXPANSION_MRR / 1000).toFixed(1)}k expansion MRR)`);

              if (top2024.SKU === top2023.SKU) {
                const change = ((top2024.TOTAL_EXPANSION_MRR - top2023.TOTAL_EXPANSION_MRR) / top2023.TOTAL_EXPANSION_MRR * 100);
                console.log(`   📊 Same top SKU, ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)}% YoY`);
              } else {
                console.log(`   🔄 Different top expansion SKU between years`);
              }
            }
          });
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
