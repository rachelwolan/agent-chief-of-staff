# Snowflake MCP Server Setup

This guide walks through setting up the Snowflake MCP server for dashboard monitoring.

## Prerequisites

1. **Snowflake Access with Okta SSO**
   - Account: `n71398.us-east-1`
   - Username: `rachel.wolan@webflow.com`
   - Database: `ANALYTICS`
   - Warehouse: `webflow`
   - Authentication: External browser (Okta SSO)

2. **Node.js & npm** installed

## Installation Steps

### 1. Install Snowflake MCP Server

The official Snowflake MCP server is available via npx:

```bash
npx @modelcontextprotocol/server-snowflake
```

### 2. Store Credentials in .env

Add your Snowflake configuration to `.env`:

```bash
# Snowflake Configuration for Okta SSO
SNOWFLAKE_USER=rachel.wolan@webflow.com     # Your Okta/email username
SNOWFLAKE_ACCOUNT=n71398.us-east-1          # Your Snowflake account identifier
SNOWFLAKE_DATABASE=ANALYTICS                # Your Snowflake database
SNOWFLAKE_WAREHOUSE=webflow                 # Your Snowflake warehouse
SNOWFLAKE_AUTHENTICATOR=externalbrowser     # Use external browser for Okta SSO
```

**Note:** Using `externalbrowser` authentication means you'll authenticate via Okta SSO in your browser when the MCP server connects.

### 3. Configure MCP Server

The MCP configuration file is at `~/.config/claude-code/mcp.json`:

```json
{
  "mcpServers": {
    "snowflake": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-snowflake"
      ],
      "env": {
        "SNOWFLAKE_ACCOUNT": "n71398.us-east-1",
        "SNOWFLAKE_USER": "rachel.wolan@webflow.com",
        "SNOWFLAKE_DATABASE": "ANALYTICS",
        "SNOWFLAKE_WAREHOUSE": "webflow",
        "SNOWFLAKE_AUTHENTICATOR": "externalbrowser"
      }
    }
  }
}
```

### 4. Create Snapshot Directories

```bash
mkdir -p logs/snowflake-snapshots
mkdir -p logs/snowflake-monitor
```

## Available MCP Tools

The Snowflake MCP server provides these tools:

### `snowflake-query`
Execute SQL queries against Snowflake
- `query`: SQL query to execute
- Returns results as structured data

### `snowflake-list-databases`
List all databases you have access to
- No parameters required

### `snowflake-list-schemas`
List schemas in a database
- `database`: Database name

### `snowflake-list-tables`
List tables in a schema
- `database`: Database name
- `schema`: Schema name

### `snowflake-describe-table`
Get table schema/structure
- `database`: Database name
- `schema`: Schema name
- `table`: Table name

## Usage in Agent

Claude will use the MCP tools like this:

```typescript
// Execute a query to get metrics
const result = await mcp.snowflake_query({
  query: `
    SELECT
      SUM(revenue) as total_revenue,
      COUNT(DISTINCT customer_id) as customer_count
    FROM ANALYTICS.sales.orders
    WHERE date >= CURRENT_DATE - INTERVAL '7 days'
  `
});

// List available tables
const tables = await mcp.snowflake_list_tables({
  database: 'ANALYTICS',
  schema: 'sales'
});
```

## Sample Input for Agent

Create `docs/examples/snowflake-monitor-input.json`:

```json
{
  "dashboardUrl": "https://app.snowflake.com/olqgxru/wn71398/#/growth-of-our-overall-ss-business-dDBP3cY9S",
  "dashboardName": "Growth of Overall SS Business",
  "database": "ANALYTICS",
  "warehouse": "webflow",
  "metricsToTrack": [
    {
      "metricName": "Total ARR",
      "sqlQuery": "SELECT SUM(arr) as total_arr FROM ANALYTICS.finance.arr_metrics WHERE date = CURRENT_DATE",
      "thresholds": {
        "critical": 100000000,
        "warning": 120000000
      }
    },
    {
      "metricName": "Monthly Active Customers",
      "sqlQuery": "SELECT COUNT(DISTINCT customer_id) as active_customers FROM ANALYTICS.product.user_activity WHERE month = DATE_TRUNC('month', CURRENT_DATE)"
    },
    {
      "metricName": "Customer Churn Rate",
      "sqlQuery": "SELECT churn_rate FROM ANALYTICS.finance.churn_metrics WHERE date = CURRENT_DATE"
    }
  ],
  "comparisonPeriod": "previous-run",
  "alertChannels": ["log", "slack"]
}
```

