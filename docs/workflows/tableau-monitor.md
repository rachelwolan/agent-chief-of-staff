# Tableau MCP Server Setup

This guide walks through setting up the custom Tableau MCP server for dashboard monitoring.

## Prerequisites

1. **Tableau Cloud Access**
   - Site URL: `https://prod-useast-a.online.tableau.com`
   - Site Name: `webflowanalytics`
   - Username and Password

2. **Node.js & npm** installed

## Installation Steps

### 1. Install Dependencies

Already completed ✓

```bash
npm install axios dotenv @modelcontextprotocol/sdk
```

### 2. Store Credentials in .env

Add your Tableau username and password to `.env`:

```bash
# Tableau Configuration
TABLEAU_SITE_URL=https://prod-useast-a.online.tableau.com
TABLEAU_SITE_NAME=webflowanalytics
TABLEAU_USERNAME=rachel.wolan@webflow.com
TABLEAU_PASSWORD=your-password
```

**Note:** Your site administrator has disabled PAT creation, so we're using username/password authentication.

### 3. Build the MCP Server

Already completed ✓

```bash
npm run build
```

This compiles the custom Tableau MCP server located at:
- Source: `src/mcp-servers/tableau-server.ts`
- Compiled: `dist/mcp-servers/tableau-server.js`

### 4. Configure MCP Server

Already completed ✓

The MCP configuration file has been created at `~/.config/claude-code/mcp.json`:

```json
{
  "mcpServers": {
    "tableau": {
      "command": "node",
      "args": [
        "/Users/rachelwolan/agent-chief-of-staff/dist/mcp-servers/tableau-server.js"
      ],
      "env": {}
    }
  }
}
```

### 5. Create Snapshot Directories

Already completed ✓

```bash
mkdir -p logs/tableau-snapshots
mkdir -p logs/tableau-monitor
```

## Available MCP Tools

The custom Tableau MCP server provides these tools:

### `tableau_sign_in`
Authenticate to Tableau Cloud/Server
- No parameters required
- Uses credentials from `.env`

### `tableau_list_workbooks`
List all workbooks you have access to
- No parameters required

### `tableau_find_workbook`
Find a workbook by name
- `workbookName`: Name of the workbook

### `tableau_list_views`
List all views in a workbook
- `workbookId`: ID of the workbook

### `tableau_find_view`
Find a view by name within a workbook
- `workbookId`: ID of the workbook
- `viewName`: Name of the view

### `tableau_get_view_data`
Get data from a view (returns CSV format)
- `viewId`: ID of the view

### `tableau_get_view_image`
Download view as PNG image
- `viewId`: ID of the view

### `tableau_parse_dashboard_url`
Extract workbook and view names from a Tableau dashboard URL
- `url`: Tableau dashboard URL

## Usage in Agent

Claude will use the MCP tools like this:

```typescript
// Step 1: Sign in to Tableau
await mcp.tableau_sign_in();

// Step 2: Parse the dashboard URL
const parsed = await mcp.tableau_parse_dashboard_url({
  url: 'https://prod-useast-a.online.tableau.com/#/site/webflowanalytics/views/WIPConsolidatedDashboard/Scorecard'
});
// Returns: { workbookName: 'WIPConsolidatedDashboard', viewName: 'Scorecard' }

// Step 3: Find the workbook
const workbook = await mcp.tableau_find_workbook({
  workbookName: 'WIPConsolidatedDashboard'
});

// Step 4: Find the view
const view = await mcp.tableau_find_view({
  workbookId: workbook.id,
  viewName: 'Scorecard'
});

// Step 5: Get view data
const viewData = await mcp.tableau_get_view_data({
  viewId: view.id
});
```

## Sample Input for Agent

Create `docs/examples/tableau-monitor-input.json`:

```json
{
  "dashboardUrl": "https://tableau.yourcompany.com/#/views/SalesDashboard/Overview",
  "workbookName": "Sales Dashboard",
  "viewName": "Overview",
  "metricsToTrack": [
    {
      "metricName": "Total Revenue",
      "worksheetName": "Revenue KPIs",
      "fieldName": "SUM(Revenue)",
      "thresholds": {
        "critical": 100000,
        "warning": 150000
      }
    },
    {
      "metricName": "New Customers",
      "worksheetName": "Customer Metrics",
      "fieldName": "COUNT(Customer ID)"
    },
    {
      "metricName": "Average Order Value",
      "worksheetName": "Revenue KPIs",
      "fieldName": "AVG(Order Value)"
    }
  ],
  "comparisonPeriod": "24h",
  "alertChannels": ["log", "slack"]
}
```

## Running the Agent

```bash
# One-time run
node dist/cli.js run agents/tableau-monitor.md --input docs/examples/tableau-monitor-input.json

# Quick test with sample data
node dist/cli.js quick agents/tableau-monitor.md
```

## Scheduling

Add to `package.json`:

```json
{
  "scripts": {
    "tableau:monitor": "node dist/cli.js run agents/tableau-monitor.md --input docs/examples/tableau-monitor-input.json",
    "tableau:morning": "npm run tableau:monitor",
    "tableau:hourly": "npm run tableau:monitor"
  }
}
```

Use cron for scheduling:

```bash
# Every hour
0 * * * * cd /path/to/agent-chief-of-staff && npm run tableau:hourly

# Every morning at 9 AM
0 9 * * * cd /path/to/agent-chief-of-staff && npm run tableau:morning
```

Or use a GitHub Action for cloud scheduling.

## Troubleshooting

### "MCP server not found"
- Check `~/.config/claude-code/mcp.json` exists
- Verify `@modelcontextprotocol/server-tableau` is installed
- Restart Claude Code to reload MCP config

### "Authentication failed"
- Verify TABLEAU_TOKEN_VALUE is correct
- Check token hasn't expired (regenerate if needed)
- Confirm TABLEAU_SITE_ID matches your site

### "View not found"
- Use `tableau_list_workbooks` to see available workbooks
- Check exact workbook and view names (case-sensitive)
- Verify you have permissions to access the view

### "No previous snapshot"
- First run will create baseline (no changes detected)
- Subsequent runs will compare against baseline
- Check `/logs/tableau-snapshots/` for saved snapshots

## Next Steps

1. ✅ Set up MCP server configuration
2. ✅ Create agent spec (`agents/tableau-monitor.md`)
3. Configure your specific dashboards to monitor
4. Run initial baseline
5. Schedule regular monitoring
6. Add to Daily Briefing display
