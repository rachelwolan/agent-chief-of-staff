# Rule: Monitor Snowflake

## Goal

To guide an AI assistant in setting up and executing Snowflake dashboard monitoring using the Snowflake MCP server. This enables automated tracking of key business metrics from Snowflake databases, detecting changes, and alerting on important trends in revenue, customer activity, and product usage.

## Process

1. **Verify Prerequisites**:
   - Confirm Snowflake account access with Okta SSO
   - Verify Node.js and npm are installed
   - Confirm you have access to required database, warehouse, and schemas
2. **Install Snowflake MCP Server**:
   - The official server is available via npx: `@modelcontextprotocol/server-snowflake`
   - No local installation required - runs via npx
3. **Configure Environment Variables**:
   - Add Snowflake credentials to `.env` file
   - Set account identifier, username, database, warehouse
   - Configure `externalbrowser` authentication for Okta SSO
4. **Set Up MCP Configuration**:
   - Create or update `~/.config/claude-code/mcp.json`
   - Add Snowflake server configuration with environment variables
   - Restart Claude Code to reload MCP config
5. **Create Storage Directories**:
   - Create `logs/snowflake-snapshots` for baseline storage
   - Create `logs/snowflake-monitor` for monitoring logs
6. **Define Metrics to Monitor**:
   - Create input JSON file with dashboard details
   - Specify SQL queries for each metric to track
   - Set thresholds for critical/warning alerts
   - Define comparison period (previous run, previous day, etc.)
7. **Create Snowflake Monitor Agent**:
   - Define agent spec in `agents/snowflake-monitor.md`
   - Configure Zod schemas for input/output
   - Write prompts to analyze metrics and detect changes
8. **Test MCP Tools**:
   - Use `snowflake-query` to execute test SQL
   - Use `snowflake-list-databases` to verify access
   - Use `snowflake-describe-table` to inspect schema
9. **Run Initial Baseline**:
   - Execute agent with test input to create baseline snapshot
   - Verify snapshot is saved to `logs/snowflake-snapshots/`
10. **Schedule Regular Monitoring**:
    - Add npm scripts for manual runs
    - Set up cron jobs for hourly/daily monitoring
    - Configure alert channels (log, Slack, email)
11. **Integrate with Daily Briefing**:
    - Add Snowflake metrics to morning briefing
    - Display change deltas and alerts
    - Link to dashboard URLs

## Prerequisites

### Snowflake Access
- **Account**: `n71398.us-east-1` (update with your account)
- **Username**: Your Okta/email address
- **Database**: `ANALYTICS` (or your target database)
- **Warehouse**: `webflow` (or your warehouse name)
- **Authentication**: External browser (Okta SSO)
- **Permissions**: Access to query target schemas and tables

### System Requirements
- Node.js and npm installed
- Claude Code with MCP support
- Browser access for Okta authentication

### Environment Variables

Add to `.env`:
```bash
# Snowflake Configuration for Okta SSO
SNOWFLAKE_USER=rachel.wolan@webflow.com     # Your Okta/email username
SNOWFLAKE_ACCOUNT=n71398.us-east-1          # Your Snowflake account identifier
SNOWFLAKE_DATABASE=ANALYTICS                # Your Snowflake database
SNOWFLAKE_WAREHOUSE=webflow                 # Your Snowflake warehouse
SNOWFLAKE_AUTHENTICATOR=externalbrowser     # Use external browser for Okta SSO
```

### MCP Configuration

Create/update `~/.config/claude-code/mcp.json`:
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

## Available MCP Tools

### `snowflake-query`
Execute SQL queries against Snowflake
- **Input**: `query` (SQL query string)
- **Output**: Structured query results

### `snowflake-list-databases`
List all databases you have access to
- **Input**: None
- **Output**: Array of database names

### `snowflake-list-schemas`
List schemas in a database
- **Input**: `database` (database name)
- **Output**: Array of schema names

### `snowflake-list-tables`
List tables in a schema
- **Input**: `database`, `schema`
- **Output**: Array of table names

