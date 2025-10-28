#!/usr/bin/env node

/**
 * Snowflake CLI
 * Quick access to Snowflake metrics
 */

import snowflake from 'snowflake-sdk';

// Snowflake connection configuration
const config = {
  account: process.env.SNOWFLAKE_ACCOUNT || 'wn71398.us-east-1',
  username: process.env.SNOWFLAKE_USER || 'rachel.wolan@webflow.com',
  database: process.env.SNOWFLAKE_DATABASE || 'ANALYTICS',
  schema: process.env.SNOWFLAKE_SCHEMA || 'WEBFLOW',
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'SNOWFLAKE_REPORTING_WH_4',
  authenticator: process.env.SNOWFLAKE_AUTHENTICATOR || 'externalbrowser',
  // Enable client session keep alive to reuse connection
  clientSessionKeepAlive: true,
  // Keep connection alive for 4 hours
  clientSessionKeepAliveHeartbeatFrequency: 3600,
};

// Singleton connection - reuse across queries
let cachedConnection: any = null;

async function getConnection(): Promise<any> {
  if (cachedConnection && cachedConnection.isUp()) {
    return cachedConnection;
  }

  return new Promise((resolve, reject) => {
    cachedConnection = snowflake.createConnection(config);

    cachedConnection.connectAsync((err: any, conn: any) => {
      if (err) {
        cachedConnection = null;
        reject(err);
        return;
      }
      resolve(conn);
    });
  });
}

async function executeQuery(query: string): Promise<any[]> {
  const connection = await getConnection();

  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: query,
      complete: (err: any, stmt: any, rows: any[]) => {
        // Don't destroy connection - reuse it!
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      },
    });
  });
}

// Clean up connection on exit
process.on('exit', () => {
  if (cachedConnection && cachedConnection.destroy) {
    cachedConnection.destroy((err: any) => {
      if (err) console.error('Error destroying connection:', err);
    });
  }
});

async function getSignups(date?: string) {
  const dateCondition = date
    ? `date_day = '${date}'`
    : `date_day = CURRENT_DATE - 1`;

  const query = `
    SELECT
        date_day,
        sign_ups AS total_signups,
        sign_ups_paid AS signups_paid,
        sign_ups_organic AS signups_organic,
        ROUND(sign_ups_paid::FLOAT / NULLIF(sign_ups, 0) * 100, 1) AS pct_paid,
        ROUND(sign_ups_organic::FLOAT / NULLIF(sign_ups, 0) * 100, 1) AS pct_organic,
        users_created_first_site,
        ROUND(users_created_first_site::FLOAT / NULLIF(sign_ups, 0) * 100, 1) AS first_site_rate
    FROM
        analytics.webflow.report__kpi_daily
    WHERE
        ${dateCondition}
    ORDER BY
        date_day DESC
  `;

  const rows = await executeQuery(query);

  if (rows.length === 0) {
    console.log('No data found for the specified date');
    return;
  }

  const data = rows[0];
  console.log('\n📊 Signup Metrics');
  console.log('=================');
  console.log(`Date: ${new Date(data.DATE_DAY).toLocaleDateString()}`);
  console.log(`\nTotal Signups: ${data.TOTAL_SIGNUPS.toLocaleString()}`);
  console.log(`  • Paid: ${data.SIGNUPS_PAID.toLocaleString()} (${data.PCT_PAID}%)`);
  console.log(`  • Organic: ${data.SIGNUPS_ORGANIC.toLocaleString()} (${data.PCT_ORGANIC}%)`);
  console.log(`\nFirst Site Created: ${data.USERS_CREATED_FIRST_SITE.toLocaleString()} (${data.FIRST_SITE_RATE}%)`);
}

async function getWeeklyTrend() {
  const query = `
    SELECT
        date_day,
        sign_ups,
        sign_ups_paid,
        sign_ups_organic
    FROM
        analytics.webflow.report__kpi_daily
    WHERE
        date_day >= CURRENT_DATE - 7
        AND date_day < CURRENT_DATE
    ORDER BY
        date_day DESC
  `;

  const rows = await executeQuery(query);

  console.log('\n📈 Last 7 Days Signup Trend');
  console.log('===========================');
  rows.forEach((row: any) => {
    const date = new Date(row.DATE_DAY).toLocaleDateString();
    console.log(`${date}: ${row.SIGN_UPS.toLocaleString()} (Paid: ${row.SIGN_UPS_PAID}, Organic: ${row.SIGN_UPS_ORGANIC})`);
  });
}

async function customQuery(query: string) {
  console.log('\n🔍 Executing custom query...\n');
  const rows = await executeQuery(query);
  console.log(JSON.stringify(rows, null, 2));
}

async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'signups':
        await getSignups(arg);
        break;
      case 'trend':
        await getWeeklyTrend();
        break;
      case 'query':
        if (!arg) {
          console.error('Error: Please provide a SQL query');
          process.exit(1);
        }
        await customQuery(arg);
        break;
      default:
        console.log('Snowflake CLI - Quick access to metrics');
        console.log('\nUsage:');
        console.log('  npm run snowflake signups [date]  - Get signup metrics (default: yesterday)');
        console.log('  npm run snowflake trend           - Show 7-day signup trend');
        console.log('  npm run snowflake query "SQL"     - Execute custom SQL query');
        console.log('\nExamples:');
        console.log('  npm run snowflake signups');
        console.log('  npm run snowflake signups 2025-10-14');
        console.log('  npm run snowflake trend');
        process.exit(0);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
