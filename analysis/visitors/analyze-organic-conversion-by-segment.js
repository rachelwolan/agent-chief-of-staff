// Organic visitor conversion analysis by market segment
// NOTE: Visitor data doesn't include segment breakdown, so this shows:
// - Total organic visitors (aggregate)
// - Organic signups by segment
// - Segment share of organic signups (proxy for conversion patterns)
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
    WITH organic_visitors AS (
        SELECT
            CASE
                WHEN date_day >= '2024-02-01' AND date_day < '2025-02-01' THEN 'FY25'
                WHEN date_day >= '2025-02-01' AND date_day <= '2025-10-17' THEN 'FY26'
                ELSE NULL
            END AS fiscal_year,
            DATE_TRUNC('month', date_day) AS month,
            SUM(total_visitors) AS organic_visitors
        FROM
            analytics.webflow.report__daily_marketing_visitors
        WHERE
            date_day >= '2024-10-31'  -- Data starts here
            AND date_day <= '2025-10-17'
            AND dim_channel_category_updated LIKE 'Organic%'
        GROUP BY 1, 2
    ),

    organic_signups AS (
        SELECT
            CASE
                WHEN u.created_on >= '2024-02-01' AND u.created_on < '2025-02-01' THEN 'FY25'
                WHEN u.created_on >= '2025-02-01' AND u.created_on <= '2025-10-17' THEN 'FY26'
                ELSE NULL
            END AS fiscal_year,
            DATE_TRUNC('month', u.created_on) AS month,
            COALESCE(u.dim_market_segment, 'Unknown') AS segment,
            COUNT(DISTINCT u.user_id) AS organic_signups
        FROM
            analytics.webflow.dim_user_attributions u
        WHERE
            u.created_on >= '2024-10-31'
            AND u.created_on <= '2025-10-17'
            AND u.dim_signup_attribution = 'organic'
        GROUP BY 1, 2, 3
    ),

    combined AS (
        SELECT
            v.fiscal_year,
            v.month,
            s.segment,
            v.organic_visitors,
            COALESCE(s.organic_signups, 0) AS organic_signups
        FROM organic_visitors v
        LEFT JOIN organic_signups s
            ON v.fiscal_year = s.fiscal_year
            AND v.month = s.month
    )

    SELECT * FROM combined
    ORDER BY month, segment
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
        console.log('\n📊 ORGANIC CONVERSION ANALYSIS BY MARKET SEGMENT');
        console.log('═'.repeat(160));
        console.log('');
        console.log('⚠️  NOTE: Visitor tracking started Oct 31, 2024');
        console.log('⚠️  NOTE: Visitor data is not segmented - showing total organic visitors vs. signups by segment');
        console.log('');
        console.log('Time Periods:');
        console.log('  FY25 (partial): Nov 2024 - Jan 2025');
        console.log('  FY26 (partial): Feb 2025 - Oct 2025');
        console.log('═'.repeat(160));

        // Organize data
        const monthlyData = {};
        const segments = new Set();

        rows.forEach(row => {
          const key = `${row.FISCAL_YEAR}-${row.MONTH}`;
          if (!monthlyData[key]) {
            monthlyData[key] = {
              fiscal_year: row.FISCAL_YEAR,
              month: row.MONTH,
              total_visitors: row.ORGANIC_VISITORS,
              segments: {}
            };
          }
          if (row.SEGMENT) {
            monthlyData[key].segments[row.SEGMENT] = row.ORGANIC_SIGNUPS || 0;
            segments.add(row.SEGMENT);
          }
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const segmentList = Array.from(segments).sort();

        // Monthly breakdown
        console.log('\n━━━ MONTHLY ORGANIC SIGNUPS BY SEGMENT ━━━\n');
        console.log('Month        │ Total Visitors │ Total Signups │ Conv % │ ' +
          segmentList.map(s => s.padEnd(12)).join(' │ '));
        console.log('─'.repeat(160));

        const fyTotals = {
          'FY25': { visitors: 0, signups: 0, segments: {} },
          'FY26': { visitors: 0, signups: 0, segments: {} }
        };

        segmentList.forEach(seg => {
          fyTotals.FY25.segments[seg] = 0;
          fyTotals.FY26.segments[seg] = 0;
        });

        sortedMonths.forEach(key => {
          const data = monthlyData[key];
          const monthName = new Date(data.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          const totalSignups = Object.values(data.segments).reduce((sum, val) => sum + val, 0);
          const convRate = data.total_visitors > 0 ? (totalSignups / data.total_visitors * 100) : 0;

          const segmentValues = segmentList.map(seg => {
            const val = data.segments[seg] || 0;
            return val.toLocaleString().padStart(12);
          });

          console.log(
            `${monthName.padEnd(12)} │ ${data.total_visitors.toLocaleString().padStart(14)} │ ${totalSignups.toLocaleString().padStart(13)} │ ${convRate.toFixed(2).padStart(5)}% │ ${segmentValues.join(' │ ')}`
          );

          // Accumulate totals
          const fy = data.fiscal_year;
          fyTotals[fy].visitors += data.total_visitors;
          fyTotals[fy].signups += totalSignups;
          segmentList.forEach(seg => {
            fyTotals[fy].segments[seg] += data.segments[seg] || 0;
          });
        });

        // Fiscal year summary
        console.log('\n\n═'.repeat(160));
        console.log('📈 PERIOD SUMMARY');
        console.log('═'.repeat(160));
        console.log('');
        console.log('Period       │ Total Visitors │ Total Signups │ Conv % │ ' +
          segmentList.map(s => s.padEnd(12)).join(' │ '));
        console.log('─'.repeat(160));

        ['FY25', 'FY26'].forEach(fy => {
          const data = fyTotals[fy];
          const convRate = data.visitors > 0 ? (data.signups / data.visitors * 100) : 0;
          const label = fy === 'FY25' ? 'FY25 (3mo)' : 'FY26 (9mo)';

          const segmentValues = segmentList.map(seg => {
            const val = data.segments[seg] || 0;
            return val.toLocaleString().padStart(12);
          });

          console.log(
            `${label.padEnd(12)} │ ${data.visitors.toLocaleString().padStart(14)} │ ${data.signups.toLocaleString().padStart(13)} │ ${convRate.toFixed(2).padStart(5)}% │ ${segmentValues.join(' │ ')}`
          );
        });

        // Segment share analysis
        console.log('\n\n━━━ SEGMENT SHARE OF ORGANIC SIGNUPS ━━━\n');
        console.log('Segment           │ FY25 Signups │ FY25 Share │ FY26 Signups │ FY26 Share │ YoY Δ');
        console.log('─'.repeat(160));

        segmentList.forEach(seg => {
          const fy25Count = fyTotals.FY25.segments[seg] || 0;
          const fy26Count = fyTotals.FY26.segments[seg] || 0;
          const fy25Share = fyTotals.FY25.signups > 0 ? (fy25Count / fyTotals.FY25.signups * 100) : 0;
          const fy26Share = fyTotals.FY26.signups > 0 ? (fy26Count / fyTotals.FY26.signups * 100) : 0;
          const shareChange = fy26Share - fy25Share;

          console.log(
            `${seg.padEnd(17)} │ ${fy25Count.toLocaleString().padStart(12)} │ ${fy25Share.toFixed(1).padStart(9)}% │ ${fy26Count.toLocaleString().padStart(12)} │ ${fy26Share.toFixed(1).padStart(9)}% │ ${(shareChange >= 0 ? '+' : '') + shareChange.toFixed(1)}pp`
          );
        });

        // Key insights
        console.log('\n\n═'.repeat(160));
        console.log('💡 KEY INSIGHTS');
        console.log('═'.repeat(160));

        console.log('\n1. OVERALL ORGANIC CONVERSION:');
        const fy25Conv = fyTotals.FY25.visitors > 0 ? (fyTotals.FY25.signups / fyTotals.FY25.visitors * 100) : 0;
        const fy26Conv = fyTotals.FY26.visitors > 0 ? (fyTotals.FY26.signups / fyTotals.FY26.visitors * 100) : 0;
        console.log(`   • FY25: ${fy25Conv.toFixed(2)}% (${fyTotals.FY25.signups.toLocaleString()} signups / ${fyTotals.FY25.visitors.toLocaleString()} visitors)`);
        console.log(`   • FY26: ${fy26Conv.toFixed(2)}% (${fyTotals.FY26.signups.toLocaleString()} signups / ${fyTotals.FY26.visitors.toLocaleString()} visitors)`);
        console.log(`   • Change: ${(fy26Conv - fy25Conv >= 0 ? '+' : '')}${(fy26Conv - fy25Conv).toFixed(2)}pp`);

        console.log('\n2. SEGMENT COMPOSITION:');
        const topSegmentsFY26 = segmentList
          .map(seg => ({ segment: seg, count: fyTotals.FY26.segments[seg], share: fyTotals.FY26.signups > 0 ? (fyTotals.FY26.segments[seg] / fyTotals.FY26.signups * 100) : 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        console.log('   Top 5 segments in FY26:');
        topSegmentsFY26.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.segment}: ${item.count.toLocaleString()} signups (${item.share.toFixed(1)}%)`);
        });

        console.log('\n3. SEGMENT SHIFTS:');
        const biggestShifts = segmentList
          .map(seg => {
            const fy25Share = fyTotals.FY25.signups > 0 ? (fyTotals.FY25.segments[seg] / fyTotals.FY25.signups * 100) : 0;
            const fy26Share = fyTotals.FY26.signups > 0 ? (fyTotals.FY26.segments[seg] / fyTotals.FY26.signups * 100) : 0;
            return { segment: seg, shift: fy26Share - fy25Share };
          })
          .sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift))
          .slice(0, 3);

        console.log('   Biggest segment share changes:');
        biggestShifts.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.segment}: ${(item.shift >= 0 ? '+' : '')}${item.shift.toFixed(1)}pp`);
        });

        console.log('\n═'.repeat(160));

      } else {
        console.log('No data found');
      }

      connection.destroy((err) => {
        if (err) console.error('Error destroying connection:', err);
      });
    },
  });
});
