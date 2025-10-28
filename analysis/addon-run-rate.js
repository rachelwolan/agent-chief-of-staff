// Calculate run rate for Analyze, Optimize, and Localization add-ons
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
    WITH latest_mrr AS (
      SELECT
        CASE
          WHEN IS_ANALYZE_ADDON = TRUE THEN 'Analyze'
          WHEN IS_OPTIMIZE_ADDON = TRUE THEN 'Optimize'
          WHEN IS_LOCALIZATION_ADDON = TRUE THEN 'Localization'
        END AS addon_type,
        PLAN_OBJECT_TIER,
        PLAN_NAME,
        COUNT(DISTINCT SUBSCRIPTION_ID) AS active_subscriptions,
        COUNT(DISTINCT CUSTOMER_ID) AS active_customers,
        SUM(MRR) AS total_mrr,
        SUM(MRR) * 12 AS annual_run_rate
      FROM
        FCT_SUBSCRIPTION_LINE_ITEM_MRR
      WHERE
        -- Get most recent month of data
        INVOICE_DATE >= DATEADD(month, -1, CURRENT_DATE())
        AND (
          IS_ANALYZE_ADDON = TRUE
          OR IS_OPTIMIZE_ADDON = TRUE
          OR IS_LOCALIZATION_ADDON = TRUE
        )
        AND IS_PAID_INVOICE = TRUE
      GROUP BY
        CASE
          WHEN IS_ANALYZE_ADDON = TRUE THEN 'Analyze'
          WHEN IS_OPTIMIZE_ADDON = TRUE THEN 'Optimize'
          WHEN IS_LOCALIZATION_ADDON = TRUE THEN 'Localization'
        END,
        PLAN_OBJECT_TIER,
        PLAN_NAME
      ORDER BY
        addon_type,
        annual_run_rate DESC
    ),
    addon_totals AS (
      SELECT
        addon_type,
        SUM(active_subscriptions) AS total_subscriptions,
        SUM(active_customers) AS total_customers,
        SUM(total_mrr) AS total_mrr,
        SUM(annual_run_rate) AS total_arr
      FROM
        latest_mrr
      GROUP BY
        addon_type
    )
    SELECT
      addon_type,
      total_subscriptions,
      total_customers,
      ROUND(total_mrr, 2) AS total_mrr,
      ROUND(total_arr, 2) AS total_arr
    FROM
      addon_totals
    ORDER BY
      total_arr DESC
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
        console.log('\n💰 ADD-ON RUN RATE ANALYSIS');
        console.log('═'.repeat(100));
        console.log(
          'Add-on'.padEnd(20) +
          'Subscriptions'.padEnd(18) +
          'Customers'.padEnd(15) +
          'MRR'.padEnd(20) +
          'ARR (Run Rate)'
        );
        console.log('─'.repeat(100));

        let totalSubscriptions = 0;
        let totalCustomers = 0;
        let totalMRR = 0;
        let totalARR = 0;

        rows.forEach(row => {
          totalSubscriptions += row.TOTAL_SUBSCRIPTIONS || 0;
          totalCustomers += row.TOTAL_CUSTOMERS || 0;
          totalMRR += row.TOTAL_MRR || 0;
          totalARR += row.TOTAL_ARR || 0;

          console.log(
            (row.ADDON_TYPE || 'N/A').padEnd(20) +
            String(row.TOTAL_SUBSCRIPTIONS || 0).padEnd(18) +
            String(row.TOTAL_CUSTOMERS || 0).padEnd(15) +
            ('$' + (row.TOTAL_MRR || 0).toLocaleString()).padEnd(20) +
            '$' + (row.TOTAL_ARR || 0).toLocaleString()
          );
        });

        console.log('─'.repeat(100));
        console.log(
          'TOTAL'.padEnd(20) +
          String(totalSubscriptions).padEnd(18) +
          String(totalCustomers).padEnd(15) +
          ('$' + totalMRR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).padEnd(20) +
          '$' + totalARR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        );
        console.log('═'.repeat(100));

        // Get breakdown by plan tier
        const detailQuery = `
          SELECT
            CASE
              WHEN IS_ANALYZE_ADDON = TRUE THEN 'Analyze'
              WHEN IS_OPTIMIZE_ADDON = TRUE THEN 'Optimize'
              WHEN IS_LOCALIZATION_ADDON = TRUE THEN 'Localization'
            END AS addon_type,
            PLAN_OBJECT_TIER,
            COUNT(DISTINCT SUBSCRIPTION_ID) AS active_subscriptions,
            SUM(MRR) AS total_mrr,
            SUM(MRR) * 12 AS annual_run_rate
          FROM
            FCT_SUBSCRIPTION_LINE_ITEM_MRR
          WHERE
            INVOICE_DATE >= DATEADD(month, -1, CURRENT_DATE())
            AND (
              IS_ANALYZE_ADDON = TRUE
              OR IS_OPTIMIZE_ADDON = TRUE
              OR IS_LOCALIZATION_ADDON = TRUE
            )
            AND IS_PAID_INVOICE = TRUE
          GROUP BY
            addon_type,
            PLAN_OBJECT_TIER
          ORDER BY
            addon_type,
            annual_run_rate DESC
        `;

        conn.execute({
          sqlText: detailQuery,
          complete: (err, stmt, detailRows) => {
            if (!err && detailRows && detailRows.length > 0) {
              console.log('\n📊 BREAKDOWN BY PLAN TIER');
              console.log('═'.repeat(100));
              console.log(
                'Add-on'.padEnd(20) +
                'Plan Tier'.padEnd(30) +
                'Subscriptions'.padEnd(18) +
                'MRR'.padEnd(18) +
                'ARR'
              );
              console.log('─'.repeat(100));

              let currentAddon = '';
              detailRows.forEach(row => {
                if (row.ADDON_TYPE !== currentAddon) {
                  if (currentAddon !== '') {
                    console.log('─'.repeat(100));
                  }
                  currentAddon = row.ADDON_TYPE;
                }

                console.log(
                  (row.ADDON_TYPE || 'N/A').padEnd(20) +
                  (row.PLAN_OBJECT_TIER || 'N/A').padEnd(30) +
                  String(row.ACTIVE_SUBSCRIPTIONS || 0).padEnd(18) +
                  ('$' + (row.TOTAL_MRR || 0).toLocaleString()).padEnd(18) +
                  '$' + (row.ANNUAL_RUN_RATE || 0).toLocaleString()
                );
              });
              console.log('═'.repeat(100));
            }
            connection.destroy((err) => {});
          }
        });

      } else {
        console.log('No add-on data found');
        connection.destroy((err) => {});
      }
    },
  });
});
