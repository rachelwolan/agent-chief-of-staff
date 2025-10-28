// Visitor traffic analysis for FY25 (partial) and FY26 (partial)
// NOTE: Visitor tracking data only available from Oct 31, 2024 onwards
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
    WITH visitor_daily AS (
        SELECT
            date_day,
            -- Map to fiscal year (starts Feb 1)
            CASE
                WHEN date_day >= '2024-02-01' AND date_day < '2025-02-01' THEN 'FY25'
                WHEN date_day >= '2025-02-01' AND date_day <= '2025-10-17' THEN 'FY26'
                ELSE NULL
            END AS fiscal_year,
            -- Categorize as Organic or Paid
            CASE
                WHEN dim_channel_category_updated LIKE 'Organic%' THEN 'Organic'
                WHEN dim_channel_category_updated LIKE 'Paid%' THEN 'Paid'
                ELSE 'Other'
            END AS channel_type,
            SUM(new_visitors) AS new_visitors,
            SUM(total_visitors) AS total_visitors
        FROM
            analytics.webflow.report__daily_marketing_visitors
        WHERE
            date_day >= '2024-10-31'  -- Data only available from this date
            AND date_day <= '2025-10-17'
        GROUP BY 1, 2, 3
    ),

    signup_daily AS (
        SELECT
            date_day,
            CASE
                WHEN date_day >= '2024-02-01' AND date_day < '2025-02-01' THEN 'FY25'
                WHEN date_day >= '2025-02-01' AND date_day <= '2025-10-17' THEN 'FY26'
                ELSE NULL
            END AS fiscal_year,
            sign_ups AS total_signups,
            sign_ups_organic AS organic_signups,
            sign_ups_paid AS paid_signups
        FROM
            analytics.webflow.report__kpi_daily
        WHERE
            date_day >= '2024-10-31'
            AND date_day <= '2025-10-17'
    ),

    monthly_visitors AS (
        SELECT
            fiscal_year,
            DATE_TRUNC('month', date_day) AS month,
            channel_type,
            SUM(new_visitors) AS new_visitors,
            SUM(total_visitors) AS total_visitors
        FROM visitor_daily
        WHERE fiscal_year IS NOT NULL
        GROUP BY 1, 2, 3
    ),

    monthly_signups AS (
        SELECT
            fiscal_year,
            DATE_TRUNC('month', date_day) AS month,
            SUM(total_signups) AS total_signups,
            SUM(organic_signups) AS organic_signups,
            SUM(paid_signups) AS paid_signups
        FROM signup_daily
        WHERE fiscal_year IS NOT NULL
        GROUP BY 1, 2
    ),

    monthly_combined AS (
        SELECT
            COALESCE(v.fiscal_year, s.fiscal_year) AS fiscal_year,
            COALESCE(v.month, s.month) AS month,
            SUM(CASE WHEN v.channel_type = 'Organic' THEN v.total_visitors ELSE 0 END) AS organic_visitors,
            SUM(CASE WHEN v.channel_type = 'Paid' THEN v.total_visitors ELSE 0 END) AS paid_visitors,
            SUM(v.total_visitors) AS total_visitors,
            MAX(s.organic_signups) AS organic_signups,
            MAX(s.paid_signups) AS paid_signups,
            MAX(s.total_signups) AS total_signups
        FROM monthly_visitors v
        LEFT JOIN monthly_signups s
            ON v.fiscal_year = s.fiscal_year AND v.month = s.month
        GROUP BY 1, 2
    )

    SELECT * FROM monthly_combined
    ORDER BY month
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
        console.log('\n📊 VISITOR TRAFFIC ANALYSIS');
        console.log('═'.repeat(180));
        console.log('');
        console.log('⚠️  NOTE: Visitor tracking data only available from Oct 31, 2024 onwards');
        console.log('');
        console.log('Time Periods:');
        console.log('  FY25 (partial): Nov 2024 - Jan 2025 (last 3 months of FY25)');
        console.log('  FY26 (partial): Feb 2025 - Oct 2025 (first 9 months of FY26)');
        console.log('═'.repeat(180));
        console.log('');

        // Organize data by FY
        const fyData = {
          'FY25': [],
          'FY26': []
        };

        rows.forEach(row => {
          if (fyData[row.FISCAL_YEAR]) {
            fyData[row.FISCAL_YEAR].push(row);
          }
        });

        // Display monthly trends
        console.log('\n━━━ MONTHLY VISITOR & CONVERSION TRENDS ━━━\n');
        console.log('Month        │ FY25 Visitors │ FY25 Signups │ FY25 Conv % │ FY26 Visitors │ FY26 Signups │ FY26 Conv % │ YoY Visitor Δ │ YoY Conv Δ');
        console.log('─'.repeat(180));

        const fy25Months = ['Nov', 'Dec', 'Jan'];
        const fy26Months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

        // FY25 months
        fy25Months.forEach((monthName, idx) => {
          const fy25Month = fyData.FY25[idx];

          if (fy25Month) {
            const visitors25 = fy25Month?.TOTAL_VISITORS || 0;
            const signups25 = fy25Month?.TOTAL_SIGNUPS || 0;
            const conv25 = visitors25 > 0 ? (signups25 / visitors25 * 100) : 0;

            console.log(
              `${monthName.padEnd(12)} │ ${visitors25.toLocaleString().padStart(13)} │ ${signups25.toLocaleString().padStart(12)} │ ${conv25.toFixed(2).padStart(10)}% │ ${('—').padStart(13)} │ ${('—').padStart(12)} │ ${('—').padStart(11)} │ ${('—').padStart(14)} │ ${('—').padStart(11)}`
            );
          }
        });

        // FY26 months with YoY comparison to corresponding FY25 months where available
        fy26Months.forEach((monthName, idx) => {
          const fy26Month = fyData.FY26[idx];

          if (fy26Month) {
            const visitors26 = fy26Month?.TOTAL_VISITORS || 0;
            const signups26 = fy26Month?.TOTAL_SIGNUPS || 0;
            const conv26 = visitors26 > 0 ? (signups26 / visitors26 * 100) : 0;

            console.log(
              `${monthName.padEnd(12)} │ ${('—').padStart(13)} │ ${('—').padStart(12)} │ ${('—').padStart(11)} │ ${visitors26.toLocaleString().padStart(13)} │ ${signups26.toLocaleString().padStart(12)} │ ${conv26.toFixed(2).padStart(10)}% │ ${('—').padStart(14)} │ ${('—').padStart(11)}`
            );
          }
        });

        // Channel breakdown
        console.log('\n\n━━━ VISITOR CHANNEL BREAKDOWN ━━━\n');
        console.log('Month        │ Organic Visitors │ Paid Visitors │ Total Visitors │ Organic % │ Paid %');
        console.log('─'.repeat(180));

        [...fy25Months, ...fy26Months].forEach((monthName, idx) => {
          const allRows = [...fyData.FY25, ...fyData.FY26];
          const monthData = allRows[idx];

          if (monthData) {
            const organic = monthData?.ORGANIC_VISITORS || 0;
            const paid = monthData?.PAID_VISITORS || 0;
            const total = monthData?.TOTAL_VISITORS || 0;
            const organicPct = total > 0 ? (organic / total * 100) : 0;
            const paidPct = total > 0 ? (paid / total * 100) : 0;

            console.log(
              `${monthName.padEnd(12)} │ ${organic.toLocaleString().padStart(16)} │ ${paid.toLocaleString().padStart(13)} │ ${total.toLocaleString().padStart(14)} │ ${organicPct.toFixed(1).padStart(8)}% │ ${paidPct.toFixed(1).padStart(5)}%`
            );
          }
        });

        // Fiscal Year Summary
        console.log('\n\n═'.repeat(180));
        console.log('📈 PERIOD SUMMARY');
        console.log('═'.repeat(180));
        console.log('');
        console.log('Period      │ Total Visitors │ Organic Visitors │ Paid Visitors │ Total Signups │ Overall Conv % │ Organic Conv % │ Paid Conv %');
        console.log('─'.repeat(180));

        let fy25TotalVisitors = 0, fy25OrganicVisitors = 0, fy25PaidVisitors = 0, fy25TotalSignups = 0, fy25OrganicSignups = 0, fy25PaidSignups = 0;
        let fy26TotalVisitors = 0, fy26OrganicVisitors = 0, fy26PaidVisitors = 0, fy26TotalSignups = 0, fy26OrganicSignups = 0, fy26PaidSignups = 0;

        fyData.FY25.forEach(row => {
          fy25TotalVisitors += row.TOTAL_VISITORS || 0;
          fy25OrganicVisitors += row.ORGANIC_VISITORS || 0;
          fy25PaidVisitors += row.PAID_VISITORS || 0;
          fy25TotalSignups += row.TOTAL_SIGNUPS || 0;
          fy25OrganicSignups += row.ORGANIC_SIGNUPS || 0;
          fy25PaidSignups += row.PAID_SIGNUPS || 0;
        });

        fyData.FY26.forEach(row => {
          fy26TotalVisitors += row.TOTAL_VISITORS || 0;
          fy26OrganicVisitors += row.ORGANIC_VISITORS || 0;
          fy26PaidVisitors += row.PAID_VISITORS || 0;
          fy26TotalSignups += row.TOTAL_SIGNUPS || 0;
          fy26OrganicSignups += row.ORGANIC_SIGNUPS || 0;
          fy26PaidSignups += row.PAID_SIGNUPS || 0;
        });

        const fy25Conv = fy25TotalVisitors > 0 ? (fy25TotalSignups / fy25TotalVisitors * 100) : 0;
        const fy26Conv = fy26TotalVisitors > 0 ? (fy26TotalSignups / fy26TotalVisitors * 100) : 0;

        const fy25OrganicConv = fy25OrganicVisitors > 0 ? (fy25OrganicSignups / fy25OrganicVisitors * 100) : 0;
        const fy25PaidConv = fy25PaidVisitors > 0 ? (fy25PaidSignups / fy25PaidVisitors * 100) : 0;
        const fy26OrganicConv = fy26OrganicVisitors > 0 ? (fy26OrganicSignups / fy26OrganicVisitors * 100) : 0;
        const fy26PaidConv = fy26PaidVisitors > 0 ? (fy26PaidSignups / fy26PaidVisitors * 100) : 0;

        console.log(
          `FY25 (3mo)  │ ${fy25TotalVisitors.toLocaleString().padStart(14)} │ ${fy25OrganicVisitors.toLocaleString().padStart(16)} │ ${fy25PaidVisitors.toLocaleString().padStart(13)} │ ${fy25TotalSignups.toLocaleString().padStart(13)} │ ${fy25Conv.toFixed(2).padStart(13)}% │ ${fy25OrganicConv.toFixed(2).padStart(13)}% │ ${fy25PaidConv.toFixed(2).padStart(10)}%`
        );

        console.log(
          `FY26 (9mo)  │ ${fy26TotalVisitors.toLocaleString().padStart(14)} │ ${fy26OrganicVisitors.toLocaleString().padStart(16)} │ ${fy26PaidVisitors.toLocaleString().padStart(13)} │ ${fy26TotalSignups.toLocaleString().padStart(13)} │ ${fy26Conv.toFixed(2).padStart(13)}% │ ${fy26OrganicConv.toFixed(2).padStart(13)}% │ ${fy26PaidConv.toFixed(2).padStart(10)}%`
        );

        // Calculate averages
        console.log('─'.repeat(180));
        const fy25MonthlyAvgVisitors = fy25TotalVisitors / 3;
        const fy26MonthlyAvgVisitors = fy26TotalVisitors / 9;
        const monthlyVisitorChange = fy25MonthlyAvgVisitors > 0 ? ((fy26MonthlyAvgVisitors - fy25MonthlyAvgVisitors) / fy25MonthlyAvgVisitors * 100) : 0;

        const convChange = fy26Conv - fy25Conv;

        console.log(
          `Avg/Month   │ ${fy25MonthlyAvgVisitors.toLocaleString('en-US', {maximumFractionDigits: 0}).padStart(14)} │ ${(fy25OrganicVisitors/3).toLocaleString('en-US', {maximumFractionDigits: 0}).padStart(16)} │ ${(fy25PaidVisitors/3).toLocaleString('en-US', {maximumFractionDigits: 0}).padStart(13)} │ ${(fy25TotalSignups/3).toLocaleString('en-US', {maximumFractionDigits: 0}).padStart(13)} │               │                │           `
        );
        console.log(
          `            │ ${fy26MonthlyAvgVisitors.toLocaleString('en-US', {maximumFractionDigits: 0}).padStart(14)} │ ${(fy26OrganicVisitors/9).toLocaleString('en-US', {maximumFractionDigits: 0}).padStart(16)} │ ${(fy26PaidVisitors/9).toLocaleString('en-US', {maximumFractionDigits: 0}).padStart(13)} │ ${(fy26TotalSignups/9).toLocaleString('en-US', {maximumFractionDigits: 0}).padStart(13)} │               │                │           `
        );
        console.log(
          `Change      │ ${((monthlyVisitorChange >= 0 ? '+' : '') + monthlyVisitorChange.toFixed(1) + '%').padStart(14)} │                  │               │               │ ${((convChange >= 0 ? '+' : '') + convChange.toFixed(2) + 'pp').padStart(13)} │                │           `
        );

        // Key insights
        console.log('\n\n═'.repeat(180));
        console.log('💡 KEY INSIGHTS');
        console.log('═'.repeat(180));

        console.log('\n1. VISITOR TRAFFIC TRENDS:');
        console.log(`   • FY25 (Nov-Jan): ${fy25TotalVisitors.toLocaleString()} total visitors (${fy25MonthlyAvgVisitors.toLocaleString('en-US', {maximumFractionDigits: 0})} avg/month)`);
        console.log(`   • FY26 (Feb-Oct): ${fy26TotalVisitors.toLocaleString()} total visitors (${fy26MonthlyAvgVisitors.toLocaleString('en-US', {maximumFractionDigits: 0})} avg/month)`);
        console.log(`   • Monthly average change: ${monthlyVisitorChange >= 0 ? '+' : ''}${monthlyVisitorChange.toFixed(1)}%`);

        console.log('\n2. VISITOR-TO-SIGNUP CONVERSION:');
        console.log(`   • FY25 (3 months): ${fy25Conv.toFixed(2)}% overall conversion`);
        console.log(`   • FY26 (9 months): ${fy26Conv.toFixed(2)}% overall conversion`);
        console.log(`   • Change: ${convChange >= 0 ? '+' : ''}${convChange.toFixed(2)}pp`);

        const fy25OrganicPct = fy25TotalVisitors > 0 ? (fy25OrganicVisitors / fy25TotalVisitors * 100) : 0;
        const fy26OrganicPct = fy26TotalVisitors > 0 ? (fy26OrganicVisitors / fy26TotalVisitors * 100) : 0;
        const organicVisitorChange = fy25OrganicVisitors > 0 ? ((fy26OrganicVisitors/9 - fy25OrganicVisitors/3) / (fy25OrganicVisitors/3) * 100) : 0;
        const paidVisitorChange = fy25PaidVisitors > 0 ? ((fy26PaidVisitors/9 - fy25PaidVisitors/3) / (fy25PaidVisitors/3) * 100) : 0;

        console.log('\n3. CHANNEL MIX:');
        console.log(`   • FY25: ${fy25OrganicPct.toFixed(1)}% organic, ${(100-fy25OrganicPct).toFixed(1)}% paid`);
        console.log(`   • FY26: ${fy26OrganicPct.toFixed(1)}% organic, ${(100-fy26OrganicPct).toFixed(1)}% paid`);
        console.log(`   • Shift: ${(fy26OrganicPct - fy25OrganicPct >= 0 ? '+' : '')}${(fy26OrganicPct - fy25OrganicPct).toFixed(1)}pp toward ${fy26OrganicPct > fy25OrganicPct ? 'organic' : 'paid'}`);

        console.log('\n4. CHANNEL PERFORMANCE (Monthly Averages):');
        console.log(`   • Organic: ${(fy25OrganicVisitors/3).toLocaleString('en-US', {maximumFractionDigits: 0})}/mo → ${(fy26OrganicVisitors/9).toLocaleString('en-US', {maximumFractionDigits: 0})}/mo (${organicVisitorChange >= 0 ? '+' : ''}${organicVisitorChange.toFixed(1)}%)`);
        console.log(`   • Paid: ${(fy25PaidVisitors/3).toLocaleString('en-US', {maximumFractionDigits: 0})}/mo → ${(fy26PaidVisitors/9).toLocaleString('en-US', {maximumFractionDigits: 0})}/mo (${paidVisitorChange >= 0 ? '+' : ''}${paidVisitorChange.toFixed(1)}%)`);

        console.log('\n5. CONVERSION BY CHANNEL:');
        console.log(`   • Organic: ${fy25OrganicConv.toFixed(2)}% → ${fy26OrganicConv.toFixed(2)}% (${fy26OrganicConv - fy25OrganicConv >= 0 ? '+' : ''}${(fy26OrganicConv - fy25OrganicConv).toFixed(2)}pp)`);
        console.log(`   • Paid: ${fy25PaidConv.toFixed(2)}% → ${fy26PaidConv.toFixed(2)}% (${fy26PaidConv - fy25PaidConv >= 0 ? '+' : ''}${(fy26PaidConv - fy25PaidConv).toFixed(2)}pp)`);

        // Alerts
        if (monthlyVisitorChange < -10) {
          console.log('\n⚠️  ALERT: Monthly visitor traffic declining - investigate marketing and SEO');
        } else if (monthlyVisitorChange > 15) {
          console.log('\n✅ Strong visitor growth - good marketing performance');
        }

        if (convChange < -0.5) {
          console.log(`⚠️  Conversion rate declining (${convChange.toFixed(2)}pp) - investigate UX and onboarding`);
        } else if (convChange > 0.5) {
          console.log(`✅ Conversion improving (${convChange.toFixed(2)}pp) - good product/marketing alignment`);
        }

        if (paidVisitorChange < -20) {
          console.log(`⚠️  Paid traffic declining significantly (${paidVisitorChange.toFixed(1)}% per month) - review paid strategy`);
        }

        console.log('\n═'.repeat(180));

      } else {
        console.log('No data found');
      }

      connection.destroy((err) => {
        if (err) console.error('Error destroying connection:', err);
      });
    },
  });
});
