// Explore FCT_SUBSCRIPTION_LINE_ITEM_MRR structure
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
      AND table_name = 'FCT_SUBSCRIPTION_LINE_ITEM_MRR'
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
        console.log('\n📊 FCT_SUBSCRIPTION_LINE_ITEM_MRR COLUMNS');
        console.log('═'.repeat(80));
        rows.forEach(row => {
          console.log(`${row.COLUMN_NAME.padEnd(40)} ${row.DATA_TYPE}`);
        });
        console.log('═'.repeat(80));

        // Also get sample data
        conn.execute({
          sqlText: 'SELECT * FROM FCT_SUBSCRIPTION_LINE_ITEM_MRR LIMIT 5',
          complete: (err, stmt, sampleRows) => {
            if (!err && sampleRows && sampleRows.length > 0) {
              console.log('\n📊 SAMPLE DATA (first row):');
              console.log('═'.repeat(80));
              const firstRow = sampleRows[0];
              Object.keys(firstRow).forEach(key => {
                console.log(`${key.padEnd(40)} ${firstRow[key]}`);
              });
              console.log('═'.repeat(80));
            }
            connection.destroy((err) => {});
          }
        });
      } else {
        console.log('No columns found');
        connection.destroy((err) => {});
      }
    },
  });
});
