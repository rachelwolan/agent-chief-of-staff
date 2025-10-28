// Calculate iARR story based on total signup volume changes
import snowflake from 'snowflake-sdk';

const connection = snowflake.createConnection({
  account: 'wn71398.us-east-1',
  username: 'rachel.wolan@webflow.com',
  database: 'ANALYTICS',
  schema: 'WEBFLOW',
  warehouse: 'SNOWFLAKE_REPORTING_WH_4',
  authenticator: 'externalbrowser',
});

const ARR_PER_PCT_SIGNUPS = 226000; // $226k iARR per 1% of total signups (100 bps)

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
        ROUND(SUM(sign_ups_paid)::FLOAT / NULLIF(SUM(sign_ups), 0) * 100, 1) AS pct_paid
    FROM
        analytics.webflow.report__kpi_daily
    WHERE
        date_day >= '2023-02-01'
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
        console.log('\n💰 Incremental ARR Story: Month-by-Month Analysis');
        console.log('═'.repeat(120));
        console.log('Formula: (Total Signups / 100) × $226k = Monthly iARR Contribution');
        console.log('(Every 1% of signups / 100 basis points = $226k in iARR)');
        console.log('═'.repeat(120));
        console.log('');

        let previousMonth = null;
        let runningIARR = 0;
        let fy24Total = 0, fy25Total = 0, fy26Total = 0;
        let currentFY = null;

        console.log('Month          │ Signups  │ % Paid │ Monthly iARR │ MoM Change   │ Cumulative iARR │ Notes');
        console.log('─'.repeat(120));

        rows.forEach((row, idx) => {
          const date = new Date(row.MONTH);
          const monthStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          const signups = row.TOTAL_SIGNUPS;
          const pctPaid = row.PCT_PAID;

          // Calculate monthly iARR contribution
          // Formula: (signups / 100) * $226k (every 1% of signups = $226k in iARR)
          const monthlyIARR = (signups / 100) * ARR_PER_PCT_SIGNUPS;
          runningIARR += monthlyIARR;

          // Calculate MoM change
          let momChange = '';
          let momChangeValue = 0;
          if (previousMonth) {
            momChangeValue = monthlyIARR - previousMonth.monthlyIARR;
            const indicator = momChangeValue >= 0 ? '📈' : '📉';
            const sign = momChangeValue >= 0 ? '+' : '';
            momChange = `${indicator} ${sign}$${(momChangeValue / 1000000).toFixed(1)}M`;
          } else {
            momChange = '    —';
          }

          // Track by fiscal year
          const month = date.getUTCMonth();
          const year = date.getUTCFullYear();
          let fy;
          if (month === 0) { // January
            fy = year;
          } else {
            fy = year + 1;
          }

          if (fy === 2024) fy24Total += monthlyIARR;
          else if (fy === 2025) fy25Total += monthlyIARR;
          else if (fy === 2026) fy26Total += monthlyIARR;

          // Add fiscal year separator
          if (currentFY !== fy) {
            if (currentFY !== null) {
              console.log('─'.repeat(120));
            }
            currentFY = fy;
          }

          // Add notes for significant changes
          let notes = '';
          if (momChangeValue < -1500000) {
            notes = '⚠️  Major decline';
          } else if (momChangeValue > 1500000) {
            notes = '🎯 Major growth';
          }

          // Detect transition points
          if (idx > 0) {
            const prevPctPaid = previousMonth.pctPaid;
            if (prevPctPaid > 30 && pctPaid < 25) {
              notes = '🔄 Paid strategy shift begins';
            } else if (prevPctPaid > 20 && pctPaid < 15) {
              notes = '🔄 Major paid reduction';
            }
          }

          console.log(
            `${monthStr.padEnd(14)} │ ${signups.toLocaleString().padStart(8)} │ ${pctPaid.toString().padStart(5)}% │ $${(monthlyIARR / 1000000).toFixed(1)}M`.padEnd(32) +
            ` │ ${momChange.padEnd(12)} │ $${(runningIARR / 1000000).toFixed(1)}M`.padEnd(18) +
            ` │ ${notes}`
          );

          previousMonth = { monthlyIARR, pctPaid, signups };
        });

        console.log('═'.repeat(120));

        // Calculate peak and trough
        const iARRData = rows.map(row => ({
          month: new Date(row.MONTH).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          iarr: (row.TOTAL_SIGNUPS / 100) * ARR_PER_PCT_SIGNUPS
        }));

        const peak = iARRData.reduce((max, d) => d.iarr > max.iarr ? d : max);
        const trough = iARRData.reduce((min, d) => d.iarr < min.iarr ? d : min);

        // Summary statistics
        console.log('\n📈 SUMMARY STATISTICS');
        console.log('═'.repeat(120));
        console.log(`\nTotal Cumulative iARR (32 months): $${(runningIARR / 1000000).toFixed(1)}M`);
        console.log(`Average Monthly iARR:               $${(runningIARR / rows.length / 1000000).toFixed(1)}M`);
        console.log('');
        console.log(`🏆 Peak Month:                      ${peak.month} - $${(peak.iarr / 1000000).toFixed(1)}M`);
        console.log(`📉 Trough Month:                    ${trough.month} - $${(trough.iarr / 1000000).toFixed(1)}M`);
        console.log(`   Peak-to-Trough Decline:          ${((1 - trough.iarr / peak.iarr) * 100).toFixed(1)}%`);

        console.log('\n📊 BY FISCAL YEAR');
        console.log('═'.repeat(120));
        console.log(`FY24 (Feb 2023 - Jan 2024):  $${(fy24Total / 1000000).toFixed(1)}M iARR cumulative`);
        console.log(`FY25 (Feb 2024 - Jan 2025):  $${(fy25Total / 1000000).toFixed(1)}M iARR cumulative  (${((fy25Total - fy24Total) / fy24Total * 100).toFixed(1)}% vs FY24)`);
        console.log(`FY26 (Feb 2025 - Sep 2025):  $${(fy26Total / 1000000).toFixed(1)}M iARR cumulative  (8 months actual)`);

        // Annualized projection for FY26
        const fy26Annualized = fy26Total * (12 / 8);
        console.log(`FY26 Annualized Projection:  $${(fy26Annualized / 1000000).toFixed(1)}M iARR cumulative  (${((fy26Annualized - fy25Total) / fy25Total * 100).toFixed(1)}% vs FY25)`);

        // The cost of the paid reduction
        console.log('\n💸 THE COST OF THE PAID REDUCTION');
        console.log('═'.repeat(120));

        // Compare FY26 to FY25 if we maintained FY25 paid mix
        let whatIfFY26 = 0;
        const fy26Months = rows.filter(row => {
          const date = new Date(row.MONTH);
          const month = date.getUTCMonth();
          const year = date.getUTCFullYear();
          const fy = month === 0 ? year : year + 1;
          return fy === 2026;
        });

        const fy25AvgPctPaid = fy25Total / rows.filter(row => {
          const date = new Date(row.MONTH);
          const month = date.getUTCMonth();
          const year = date.getUTCFullYear();
          const fy = month === 0 ? year : year + 1;
          return fy === 2025;
        }).reduce((sum, row) => sum + row.TOTAL_SIGNUPS / 100, 0);

        fy26Months.forEach(row => {
          // What if FY26 had same signup volumes as same months in FY25
          const fy25SameMonth = rows.find(r => {
            const rDate = new Date(r.MONTH);
            const rowDate = new Date(row.MONTH);
            return rDate.getUTCMonth() === rowDate.getUTCMonth() &&
                   rDate.getUTCFullYear() === rowDate.getUTCFullYear() - 1;
          });
          if (fy25SameMonth) {
            whatIfFY26 += (fy25SameMonth.TOTAL_SIGNUPS / 100) * ARR_PER_PCT_SIGNUPS;
          }
        });

        const opportunityCost = whatIfFY26 - fy26Total;
        console.log(`\nIf FY26 maintained FY25 signup volumes:`);
        console.log(`  FY26 Actual (8 mo):        $${(fy26Total / 1000000).toFixed(1)}M`);
        console.log(`  FY26 "What If" (8 mo):     $${(whatIfFY26 / 1000000).toFixed(1)}M`);
        console.log(`  Opportunity Cost:          $${(opportunityCost / 1000000).toFixed(1)}M`);
        console.log(`  Annualized Cost:           $${(opportunityCost * 12 / 8 / 1000000).toFixed(1)}M per year`);

        // Monthly run rate comparison
        console.log('\n📉 MONTHLY RUN RATE TRENDS');
        console.log('═'.repeat(120));

        const fy24Avg = fy24Total / 12;
        const fy25Avg = fy25Total / 12;
        const fy26Avg = fy26Total / 8;

        console.log(`FY24 Average Monthly iARR:   $${(fy24Avg / 1000000).toFixed(1)}M/month`);
        console.log(`FY25 Average Monthly iARR:   $${(fy25Avg / 1000000).toFixed(1)}M/month  (${((fy25Avg - fy24Avg) / fy24Avg * 100).toFixed(1)}%)`);
        console.log(`FY26 Average Monthly iARR:   $${(fy26Avg / 1000000).toFixed(1)}M/month  (${((fy26Avg - fy25Avg) / fy25Avg * 100).toFixed(1)}%)`);
        console.log(`\nMonthly run rate decline:    $${((fy25Avg - fy26Avg) / 1000000).toFixed(1)}M/month less than FY25`);

      } else {
        console.log('No data found');
      }

      connection.destroy((err) => {
        if (err) console.error('Error destroying connection:', err);
      });
    },
  });
});