### `snowflake-describe-table`
Get table schema/structure
- **Input**: `database`, `schema`, `table`
- **Output**: Table structure with column definitions

## Metrics Input Format

Create an input JSON file (e.g., `docs/examples/snowflake-monitor-input.json`):

```json
{
  "dashboardUrl": "https://app.snowflake.com/your-account/#/dashboard-id",
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

## Usage in Agent

The AI assistant will use MCP tools like this:

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

// Describe table structure
const schema = await mcp.snowflake_describe_table({
  database: 'ANALYTICS',
  schema: 'sales',
  table: 'orders'
});
```

## Running the Monitor

### One-Time Run
```bash
node dist/cli.js run agents/snowflake-monitor.md --input docs/examples/snowflake-monitor-input.json
```

### Quick Test
```bash
node dist/cli.js quick agents/snowflake-monitor.md
```

### Scheduled Runs

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

## Authentication Flow

When the agent runs:

1. The Snowflake MCP server starts and attempts to connect
2. Since `SNOWFLAKE_AUTHENTICATOR=externalbrowser`, your default browser will open
3. You'll authenticate via Okta SSO
4. The browser passes the auth token back to the MCP server
5. The connection is established and queries can be executed

**Note**: For automated/scheduled runs, you may want to investigate service accounts or token-based authentication instead of interactive browser auth.

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
  COUNT(DISTINCT CASE WHEN first_order_date >= CURRENT_DATE - INTERVAL '30 days'
    THEN customer_id END) as new_customers
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

## Troubleshooting

### "MCP server not found"
- Check `~/.config/claude-code/mcp.json` exists
- Verify `@modelcontextprotocol/server-snowflake` is accessible via npx
- Restart Claude Code to reload MCP config

### "Authentication failed"
- Verify your Okta credentials are correct
- Check that your Snowflake account identifier is correct
- Ensure your browser can access Okta login page
- Try authenticating manually first: `npx @modelcontextprotocol/server-snowflake`

### "Database/Warehouse not found"
- Use `snowflake-list-databases` to see available databases
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

## Output

The Snowflake monitor produces:

1. **Snapshot Files**: Baseline metrics saved to `logs/snowflake-snapshots/`
2. **Monitor Logs**: Execution logs saved to `logs/snowflake-monitor/`
3. **Change Detection**: Comparison against previous run with deltas
4. **Alerts**: Critical/warning threshold violations
5. **Summary Report**: Key metrics and trends
6. **Dashboard Links**: Direct links to Snowflake dashboards

### Example Output Format
```json
{
  "dashboardName": "Growth of Overall SS Business",
  "runTimestamp": "2024-10-15T09:00:00Z",
  "metrics": [
    {
      "metricName": "Total ARR",
      "currentValue": 125000000,
      "previousValue": 120000000,
      "change": 5000000,
      "changePercent": 4.17,
      "status": "warning",
      "threshold": "warning"
    }
  ],
  "alerts": [
    {
      "severity": "warning",
      "metric": "Total ARR",
      "message": "ARR increased by 4.17% ($5M) - approaching target threshold"
    }
  ],
  "summary": "3 metrics tracked, 1 warning, 0 critical alerts"
}
```

## Target Audience

This workflow is designed to be executed by an AI assistant (like Claude Code) to automate Snowflake dashboard monitoring for business intelligence and metrics tracking.

## Next Steps

1. ✅ Set up MCP server configuration
2. ✅ Create agent spec (`agents/snowflake-monitor.md`)
3. Configure your specific metrics to monitor
4. Run initial baseline
5. Schedule regular monitoring
6. Add to Daily Briefing display

## Notes

- First run creates a baseline - no changes will be detected
- Subsequent runs compare against the most recent snapshot
- `externalbrowser` authentication requires manual Okta login
- For fully automated runs, consider service account authentication
- Snapshots are stored as JSON files with timestamps
- Each metric can have custom SQL queries and thresholds
- Alert channels can be extended to Slack, email, or other integrations

---

*For automated scheduling in production, replace external browser auth with service account credentials*
