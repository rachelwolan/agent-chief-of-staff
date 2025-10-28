// Simple test to check expansion data
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
    SELECT
        u.dim_market_segmentation AS segment,
        COUNT(DISTINCT u.user_id) AS total_users,
        COUNT(DISTINCT u.stripe_customer_id) AS users_with_customer_id,
        COUNT(DISTINCT CASE WHEN s.customer_id IS NOT NULL THEN u.user_id END) AS users_with_invoices
    FROM
        analytics.webflow.dim_user_attributions u
    LEFT JOIN
        analytics.webflow.fct_subscription_line_item_mrr s
        ON u.stripe_customer_id = s.customer_id
        AND s.is_paid_invoice = TRUE
    WHERE
        u.dim_signup_attribution = 'organic'
        AND u.created_on >= '2023-01-01'
        AND u.created_on < '2025-01-01'
        AND u.dim_market_segmentation IN ('Professional Creator', 'In-House Team', 'DIY Business', 'Other')
        AND u.ts_first_subscription IS NOT NULL
    GROUP BY 1
    ORDER BY 1
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
        console.log('\n📊 DATA COVERAGE CHECK');
        console.log('═'.repeat(100));
        console.log('Segment              │ Total Users │ With Customer ID │ With Invoices');
        console.log('─'.repeat(100));
        rows.forEach(row => {
          console.log(
            `${(row.SEGMENT || 'Other').padEnd(20)} │ ${row.TOTAL_USERS.toLocaleString().padStart(11)} │ ${row.USERS_WITH_CUSTOMER_ID.toLocaleString().padStart(16)} │ ${row.USERS_WITH_INVOICES.toLocaleString().padStart(13)}`
          );
        });
        console.log('═'.repeat(100));
      } else {
        console.log('No data found');
      }

      connection.destroy((err) => {
        if (err) console.error('Error destroying connection:', err);
      });
    },
  });
});
