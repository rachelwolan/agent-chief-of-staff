import express from 'express';
import cors from 'cors';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Cache for MCP client connection
let mcpClient = null;

async function getSnowflakeClient() {
  if (mcpClient) return mcpClient;

  console.log('Connecting to Snowflake MCP server...');

  const transport = new StdioClientTransport({
    command: 'uvx',
    args: [
      'snowflake-labs-mcp',
      '--service-config-file',
      'dashboards/snowflake-mcp-config.yaml'
    ],
    env: {
      ...process.env,
      SNOWFLAKE_USER: process.env.SNOWFLAKE_USER || 'rachel.wolan@webflow.com',
      SNOWFLAKE_ACCOUNT: process.env.SNOWFLAKE_ACCOUNT || 'n71398.us-east-1',
      SNOWFLAKE_DATABASE: process.env.SNOWFLAKE_DATABASE || 'ANALYTICS',
      SNOWFLAKE_WAREHOUSE: process.env.SNOWFLAKE_WAREHOUSE || 'webflow',
      SNOWFLAKE_AUTHENTICATOR: process.env.SNOWFLAKE_AUTHENTICATOR || 'externalbrowser'
    }
  });

  const client = new Client({
    name: 'dashboard-server',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  await client.connect(transport);
  mcpClient = client;
  console.log('✓ Connected to Snowflake MCP server');

  return client;
}

// Execute a Snowflake query via MCP
async function executeQuery(query) {
  const client = await getSnowflakeClient();

  // First time connecting, list available tools for debugging
  if (!global.toolsListed) {
    try {
      const tools = await client.listTools();
      console.log('Available Snowflake MCP tools:', tools.tools.map(t => t.name));
      global.toolsListed = true;
    } catch (e) {
      console.log('Could not list tools:', e.message);
    }
  }

  // Try different possible tool names
  const toolNames = ['execute_sql', 'snowflake-query', 'query', 'sql'];
  let result = null;
  let lastError = null;

  for (const toolName of toolNames) {
    try {
      result = await client.callTool({
        name: toolName,
        arguments: { query, sql: query }
      });
      console.log(`✓ Successfully used tool: ${toolName}`);
      break;
    } catch (e) {
      lastError = e;
      console.log(`  Tool ${toolName} not found, trying next...`);
    }
  }

  if (!result) {
    throw new Error(`No working query tool found. Last error: ${lastError?.message}`);
  }

  // Parse the result - MCP returns data in content array
  if (result.content && result.content.length > 0) {
    const textContent = result.content.find(c => c.type === 'text');
    if (textContent) {
      try {
        return JSON.parse(textContent.text);
      } catch (e) {
        return textContent.text;
      }
    }
  }

  return result;
}

// API endpoint for yesterday's metrics
app.get('/api/metrics/yesterday', async (req, res) => {
  try {
    const query = `
      SELECT
        date_day,
        sign_ups AS total_signups,
        sign_ups_paid,
        sign_ups_organic,
        ROUND(sign_ups_paid::FLOAT / NULLIF(sign_ups, 0) * 100, 1) AS pct_paid,
        ROUND(sign_ups_organic::FLOAT / NULLIF(sign_ups, 0) * 100, 1) AS pct_organic,
        sign_ups_completed_onboarding_survey AS completed_onboarding,
        users_created_first_site,
        first_user_conversions AS total_ftc,
        first_user_conversions_7_days AS ftc_7d,
        first_user_conversions_30_days AS ftc_30d,
        mrr_from_ftc_purchase_unb AS ftc_mrr_total
      FROM analytics.webflow.report__kpi_daily
      WHERE date_day = CURRENT_DATE - 1
      ORDER BY date_day DESC
      LIMIT 1;
    `;

    const result = await executeQuery(query);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching yesterday metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint for week-over-week comparison
app.get('/api/metrics/wow', async (req, res) => {
  try {
    const query = `
      WITH yesterday AS (
        SELECT * FROM analytics.webflow.report__kpi_daily
        WHERE date_day = CURRENT_DATE - 1
      ),
      last_week AS (
        SELECT * FROM analytics.webflow.report__kpi_daily
        WHERE date_day = CURRENT_DATE - 8
      )
      SELECT
        yesterday.sign_ups AS yesterday_signups,
        last_week.sign_ups AS last_week_signups,
        ROUND((yesterday.sign_ups - last_week.sign_ups)::FLOAT / NULLIF(last_week.sign_ups, 0) * 100, 1) AS signups_change_pct,
        yesterday.users_created_first_site AS yesterday_first_sites,
        last_week.users_created_first_site AS last_week_first_sites,
        ROUND((yesterday.users_created_first_site - last_week.users_created_first_site)::FLOAT / NULLIF(last_week.users_created_first_site, 0) * 100, 1) AS first_sites_change_pct,
        yesterday.first_user_conversions AS yesterday_ftc,
        last_week.first_user_conversions AS last_week_ftc,
        ROUND((yesterday.first_user_conversions - last_week.first_user_conversions)::FLOAT / NULLIF(last_week.first_user_conversions, 0) * 100, 1) AS ftc_change_pct
      FROM yesterday, last_week;
    `;

    const result = await executeQuery(query);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching WoW metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint for 30-day trend
app.get('/api/metrics/trend30', async (req, res) => {
  try {
    const query = `
      SELECT
        date_day,
        sign_ups,
        users_created_first_site,
        first_user_conversions,
        mrr_from_ftc_purchase_unb
      FROM analytics.webflow.report__kpi_daily
      WHERE date_day >= CURRENT_DATE - 30
        AND date_day < CURRENT_DATE
      ORDER BY date_day ASC;
    `;

    const result = await executeQuery(query);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching 30-day trend:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint for custom date query
app.post('/api/metrics/date', async (req, res) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required' });
    }

    const query = `
      SELECT
        date_day,
        sign_ups AS total_signups,
        sign_ups_paid,
        sign_ups_organic,
        ROUND(sign_ups_paid::FLOAT / NULLIF(sign_ups, 0) * 100, 1) AS pct_paid,
        ROUND(sign_ups_organic::FLOAT / NULLIF(sign_ups, 0) * 100, 1) AS pct_organic,
        sign_ups_completed_onboarding_survey AS completed_onboarding,
        users_created_first_site,
        first_user_conversions AS total_ftc,
        first_user_conversions_7_days AS ftc_7d,
        first_user_conversions_30_days AS ftc_30d,
        mrr_from_ftc_purchase_unb AS ftc_mrr_total
      FROM analytics.webflow.report__kpi_daily
      WHERE date_day = '${date}'
      ORDER BY date_day DESC
      LIMIT 1;
    `;

    const result = await executeQuery(query);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching date metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const client = await getSnowflakeClient();
    const result = await client.callTool({
      name: 'snowflake-query',
      arguments: {
        query: 'SELECT CURRENT_VERSION() as version, CURRENT_USER() as user'
      }
    });

    res.json({
      success: true,
      message: 'Connected to Snowflake',
      snowflake: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  if (mcpClient) {
    await mcpClient.close();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`📊 Dashboard server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
