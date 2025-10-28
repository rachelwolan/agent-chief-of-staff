// Analyze signup trends for SP/IHTS plans over last 12 weeks
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
    WITH weekly_signups AS (
      SELECT
        DATE_TRUNC('week', INVOICE_DATE) AS signup_week,
        PLAN_OBJECT_TIER,
        PLAN_NAME,
        PLAN_SKU_TYPE,
        COUNT(DISTINCT CUSTOMER_ID) AS new_customers,
        COUNT(DISTINCT SUBSCRIPTION_ID) AS new_subscriptions,
        SUM(MRR) AS total_mrr
      FROM
        FCT_SUBSCRIPTION_LINE_ITEM_MRR
      WHERE
        INVOICE_DATE >= DATEADD(week, -12, CURRENT_DATE())
        AND IS_PRIMARY_SUBSCRIPTION = TRUE
        AND TYPE = 'subscription'
        AND (
          LOWER(PLAN_OBJECT_TIER) LIKE '%site_plan%'
          OR LOWER(PLAN_NAME) LIKE '%ihts%'
          OR LOWER(PLAN_SKU_TYPE) LIKE '%hosting%'
        )
      GROUP BY
        DATE_TRUNC('week', INVOICE_DATE),
        PLAN_OBJECT_TIER,
        PLAN_NAME,
        PLAN_SKU_TYPE
      ORDER BY
        signup_week DESC,
        new_subscriptions DESC
    )
    SELECT
      TO_VARCHAR(signup_week, 'YYYY-MM-DD') AS week_start,
      PLAN_OBJECT_TIER AS plan_tier,
      PLAN_NAME,
      PLAN_SKU_TYPE AS sku_type,
      new_customers,
      new_subscriptions,
      ROUND(total_mrr, 2) AS total_mrr
    FROM
      weekly_signups
    ORDER BY
      signup_week DESC,
      new_subscriptions DESC
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
        console.log('\n📈 SIGNUP TRENDS - LAST 12 WEEKS');
        console.log('═'.repeat(120));
        console.log(
          'Week Start'.padEnd(12) +
          'Plan Tier'.padEnd(25) +
          'Plan Name'.padEnd(25) +
          'SKU Type'.padEnd(15) +
          'Customers'.padEnd(12) +
          'Subscriptions'.padEnd(15) +
          'Total MRR'
        );
        console.log('─'.repeat(120));

        let currentWeek = '';
        rows.forEach(row => {
          const weekStart = row.WEEK_START;
          const weekLabel = weekStart === currentWeek ? ''.padEnd(12) : weekStart.padEnd(12);
          currentWeek = weekStart;

          console.log(
            weekLabel +
            (row.PLAN_TIER || 'N/A').padEnd(25) +
            (row.PLAN_NAME || 'N/A').padEnd(25) +
            (row.SKU_TYPE || 'N/A').padEnd(15) +
            String(row.NEW_CUSTOMERS || 0).padEnd(12) +
            String(row.NEW_SUBSCRIPTIONS || 0).padEnd(15) +
            '$' + (row.TOTAL_MRR || 0).toLocaleString()
          );
        });
        console.log('═'.repeat(120));

        // Summary by week
        const weeklyTotals = {};
        rows.forEach(row => {
          const week = row.WEEK_START;
          if (!weeklyTotals[week]) {
            weeklyTotals[week] = { customers: 0, subscriptions: 0, mrr: 0 };
          }
          weeklyTotals[week].customers += row.NEW_CUSTOMERS || 0;
          weeklyTotals[week].subscriptions += row.NEW_SUBSCRIPTIONS || 0;
          weeklyTotals[week].mrr += row.TOTAL_MRR || 0;
        });

        console.log('\n📊 WEEKLY TOTALS');
        console.log('═'.repeat(80));
        console.log(
          'Week Start'.padEnd(15) +
          'Total Customers'.padEnd(20) +
          'Total Subscriptions'.padEnd(25) +
          'Total MRR'
        );
        console.log('─'.repeat(80));
        Object.keys(weeklyTotals).sort().reverse().forEach(week => {
          const totals = weeklyTotals[week];
          console.log(
            week.padEnd(15) +
            String(totals.customers).padEnd(20) +
            String(totals.subscriptions).padEnd(25) +
            '$' + totals.mrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          );
        });
        console.log('═'.repeat(80));

      } else {
        console.log('No signup data found for the last 12 weeks');
      }

      connection.destroy((err) => {});
    },
  });
});
