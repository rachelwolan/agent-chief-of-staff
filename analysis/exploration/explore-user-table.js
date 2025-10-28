// Explore dim_user_attributions structure
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
      column_name,
      data_type
    FROM
      information_schema.columns
    WHERE
      table_schema = 'WEBFLOW'
      AND table_name = 'DIM_USER_ATTRIBUTIONS'
      AND LOWER(column_name) LIKE '%customer%'
    ORDER BY ordinal_position
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
        console.log('\n📊 DIM_USER_ATTRIBUTIONS CUSTOMER COLUMNS');
        console.log('═'.repeat(80));
        rows.forEach(row => {
          console.log(`${row.COLUMN_NAME.padEnd(40)} ${row.DATA_TYPE}`);
        });
        console.log('═'.repeat(80));
      } else {
        console.log('No customer columns found');
      }

      connection.destroy((err) => {
        if (err) console.error('Error destroying connection:', err);
      });
    },
  });
});
