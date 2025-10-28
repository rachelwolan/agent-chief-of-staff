// Organic visitor conversion analysis by geography
// NOTE: Visitor data doesn't include geo breakdown, so this shows:
// - Total organic visitors (aggregate)
// - Organic signups by geo
// - Geo share of organic signups (proxy for conversion patterns)
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
            COALESCE(u.dim_country, 'Unknown') AS country,
            COALESCE(u.location_region, 'Unknown') AS region,
            COUNT(DISTINCT u.user_id) AS organic_signups
        FROM
            analytics.webflow.dim_user_attributions u
        WHERE
            u.created_on >= '2024-10-31'
            AND u.created_on <= '2025-10-17'
            AND u.dim_signup_attribution = 'organic'
        GROUP BY 1, 2, 3, 4
    ),

    regional_signups AS (
        SELECT
            fiscal_year,
            month,
            region,
            SUM(organic_signups) AS organic_signups
        FROM organic_signups
        GROUP BY 1, 2, 3
    ),

    country_signups AS (
        SELECT
            fiscal_year,
            month,
            country,
            SUM(organic_signups) AS organic_signups
        FROM organic_signups
        GROUP BY 1, 2, 3
    ),

    combined AS (
        SELECT
            v.fiscal_year,
            v.month,
            v.organic_visitors,
            r.region,
            COALESCE(r.organic_signups, 0) AS organic_signups
        FROM organic_visitors v
        LEFT JOIN regional_signups r
            ON v.fiscal_year = r.fiscal_year
            AND v.month = r.month
    )

    SELECT * FROM combined
    ORDER BY month, region
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
        console.log('\n📊 ORGANIC CONVERSION ANALYSIS BY GEOGRAPHY');
        console.log('═'.repeat(160));
        console.log('');
        console.log('⚠️  NOTE: Visitor tracking started Oct 31, 2024');
        console.log('⚠️  NOTE: Visitor data is not geo-segmented - showing total organic visitors vs. signups by region');
        console.log('');
        console.log('Time Periods:');
        console.log('  FY25 (partial): Nov 2024 - Jan 2025');
        console.log('  FY26 (partial): Feb 2025 - Oct 2025');
        console.log('═'.repeat(160));

        // Organize data by region
        const monthlyData = {};
        const regions = new Set();

        rows.forEach(row => {
          const key = `${row.FISCAL_YEAR}-${row.MONTH}`;
          if (!monthlyData[key]) {
            monthlyData[key] = {
              fiscal_year: row.FISCAL_YEAR,
              month: row.MONTH,
              total_visitors: row.ORGANIC_VISITORS,
              regions: {}
            };
          }
          if (row.REGION) {
            monthlyData[key].regions[row.REGION] = row.ORGANIC_SIGNUPS || 0;
            regions.add(row.REGION);
          }
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const regionList = Array.from(regions).sort();

        // Calculate totals by FY and region
        const fyTotals = {
          'FY25': { visitors: 0, signups: 0, regions: {} },
          'FY26': { visitors: 0, signups: 0, regions: {} }
        };

        regionList.forEach(reg => {
          fyTotals.FY25.regions[reg] = 0;
          fyTotals.FY26.regions[reg] = 0;
        });

        sortedMonths.forEach(key => {
          const data = monthlyData[key];
          const totalSignups = Object.values(data.regions).reduce((sum, val) => sum + val, 0);
          const fy = data.fiscal_year;

          fyTotals[fy].visitors += data.total_visitors;
          fyTotals[fy].signups += totalSignups;
          regionList.forEach(reg => {
            fyTotals[fy].regions[reg] += data.regions[reg] || 0;
          });
        });

        // Regional summary
        console.log('\n━━━ REGION SHARE OF ORGANIC SIGNUPS ━━━\n');
        console.log('Region            │ FY25 Signups │ FY25 Share │ FY26 Signups │ FY26 Share │ YoY Δ      │ FY26 Implied Conv %');
        console.log('─'.repeat(160));

        const regionalData = regionList
          .map(reg => {
            const fy25Count = fyTotals.FY25.regions[reg] || 0;
            const fy26Count = fyTotals.FY26.regions[reg] || 0;
            const fy25Share = fyTotals.FY25.signups > 0 ? (fy25Count / fyTotals.FY25.signups * 100) : 0;
            const fy26Share = fyTotals.FY26.signups > 0 ? (fy26Count / fyTotals.FY26.signups * 100) : 0;
            const shareChange = fy26Share - fy25Share;
            // Implied conversion assumes visitors distributed proportionally to signups
            const impliedConv = fyTotals.FY26.visitors > 0 ? (fy26Count / fyTotals.FY26.visitors * 100) : 0;

            return {
              region: reg,
              fy25Count,
              fy25Share,
              fy26Count,
              fy26Share,
              shareChange,
              impliedConv
            };
          })
          .sort((a, b) => b.fy26Count - a.fy26Count);

        regionalData.forEach(item => {
          console.log(
            `${item.region.padEnd(17)} │ ${item.fy25Count.toLocaleString().padStart(12)} │ ${item.fy25Share.toFixed(1).padStart(9)}% │ ${item.fy26Count.toLocaleString().padStart(12)} │ ${item.fy26Share.toFixed(1).padStart(9)}% │ ${(item.shareChange >= 0 ? '+' : '') + item.shareChange.toFixed(1).padStart(5)}pp │ ${item.impliedConv.toFixed(2).padStart(18)}%`
          );
        });

        // Period totals
        console.log('\n\n═'.repeat(160));
        console.log('📈 PERIOD SUMMARY');
        console.log('═'.repeat(160));
        console.log('');
        console.log('Period       │ Total Visitors │ Total Signups │ Overall Conv %');
        console.log('─'.repeat(160));

        ['FY25', 'FY26'].forEach(fy => {
          const data = fyTotals[fy];
          const convRate = data.visitors > 0 ? (data.signups / data.visitors * 100) : 0;
          const label = fy === 'FY25' ? 'FY25 (3mo)' : 'FY26 (9mo)';

          console.log(
            `${label.padEnd(12)} │ ${data.visitors.toLocaleString().padStart(14)} │ ${data.signups.toLocaleString().padStart(13)} │ ${convRate.toFixed(2).padStart(13)}%`
          );
        });

        // Key insights
        console.log('\n\n═'.repeat(160));
        console.log('💡 KEY INSIGHTS');
        console.log('═'.repeat(160));

        console.log('\n1. TOP REGIONS BY SIGNUP VOLUME (FY26):');
        const topRegions = regionalData.slice(0, 5);
        topRegions.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.region}: ${item.fy26Count.toLocaleString()} signups (${item.fy26Share.toFixed(1)}% share)`);
        });

        console.log('\n2. FASTEST GROWING REGIONS (Share Change):');
        const fastestGrowing = [...regionalData]
          .sort((a, b) => b.shareChange - a.shareChange)
          .slice(0, 5);
        fastestGrowing.forEach((item, idx) => {
          if (item.shareChange > 0) {
            console.log(`   ${idx + 1}. ${item.region}: ${(item.shareChange >= 0 ? '+' : '')}${item.shareChange.toFixed(1)}pp (${item.fy25Count.toLocaleString()} → ${item.fy26Count.toLocaleString()})`);
          }
        });

        console.log('\n3. DECLINING REGIONS (Share Change):');
        const declining = [...regionalData]
          .sort((a, b) => a.shareChange - b.shareChange)
          .slice(0, 5);
        declining.forEach((item, idx) => {
          if (item.shareChange < 0) {
            console.log(`   ${idx + 1}. ${item.region}: ${item.shareChange.toFixed(1)}pp (${item.fy25Count.toLocaleString()} → ${item.fy26Count.toLocaleString()})`);
          }
        });

        console.log('\n4. OVERALL CONVERSION:');
        const fy25Conv = fyTotals.FY25.visitors > 0 ? (fyTotals.FY25.signups / fyTotals.FY25.visitors * 100) : 0;
        const fy26Conv = fyTotals.FY26.visitors > 0 ? (fyTotals.FY26.signups / fyTotals.FY26.visitors * 100) : 0;
        console.log(`   • FY25: ${fy25Conv.toFixed(2)}% (${fyTotals.FY25.signups.toLocaleString()} / ${fyTotals.FY25.visitors.toLocaleString()})`);
        console.log(`   • FY26: ${fy26Conv.toFixed(2)}% (${fyTotals.FY26.signups.toLocaleString()} / ${fyTotals.FY26.visitors.toLocaleString()})`);
        console.log(`   • Change: ${(fy26Conv - fy25Conv >= 0 ? '+' : '')}${(fy26Conv - fy25Conv).toFixed(2)}pp`);

        console.log('\n⚠️  NOTE: Regional conversion rates are approximations based on signup distribution.');
        console.log('   Actual visitor geo distribution may differ from signup distribution.');

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
