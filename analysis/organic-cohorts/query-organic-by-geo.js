// Organic signup performance by geography (2024 vs 2025)
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
    WITH organic_cohorts AS (
        SELECT
            YEAR(u.created_on) AS signup_year,
            u.dim_country AS country,
            u.location_region AS region,
            u.user_id,
            u.ds_first_activated,
            u.ts_first_subscription,
            DATEDIFF('day', u.created_on, u.ds_first_activated) AS days_to_activation,
            DATEDIFF('day', u.created_on, u.ts_first_subscription) AS days_to_first_sub
        FROM
            analytics.webflow.dim_user_attributions u
        WHERE
            u.dim_signup_attribution = 'organic'
            AND u.created_on >= '2024-01-01'
            AND u.created_on < '2025-09-01'  -- Through Aug 2025
    ),

    geo_metrics AS (
        SELECT
            signup_year,
            region,
            COUNT(DISTINCT user_id) AS organic_signups,

            -- Activation metrics
            COUNT(DISTINCT CASE WHEN ds_first_activated IS NOT NULL THEN user_id END) AS activated_users,
            COUNT(DISTINCT CASE WHEN days_to_activation <= 30 THEN user_id END) AS activated_30d,

            -- Conversion (30-day window)
            COUNT(DISTINCT CASE WHEN days_to_first_sub <= 30 THEN user_id END) AS converted_30d

        FROM organic_cohorts
        WHERE region IS NOT NULL
        GROUP BY 1, 2
    )

    SELECT
        signup_year,
        region,
        organic_signups,
        activated_users,
        activated_30d,
        converted_30d,

        -- Rates
        ROUND(activated_30d::FLOAT / NULLIF(organic_signups, 0) * 100, 1) AS activation_rate_30d,
        ROUND(converted_30d::FLOAT / NULLIF(organic_signups, 0) * 100, 2) AS conversion_rate_30d

    FROM geo_metrics
    WHERE organic_signups >= 1000  -- Filter to meaningful cohorts
    ORDER BY region ASC, signup_year ASC
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
        console.log('\n📊 ORGANIC PERFORMANCE BY GEOGRAPHY (2024 vs 2025 Jan-Aug)');
        console.log('═'.repeat(140));
        console.log('');

        // Group by region
        const regions = {};
        rows.forEach(row => {
          const reg = row.REGION || 'Unknown';
          if (!regions[reg]) regions[reg] = {};
          regions[reg][row.SIGNUP_YEAR] = row;
        });

        // Display comparison table
        console.log('Region               │ Year │  Signups  │ 30d Act % │ 30d Conv % │ Activated │ Converted');
        console.log('─'.repeat(140));

        Object.keys(regions).sort().forEach(region => {
          const data2024 = regions[region][2024] || {};
          const data2025 = regions[region][2025] || {};

          // 2024 row
          if (data2024.ORGANIC_SIGNUPS) {
            console.log(
              `${region.padEnd(20)} │ 2024 │ ${(data2024.ORGANIC_SIGNUPS || 0).toLocaleString().padStart(9)} │ ${(data2024.ACTIVATION_RATE_30D || 0).toFixed(1).padStart(8)}% │ ${(data2024.CONVERSION_RATE_30D || 0).toFixed(2).padStart(9)}% │ ${(data2024.ACTIVATED_30D || 0).toLocaleString().padStart(9)} │ ${(data2024.CONVERTED_30D || 0).toLocaleString().padStart(9)}`
            );
          }

          // 2025 row
          if (data2025.ORGANIC_SIGNUPS) {
            console.log(
              `${region.padEnd(20)} │ 2025 │ ${(data2025.ORGANIC_SIGNUPS || 0).toLocaleString().padStart(9)} │ ${(data2025.ACTIVATION_RATE_30D || 0).toFixed(1).padStart(8)}% │ ${(data2025.CONVERSION_RATE_30D || 0).toFixed(2).padStart(9)}% │ ${(data2025.ACTIVATED_30D || 0).toLocaleString().padStart(9)} │ ${(data2025.CONVERTED_30D || 0).toLocaleString().padStart(9)}`
            );
          }

          // YoY change
          if (data2024.ORGANIC_SIGNUPS && data2025.ORGANIC_SIGNUPS) {
            const volChange = ((data2025.ORGANIC_SIGNUPS - data2024.ORGANIC_SIGNUPS) / data2024.ORGANIC_SIGNUPS * 100);
            const actChange = (data2025.ACTIVATION_RATE_30D || 0) - (data2024.ACTIVATION_RATE_30D || 0);
            const convChange = (data2025.CONVERSION_RATE_30D || 0) - (data2024.CONVERSION_RATE_30D || 0);

            console.log(
              `${' '.repeat(20)} │ YoY  │ ${volChange >= 0 ? '+' : ''}${volChange.toFixed(1)}%`.padEnd(32) +
              ` │ ${actChange >= 0 ? '+' : ''}${actChange.toFixed(1)}pp`.padStart(10) +
              ` │ ${convChange >= 0 ? '+' : ''}${convChange.toFixed(2)}pp`.padStart(12) +
              ` │ ${' '.repeat(9)} │ ${' '.repeat(9)}`
            );
          }
          console.log('─'.repeat(140));
        });

        // Summary insights
        console.log('\n\n📈 KEY INSIGHTS BY GEOGRAPHY');
        console.log('═'.repeat(140));

        Object.keys(regions).sort().forEach(region => {
          const data2024 = regions[region][2024] || {};
          const data2025 = regions[region][2025] || {};

          if (data2024.ORGANIC_SIGNUPS && data2025.ORGANIC_SIGNUPS) {
            console.log(`\n🌍 ${region.toUpperCase()}`);

            const volChange = ((data2025.ORGANIC_SIGNUPS - data2024.ORGANIC_SIGNUPS) / data2024.ORGANIC_SIGNUPS * 100);
            const volTrend = volChange >= 0 ? '📈' : '📉';
            console.log(`   Volume:      ${data2024.ORGANIC_SIGNUPS.toLocaleString()} → ${data2025.ORGANIC_SIGNUPS.toLocaleString()} (${volTrend} ${volChange >= 0 ? '+' : ''}${volChange.toFixed(1)}%)`);

            const actChange = data2025.ACTIVATION_RATE_30D - data2024.ACTIVATION_RATE_30D;
            const actTrend = actChange >= 0 ? '📈' : '📉';
            console.log(`   30d Act:     ${data2024.ACTIVATION_RATE_30D.toFixed(1)}% → ${data2025.ACTIVATION_RATE_30D.toFixed(1)}% (${actTrend} ${actChange >= 0 ? '+' : ''}${actChange.toFixed(1)}pp)`);

            const convChange = data2025.CONVERSION_RATE_30D - data2024.CONVERSION_RATE_30D;
            const convTrend = convChange >= 0 ? '📈' : '📉';
            console.log(`   30d Conv:    ${data2024.CONVERSION_RATE_30D.toFixed(2)}% → ${data2025.CONVERSION_RATE_30D.toFixed(2)}% (${convTrend} ${convChange >= 0 ? '+' : ''}${convChange.toFixed(2)}pp)`);
          }
        });

        console.log('\n═'.repeat(140));

        // Top/Bottom performers
        console.log('\n\n🏆 BEST & WORST PERFORMING REGIONS');
        console.log('═'.repeat(140));

        const performanceData = [];
        Object.keys(regions).forEach(region => {
          const data2024 = regions[region][2024] || {};
          const data2025 = regions[region][2025] || {};
          if (data2024.ORGANIC_SIGNUPS && data2025.ORGANIC_SIGNUPS) {
            const volChange = ((data2025.ORGANIC_SIGNUPS - data2024.ORGANIC_SIGNUPS) / data2024.ORGANIC_SIGNUPS * 100);
            const actChange = (data2025.ACTIVATION_RATE_30D || 0) - (data2024.ACTIVATION_RATE_30D || 0);
            performanceData.push({
              region,
              volChange,
              actChange,
              signups2024: data2024.ORGANIC_SIGNUPS,
              signups2025: data2025.ORGANIC_SIGNUPS
            });
          }
        });

        // Sort by volume change
        performanceData.sort((a, b) => b.volChange - a.volChange);

        console.log('\n📈 FASTEST GROWING (Volume):');
        performanceData.slice(0, 5).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.region}: ${p.volChange >= 0 ? '+' : ''}${p.volChange.toFixed(1)}% (${p.signups2024.toLocaleString()} → ${p.signups2025.toLocaleString()})`);
        });

        console.log('\n📉 DECLINING MOST (Volume):');
        performanceData.slice(-5).reverse().forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.region}: ${p.volChange.toFixed(1)}% (${p.signups2024.toLocaleString()} → ${p.signups2025.toLocaleString()})`);
        });

        // Sort by activation change
        performanceData.sort((a, b) => b.actChange - a.actChange);

        console.log('\n📈 BEST ACTIVATION IMPROVEMENT:');
        performanceData.slice(0, 5).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.region}: ${p.actChange >= 0 ? '+' : ''}${p.actChange.toFixed(1)}pp`);
        });

        console.log('\n📉 WORST ACTIVATION DECLINE:');
        performanceData.slice(-5).reverse().forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.region}: ${p.actChange.toFixed(1)}pp`);
        });

        console.log('\n═'.repeat(140));

      } else {
        console.log('No data found');
      }

      connection.destroy((err) => {
        if (err) console.error('Error destroying connection:', err);
      });
    },
  });
});
