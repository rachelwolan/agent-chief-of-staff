// Explore available tables for SKU data
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
      table_name,
      table_type
    FROM
      information_schema.tables
    WHERE
      table_schema = 'WEBFLOW'
      AND (
        LOWER(table_name) LIKE '%mrr%'
        OR LOWER(table_name) LIKE '%subscription%'
        OR LOWER(table_name) LIKE '%sku%'
        OR LOWER(table_name) LIKE '%product%'
        OR LOWER(table_name) LIKE '%customer%'
      )
    ORDER BY table_name
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
        console.log('\n📊 AVAILABLE TABLES FOR SKU/MRR ANALYSIS');
        console.log('═'.repeat(80));
        rows.forEach(row => {
          console.log(`${row.TABLE_NAME} (${row.TABLE_TYPE})`);
        });
        console.log('═'.repeat(80));
      } else {
        console.log('No tables found');
      }

      connection.destroy((err) => {
        if (err) console.error('Error destroying connection:', err);
      });
    },
  });
});
