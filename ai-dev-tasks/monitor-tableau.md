# Rule: Monitor Tableau

## Goal

To guide an AI assistant in setting up and executing Tableau dashboard monitoring using a custom Tableau MCP server. This enables automated tracking of key business metrics from Tableau Cloud dashboards, detecting changes over time, and alerting on important trends.

## Process

1. **Verify Prerequisites**:
   - Confirm Tableau Cloud access with username and password
   - Verify Node.js and npm are installed
   - Note: PAT creation is disabled, using username/password authentication
2. **Install Dependencies**:
   - Ensure `axios`, `dotenv`, and `@modelcontextprotocol/sdk` are installed
   - These should already be in the project dependencies
3. **Configure Environment Variables**:
   - Add Tableau credentials to `.env` file
   - Set site URL, site name, username, and password
4. **Build the Custom MCP Server**:
   - The custom server is located at `packages/core/src/mcp-servers/tableau-server.ts`
   - Run `npm run build` to compile to `dist/mcp-servers/tableau-server.js`
5. **Set Up MCP Configuration**:
   - Create or update `~/.config/claude-code/mcp.json`
   - Add Tableau server configuration pointing to the compiled server
   - Restart Claude Code to reload MCP config
6. **Create Storage Directories**:
   - Create `logs/tableau-snapshots` for baseline storage
   - Create `logs/tableau-monitor` for monitoring logs
7. **Define Dashboards to Monitor**:
   - Create input JSON file with dashboard URL and details
   - Specify metrics to track from specific worksheets
   - Set thresholds for critical/warning alerts
   - Define comparison period (24h, previous run, etc.)
8. **Create Tableau Monitor Agent**:
   - Define agent spec in `agents/tableau-monitor.md`
   - Configure Zod schemas for input/output
   - Write prompts to analyze metrics and detect changes
9. **Test MCP Tools**:
   - Use `tableau_sign_in` to authenticate
   - Use `tableau_parse_dashboard_url` to extract workbook/view names
   - Use `tableau_find_workbook` and `tableau_find_view` to locate dashboard
   - Use `tableau_get_view_data` to retrieve metrics
10. **Run Initial Baseline**:
    - Execute agent with test input to create baseline snapshot
    - Verify snapshot is saved to `logs/tableau-snapshots/`
11. **Schedule Regular Monitoring**:
    - Add npm scripts for manual runs
    - Set up cron jobs for hourly/daily monitoring
    - Configure alert channels (log, Slack, email)
12. **Integrate with Daily Briefing**:
    - Add Tableau metrics to morning briefing
    - Display change deltas and alerts
    - Include dashboard screenshots and links

## Prerequisites

### Tableau Cloud Access
- **Site URL**: `https://prod-useast-a.online.tableau.com`
- **Site Name**: `webflowanalytics`
- **Username**: Your Tableau username (Webflow email)
- **Password**: Your Tableau password
- **Note**: PAT creation is disabled, using username/password authentication
- **Permissions**: Access to view target dashboards and workbooks

### System Requirements
- Node.js and npm installed
- Claude Code with MCP support
- Project dependencies: `axios`, `dotenv`, `@modelcontextprotocol/sdk`

### Environment Variables

Add to `.env`:
```bash
# Tableau Configuration
TABLEAU_SITE_URL=https://prod-useast-a.online.tableau.com
TABLEAU_SITE_NAME=webflowanalytics
TABLEAU_USERNAME=rachel.wolan@webflow.com
TABLEAU_PASSWORD=your-password
```

**Note**: Your site administrator has disabled PAT creation, so we're using username/password authentication.

### Build the Custom MCP Server

The custom Tableau MCP server is located at:
- **Source**: `packages/core/src/mcp-servers/tableau-server.ts`
- **Compiled**: `dist/mcp-servers/tableau-server.js`

Build it:
```bash
npm run build
```

### MCP Configuration

Create/update `~/.config/claude-code/mcp.json`:
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

**Note**: Update the path to match your project location.

## Available MCP Tools

### `tableau_sign_in`
Authenticate to Tableau Cloud/Server
- **Input**: None (uses credentials from `.env`)
- **Output**: Authentication token for subsequent requests

### `tableau_list_workbooks`
List all workbooks you have access to
- **Input**: None
- **Output**: Array of workbooks with IDs and names

### `tableau_find_workbook`
Find a workbook by name
- **Input**: `workbookName` (name of the workbook)
- **Output**: Workbook object with ID

### `tableau_list_views`
List all views in a workbook
- **Input**: `workbookId` (ID of the workbook)
- **Output**: Array of views with IDs and names

### `tableau_find_view`
Find a view by name within a workbook
- **Input**: `workbookId`, `viewName`
- **Output**: View object with ID

### `tableau_get_view_data`
Get data from a view (returns CSV format)
- **Input**: `viewId` (ID of the view)
- **Output**: CSV data from the view

### `tableau_get_view_image`
Download view as PNG image
- **Input**: `viewId` (ID of the view)
- **Output**: PNG image file

### `tableau_parse_dashboard_url`
Extract workbook and view names from a Tableau dashboard URL
- **Input**: `url` (Tableau dashboard URL)
- **Output**: `{ workbookName, viewName }`

