// Analyze signup trends with MoM, QoQ, and YoY comparisons
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
        DATE_TRUNC('month', date_day) AS month,
        SUM(sign_ups) AS total_signups,
        SUM(sign_ups_paid) AS paid_signups,
        SUM(sign_ups_organic) AS organic_signups,
        ROUND(SUM(sign_ups_paid)::FLOAT / NULLIF(SUM(sign_ups), 0) * 100, 1) AS pct_paid
    FROM
        analytics.webflow.report__kpi_daily
    WHERE
        date_day >= '2023-01-01'
        AND date_day <= '2025-09-30'
    GROUP BY DATE_TRUNC('month', date_day)
    ORDER BY month ASC
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
        console.log('\n📊 Signup Trends: MoM, QoQ, and YoY Analysis');
        console.log('═'.repeat(140));
        console.log('');

        console.log('Month          │  Signups  │   Paid   │ Organic  │ % Paid │   MoM    │   QoQ    │   YoY    ');
        console.log('─'.repeat(140));

        rows.forEach((row, idx) => {
          const date = new Date(row.MONTH);
          const monthStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          const signups = row.TOTAL_SIGNUPS;
          const paid = row.PAID_SIGNUPS;
          const organic = row.ORGANIC_SIGNUPS;
          const pctPaid = row.PCT_PAID;

          // Calculate MoM (month-over-month)
          let momChange = '';
          if (idx > 0) {
            const prevSignups = rows[idx - 1].TOTAL_SIGNUPS;
            const momPct = ((signups - prevSignups) / prevSignups * 100);
            const indicator = momPct >= 0 ? '📈' : '📉';
            momChange = `${indicator} ${momPct >= 0 ? '+' : ''}${momPct.toFixed(1)}%`;
          } else {
            momChange = '     —';
          }

          // Calculate QoQ (quarter-over-quarter)
          let qoqChange = '';
          if (idx >= 3) {
            const prevQSignups = rows[idx - 3].TOTAL_SIGNUPS;
            const qoqPct = ((signups - prevQSignups) / prevQSignups * 100);
            const indicator = qoqPct >= 0 ? '📈' : '📉';
            qoqChange = `${indicator} ${qoqPct >= 0 ? '+' : ''}${qoqPct.toFixed(1)}%`;
          } else {
            qoqChange = '     —';
          }

          // Calculate YoY (year-over-year)
          let yoyChange = '';
          if (idx >= 12) {
            const prevYSignups = rows[idx - 12].TOTAL_SIGNUPS;
            const yoyPct = ((signups - prevYSignups) / prevYSignups * 100);
            const indicator = yoyPct >= 0 ? '📈' : '📉';
            yoyChange = `${indicator} ${yoyPct >= 0 ? '+' : ''}${yoyPct.toFixed(1)}%`;
          } else {
            yoyChange = '     —';
          }

          console.log(
            `${monthStr.padEnd(14)} │ ${signups.toLocaleString().padStart(9)} │ ${paid.toLocaleString().padStart(8)} │ ${organic.toLocaleString().padStart(8)} │ ${pctPaid.toString().padStart(5)}% │ ${momChange.padEnd(8)} │ ${qoqChange.padEnd(8)} │ ${yoyChange.padEnd(8)}`
          );
        });

        console.log('═'.repeat(140));

        // Calculate quarterly aggregates
        console.log('\n📊 QUARTERLY TRENDS');
        console.log('═'.repeat(140));
        console.log('');
        console.log('Quarter        │  Signups  │   Paid   │ Organic  │ % Paid │   QoQ    │   YoY    ');
        console.log('─'.repeat(140));

        const quarters = {};
        rows.forEach(row => {
          const date = new Date(row.MONTH);
          const year = date.getUTCFullYear();
          const month = date.getUTCMonth();
          const quarter = Math.floor(month / 3) + 1;
          const qKey = `${year}-Q${quarter}`;

          if (!quarters[qKey]) {
            quarters[qKey] = {
              signups: 0,
              paid: 0,
              organic: 0,
              year,
              quarter
            };
          }
          quarters[qKey].signups += row.TOTAL_SIGNUPS;
          quarters[qKey].paid += row.PAID_SIGNUPS;
          quarters[qKey].organic += row.ORGANIC_SIGNUPS;
        });

        const qArray = Object.entries(quarters).map(([key, val]) => ({
          key,
          ...val,
          pctPaid: (val.paid / val.signups * 100).toFixed(1)
        }));

        qArray.forEach((q, idx) => {
          const qLabel = q.key.padEnd(14);
          const signups = q.signups.toLocaleString().padStart(9);
          const paid = q.paid.toLocaleString().padStart(8);
          const organic = q.organic.toLocaleString().padStart(8);
          const pctPaid = q.pctPaid.toString().padStart(5) + '%';

          // QoQ
          let qoqChange = '';
          if (idx > 0) {
            const prevQ = qArray[idx - 1];
            const qoqPct = ((q.signups - prevQ.signups) / prevQ.signups * 100);
            const indicator = qoqPct >= 0 ? '📈' : '📉';
            qoqChange = `${indicator} ${qoqPct >= 0 ? '+' : ''}${qoqPct.toFixed(1)}%`;
          } else {
            qoqChange = '     —';
          }

          // YoY
          let yoyChange = '';
          if (idx >= 4) {
            const prevYQ = qArray[idx - 4];
            const yoyPct = ((q.signups - prevYQ.signups) / prevYQ.signups * 100);
            const indicator = yoyPct >= 0 ? '📈' : '📉';
            yoyChange = `${indicator} ${yoyPct >= 0 ? '+' : ''}${yoyPct.toFixed(1)}%`;
          } else {
            yoyChange = '     —';
          }

          console.log(`${qLabel} │ ${signups} │ ${paid} │ ${organic} │ ${pctPaid} │ ${qoqChange.padEnd(8)} │ ${yoyChange.padEnd(8)}`);
        });

        console.log('═'.repeat(140));

      } else {
        console.log('No data found');
      }

      connection.destroy((err) => {
        if (err) console.error('Error destroying connection:', err);
      });
    },
  });
});
