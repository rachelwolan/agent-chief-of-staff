// Check what attribution values exist in the data
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
        dim_signup_attribution,
        COUNT(DISTINCT user_id) AS users,
        COUNT(DISTINCT CASE WHEN ts_first_subscription IS NOT NULL THEN user_id END) AS converted_users
    FROM
        analytics.webflow.dim_user_attributions
    WHERE
        created_on >= '2023-01-01'
        AND created_on < '2025-01-01'
    GROUP BY 1
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

      if (rows && rows.length > 0) {
        console.log('\n📊 SIGNUP ATTRIBUTION VALUES (2023-2024)');
        console.log('═'.repeat(100));
        console.log('');
        console.log('Attribution               │ Total Users │ Converted Users │ Conversion %');
        console.log('─'.repeat(100));

        let totalUsers = 0;
        let totalConverted = 0;

        rows.forEach(row => {
          const attr = row.DIM_SIGNUP_ATTRIBUTION || 'NULL';
          const users = row.USERS;
          const converted = row.CONVERTED_USERS;
          const convRate = users > 0 ? ((converted / users) * 100) : 0;

          totalUsers += users;
          totalConverted += converted;

          console.log(
            `${attr.padEnd(25)} │ ${users.toLocaleString().padStart(11)} │ ${converted.toLocaleString().padStart(15)} │ ${convRate.toFixed(1)}%`
          );
        });

        console.log('─'.repeat(100));
        console.log(
          `${'TOTAL'.padEnd(25)} │ ${totalUsers.toLocaleString().padStart(11)} │ ${totalConverted.toLocaleString().padStart(15)} │ ${((totalConverted / totalUsers) * 100).toFixed(1)}%`
        );
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
