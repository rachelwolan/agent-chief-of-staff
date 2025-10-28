// Check available customer segments
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
        dim_market_segmentation,
        COUNT(DISTINCT user_id) as users
    FROM
        analytics.webflow.dim_user_attributions
    WHERE
        created_on >= '2023-01-01'
        AND dim_signup_attribution = 'organic'
    GROUP BY dim_market_segmentation
    ORDER BY users DESC
  `;

  conn.execute({
    sqlText: query,
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('Failed:', err.message);
        connection.destroy((err) => {});
        process.exit(1);
      }

      console.log('\n📊 Available Market Segments (Organic Signups Since 2023):');
      console.log('═'.repeat(60));

      if (rows && rows.length > 0) {
        rows.forEach(row => {
          console.log(`${(row.DIM_MARKET_SEGMENTATION || 'NULL').padEnd(40)} │ ${row.USERS.toLocaleString().padStart(10)} users`);
        });
      }

      connection.destroy((err) => {});
    },
  });
});