## Running the Agent

```bash
# One-time run
node dist/cli.js run agents/snowflake-monitor.md --input docs/examples/snowflake-monitor-input.json

# Quick test with sample data
node dist/cli.js quick agents/snowflake-monitor.md
```

## Scheduling

Add to `package.json`:

```json
{
  "scripts": {
    "snowflake:monitor": "node dist/cli.js run agents/snowflake-monitor.md --input docs/examples/snowflake-monitor-input.json",
    "snowflake:morning": "npm run snowflake:monitor",
    "snowflake:hourly": "npm run snowflake:monitor"
  }
}
```

Use cron for scheduling:

```bash
# Every hour
0 * * * * cd /path/to/agent-chief-of-staff && npm run snowflake:hourly

# Every morning at 9 AM
0 9 * * * cd /path/to/agent-chief-of-staff && npm run snowflake:morning
```

Or use a GitHub Action for cloud scheduling.

## Authentication Flow

When the agent runs:

1. The Snowflake MCP server starts and attempts to connect
2. Since `SNOWFLAKE_AUTHENTICATOR=externalbrowser`, your default browser will open
3. You'll authenticate via Okta SSO
4. The browser passes the auth token back to the MCP server
5. The connection is established and queries can be executed

**Note:** For automated/scheduled runs, you may want to investigate service accounts or token-based authentication instead of interactive browser auth.

## Troubleshooting

### "MCP server not found"
- Check `~/.config/claude-code/mcp.json` exists
- Verify `@modelcontextprotocol/server-snowflake` is accessible via npx
- Restart Claude Code to reload MCP config

### "Authentication failed"
- Verify your Okta credentials are correct
- Check that your Snowflake account identifier is correct: `n71398.us-east-1`
- Ensure your browser can access Okta login page
- Try authenticating manually first: `npx @modelcontextprotocol/server-snowflake`

### "Database/Warehouse not found"
- Use `snowflake_list_databases` to see available databases
- Check exact database and warehouse names (case-sensitive)
- Verify you have permissions to access the specified resources

### "Query timeout"
- Check your warehouse size - may need to scale up for large queries
- Optimize SQL queries for performance
- Verify warehouse is running (not suspended)

### "No previous snapshot"
- First run will create baseline (no changes detected)
- Subsequent runs will compare against baseline
- Check `/logs/snowflake-snapshots/` for saved snapshots

## Next Steps

1. ✅ Set up MCP server configuration
2. ✅ Create agent spec (`agents/snowflake-monitor.md`)
3. Configure your specific metrics to monitor
4. Run initial baseline
5. Schedule regular monitoring
6. Add to Daily Briefing display

## Example Queries for Common Metrics

### Revenue Metrics
```sql
SELECT
  SUM(amount) as total_revenue,
  AVG(amount) as avg_order_value,
  COUNT(DISTINCT order_id) as order_count
FROM ANALYTICS.sales.orders
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days';
```

### Customer Metrics
```sql
SELECT
  COUNT(DISTINCT customer_id) as total_customers,
  COUNT(DISTINCT CASE WHEN first_order_date >= CURRENT_DATE - INTERVAL '30 days' THEN customer_id END) as new_customers
FROM ANALYTICS.customers.customer_summary;
```

### Product Usage
```sql
SELECT
  COUNT(DISTINCT user_id) as monthly_active_users,
  SUM(sessions) as total_sessions,
  AVG(session_duration_minutes) as avg_session_duration
FROM ANALYTICS.product.usage_metrics
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);
```