## Metrics Input Format

Create an input JSON file (e.g., `docs/examples/tableau-monitor-input.json`):

```json
{
  "dashboardUrl": "https://prod-useast-a.online.tableau.com/#/site/webflowanalytics/views/WIPConsolidatedDashboard/Scorecard",
  "workbookName": "WIP Consolidated Dashboard",
  "viewName": "Scorecard",
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

## Usage in Agent

The AI assistant will use MCP tools in this sequence:

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

// Step 5: Get view data (CSV format)
const viewData = await mcp.tableau_get_view_data({
  viewId: view.id
});

// Optional: Get view as image
const viewImage = await mcp.tableau_get_view_image({
  viewId: view.id
});
```

## Running the Monitor

### One-Time Run
```bash
node dist/cli.js run agents/tableau-monitor.md --input docs/examples/tableau-monitor-input.json
```

### Quick Test
```bash
node dist/cli.js quick agents/tableau-monitor.md
```

### Scheduled Runs

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

## Workflow Example

1. **Parse Dashboard URL**: Extract workbook and view names
2. **Authenticate**: Sign in to Tableau Cloud
3. **Locate Dashboard**: Find workbook, then find view within workbook
4. **Retrieve Data**: Get view data in CSV format
5. **Parse Metrics**: Extract specific metrics from CSV data
6. **Compare with Baseline**: Load previous snapshot and calculate deltas
7. **Check Thresholds**: Evaluate against critical/warning thresholds
8. **Generate Alerts**: Create alerts for significant changes
9. **Save Snapshot**: Store current metrics for next comparison
10. **Report Results**: Output summary with changes and alerts

## Troubleshooting

### "MCP server not found"
- Check `~/.config/claude-code/mcp.json` exists
- Verify path to `dist/mcp-servers/tableau-server.js` is correct
- Run `npm run build` to ensure server is compiled
- Restart Claude Code to reload MCP config

### "Authentication failed"
- Verify `TABLEAU_USERNAME` and `TABLEAU_PASSWORD` in `.env` are correct
- Check that `TABLEAU_SITE_URL` and `TABLEAU_SITE_NAME` match your Tableau site
- Ensure your account has access to Tableau Cloud
- Try logging in manually to verify credentials

### "Workbook not found" / "View not found"
- Use `tableau_list_workbooks` to see available workbooks
- Check exact workbook and view names (case-sensitive)
- Use `tableau_parse_dashboard_url` to extract correct names from URL
- Verify you have permissions to access the workbook/view

### "No previous snapshot"
- First run will create baseline (no changes detected)
- Subsequent runs will compare against baseline
- Check `/logs/tableau-snapshots/` for saved snapshots

### "Failed to parse CSV data"
- Verify the view returns data in CSV format
- Check that metric field names match the CSV column headers
- Inspect raw CSV data to understand structure

## Output

The Tableau monitor produces:

1. **Snapshot Files**: Baseline metrics saved to `logs/tableau-snapshots/`
2. **Monitor Logs**: Execution logs saved to `logs/tableau-monitor/`
3. **Change Detection**: Comparison against previous run with deltas
4. **Alerts**: Critical/warning threshold violations
5. **Summary Report**: Key metrics and trends
6. **Dashboard Links**: Direct links to Tableau dashboards
7. **Screenshots**: PNG images of dashboard views (optional)

### Example Output Format
```json
{
  "dashboardName": "WIP Consolidated Dashboard",
  "viewName": "Scorecard",
  "runTimestamp": "2024-10-15T09:00:00Z",
  "metrics": [
    {
      "metricName": "Total Revenue",
      "currentValue": 175000,
      "previousValue": 160000,
      "change": 15000,
      "changePercent": 9.38,
      "status": "normal",
      "threshold": null
    },
    {
      "metricName": "New Customers",
      "currentValue": 450,
      "previousValue": 420,
      "change": 30,
      "changePercent": 7.14,
      "status": "normal",
      "threshold": null
    }
  ],
  "alerts": [],
  "summary": "2 metrics tracked, 0 warnings, 0 critical alerts",
  "dashboardUrl": "https://prod-useast-a.online.tableau.com/#/site/webflowanalytics/views/WIPConsolidatedDashboard/Scorecard"
}
```

## Target Audience

This workflow is designed to be executed by an AI assistant (like Claude Code) to automate Tableau dashboard monitoring for business intelligence and metrics tracking.

## Next Steps

1. ✅ Set up MCP server configuration
2. ✅ Build and verify custom Tableau MCP server
3. ✅ Create agent spec (`agents/tableau-monitor.md`)
4. Configure your specific dashboards to monitor
5. Run initial baseline
6. Schedule regular monitoring
7. Add to Daily Briefing display

## Notes

- Uses custom MCP server (not an official Tableau MCP package)
- First run creates a baseline - no changes will be detected
- Subsequent runs compare against the most recent snapshot
- Username/password authentication required (PAT disabled)
- Snapshots are stored as JSON files with timestamps
- Each metric extracted from CSV data returned by views
- Alert channels can be extended to Slack, email, or other integrations
- Can optionally capture dashboard screenshots as PNG images

---

*For production use, ensure credentials are securely stored and consider rotating passwords regularly*
