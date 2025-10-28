// Year-over-year comparison of signup trends
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

  // Get data for both 2024 and 2025 for the same 12-week period
  const query = `
    WITH weekly_signups AS (
      SELECT
        DATE_TRUNC('week', INVOICE_DATE) AS signup_week,
        YEAR(INVOICE_DATE) AS signup_year,
        COUNT(DISTINCT CUSTOMER_ID) AS new_customers,
        COUNT(DISTINCT SUBSCRIPTION_ID) AS new_subscriptions,
        SUM(MRR) AS total_mrr
      FROM
        FCT_SUBSCRIPTION_LINE_ITEM_MRR
      WHERE
        (
          -- 2025 data: last 12 weeks
          (INVOICE_DATE >= DATEADD(week, -12, CURRENT_DATE()) AND INVOICE_DATE < CURRENT_DATE())
          OR
          -- 2024 data: same 12-week period last year
          (INVOICE_DATE >= DATEADD(week, -12, DATEADD(year, -1, CURRENT_DATE()))
           AND INVOICE_DATE < DATEADD(year, -1, CURRENT_DATE()))
        )
        AND IS_PRIMARY_SUBSCRIPTION = TRUE
        AND TYPE = 'subscription'
        AND (
          LOWER(PLAN_OBJECT_TIER) LIKE '%site_plan%'
          OR LOWER(PLAN_NAME) LIKE '%ihts%'
          OR LOWER(PLAN_SKU_TYPE) LIKE '%hosting%'
        )
      GROUP BY
        DATE_TRUNC('week', INVOICE_DATE),
        YEAR(INVOICE_DATE)
      ORDER BY
        signup_year DESC,
        signup_week DESC
    )
    SELECT
      signup_year,
      TO_VARCHAR(signup_week, 'YYYY-MM-DD') AS week_start,
      new_customers,
      new_subscriptions,
      ROUND(total_mrr, 2) AS total_mrr
    FROM
      weekly_signups
    ORDER BY
      signup_year DESC,
      signup_week DESC
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
        // Separate 2024 and 2025 data
        const data2025 = rows.filter(r => r.SIGNUP_YEAR === 2025);
        const data2024 = rows.filter(r => r.SIGNUP_YEAR === 2024);

        console.log('\n📊 YEAR-OVER-YEAR SIGNUP COMPARISON');
        console.log('═'.repeat(120));

        // Print 2025 data
        console.log('\n🟢 2025 DATA (Current Year)');
        console.log('─'.repeat(120));
        console.log(
          'Week Start'.padEnd(15) +
          'Customers'.padEnd(15) +
          'Subscriptions'.padEnd(18) +
          'MRR'
        );
        console.log('─'.repeat(120));

        data2025.forEach(row => {
          console.log(
            row.WEEK_START.padEnd(15) +
            String(row.NEW_CUSTOMERS).padEnd(15) +
            String(row.NEW_SUBSCRIPTIONS).padEnd(18) +
            '$' + (row.TOTAL_MRR || 0).toLocaleString()
          );
        });

        console.log('\n🔵 2024 DATA (Last Year)');
        console.log('─'.repeat(120));
        console.log(
          'Week Start'.padEnd(15) +
          'Customers'.padEnd(15) +
          'Subscriptions'.padEnd(18) +
          'MRR'
        );
        console.log('─'.repeat(120));

        data2024.forEach(row => {
          console.log(
            row.WEEK_START.padEnd(15) +
            String(row.NEW_CUSTOMERS).padEnd(15) +
            String(row.NEW_SUBSCRIPTIONS).padEnd(18) +
            '$' + (row.TOTAL_MRR || 0).toLocaleString()
          );
        });

        // Calculate totals and YoY comparison
        const total2025 = data2025.reduce((acc, row) => ({
          customers: acc.customers + row.NEW_CUSTOMERS,
          subscriptions: acc.subscriptions + row.NEW_SUBSCRIPTIONS,
          mrr: acc.mrr + row.TOTAL_MRR
        }), { customers: 0, subscriptions: 0, mrr: 0 });

        const total2024 = data2024.reduce((acc, row) => ({
          customers: acc.customers + row.NEW_CUSTOMERS,
          subscriptions: acc.subscriptions + row.NEW_SUBSCRIPTIONS,
          mrr: acc.mrr + row.TOTAL_MRR
        }), { customers: 0, subscriptions: 0, mrr: 0 });

        console.log('\n📈 YEAR-OVER-YEAR COMPARISON');
        console.log('═'.repeat(120));
        console.log('Metric'.padEnd(30) + '2024'.padEnd(20) + '2025'.padEnd(20) + 'Change'.padEnd(20) + 'Growth %');
        console.log('─'.repeat(120));

        const customerGrowth = ((total2025.customers - total2024.customers) / total2024.customers * 100).toFixed(2);
        const subscriptionGrowth = ((total2025.subscriptions - total2024.subscriptions) / total2024.subscriptions * 100).toFixed(2);
        const mrrGrowth = ((total2025.mrr - total2024.mrr) / total2024.mrr * 100).toFixed(2);

        console.log(
          'Total Customers'.padEnd(30) +
          total2024.customers.toLocaleString().padEnd(20) +
          total2025.customers.toLocaleString().padEnd(20) +
          (total2025.customers - total2024.customers).toLocaleString().padEnd(20) +
          customerGrowth + '%'
        );

        console.log(
          'Total Subscriptions'.padEnd(30) +
          total2024.subscriptions.toLocaleString().padEnd(20) +
          total2025.subscriptions.toLocaleString().padEnd(20) +
          (total2025.subscriptions - total2024.subscriptions).toLocaleString().padEnd(20) +
          subscriptionGrowth + '%'
        );

        console.log(
          'Total MRR'.padEnd(30) +
          ('$' + total2024.mrr.toLocaleString()).padEnd(20) +
          ('$' + total2025.mrr.toLocaleString()).padEnd(20) +
          ('$' + (total2025.mrr - total2024.mrr).toLocaleString()).padEnd(20) +
          mrrGrowth + '%'
        );

        console.log('═'.repeat(120));

        // Week-by-week variance analysis
        console.log('\n🔍 WEEK-BY-WEEK VARIANCE (2025 vs 2024)');
        console.log('═'.repeat(120));
        console.log(
          'Week (2025)'.padEnd(15) +
          'Customers Δ'.padEnd(18) +
          'Subscriptions Δ'.padEnd(20) +
          'MRR Δ'.padEnd(25) +
          'Customer Growth %'
        );
        console.log('─'.repeat(120));

        data2025.forEach((row2025, index) => {
          const row2024 = data2024[index];
          if (row2024) {
            const custDelta = row2025.NEW_CUSTOMERS - row2024.NEW_CUSTOMERS;
            const subDelta = row2025.NEW_SUBSCRIPTIONS - row2024.NEW_SUBSCRIPTIONS;
            const mrrDelta = row2025.TOTAL_MRR - row2024.TOTAL_MRR;
            const custGrowth = ((custDelta / row2024.NEW_CUSTOMERS) * 100).toFixed(1);

            console.log(
              row2025.WEEK_START.padEnd(15) +
              (custDelta > 0 ? '+' : '') + custDelta.toLocaleString().padEnd(18) +
              (subDelta > 0 ? '+' : '') + subDelta.toLocaleString().padEnd(20) +
              (mrrDelta > 0 ? '+$' : '-$') + Math.abs(mrrDelta).toLocaleString().padEnd(24) +
              (custGrowth > 0 ? '+' : '') + custGrowth + '%'
            );
          }
        });

        console.log('═'.repeat(120));

      } else {
        console.log('No data found');
      }

      connection.destroy((err) => {});
    },
  });
});
