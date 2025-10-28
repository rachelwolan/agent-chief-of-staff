# Core Business Health Dashboard

Live dashboard for monitoring key growth metrics from Snowflake `report__kpi_daily` table.

## Architecture

The dashboard uses a 3-tier architecture:

```
┌──────────────────┐
│  HTML Dashboard  │  ← Frontend (Browser)
│  Port: file://   │
└────────┬─────────┘
         │ REST API
┌────────▼─────────┐
│ Node.js Server   │  ← Backend API (Port 3001)
│ Express + CORS   │
└────────┬─────────┘
         │ MCP Protocol
┌────────▼─────────┐
│ Snowflake MCP    │  ← MCP Server (Python/uvx)
│ Server (uvx)     │
└────────┬─────────┘
         │ SQL
┌────────▼─────────┐
│   Snowflake DB   │  ← Data Source
│   ANALYTICS DB   │
└──────────────────┘
```

## Files

- `core-business-health-dashboard.html` - Frontend dashboard with live data
- `dashboard-server.js` - Node.js backend that connects to Snowflake MCP
- `README.md` - This file

## Setup & Usage

### 1. Start the Backend Server

```bash
# From the project root
node dashboards/dashboard-server.js
```

The server will:
- Start on `http://localhost:3001`
- Connect to Snowflake MCP using `uvx snowflake-labs-mcp`
- Open a browser window for Snowflake OAuth authentication
- Expose REST API endpoints for dashboard queries

### 2. Open the Dashboard

```bash
open dashboards/core-business-health-dashboard.html
```

The dashboard will automatically:
- Connect to the backend server on localhost:3001
- Fetch yesterday's metrics on page load
- Display live data from Snowflake
- Update week-over-week comparisons

### 3. Troubleshooting

**Issue: "Connection closed" error**
- Make sure you've authenticated with Snowflake in the browser window
- Verify your Snowflake credentials in `~/.config/claude-code/mcp.json`
- Check that the MCP server is running (you'll see authentication popup)

**Issue: "Cannot connect to backend server"**
- Verify `dashboard-server.js` is running on port 3001
- Check for port conflicts: `lsof -i :3001`
- Review server logs for connection errors

**Issue: No data displaying**
- Open browser console (F12) to see API errors
- Verify the date selector is set correctly
- Check that you have access to `ANALYTICS.WEBFLOW.REPORT__KPI_DAILY`

## API Endpoints

The backend server exposes these endpoints:

### GET /api/health
Health check and Snowflake connection status

### GET /api/metrics/yesterday
Returns yesterday's key metrics

### GET /api/metrics/wow
Week-over-week comparison for key metrics

### GET /api/metrics/trend30
30-day trend data for charts

### POST /api/metrics/date
Query metrics for a specific date

## Metrics Displayed

- **Total Signups** - Daily signups with paid/organic attribution
- **First Sites Created** - Users who created their first site
- **First-Time Conversions** - New paying customers (7-day, 30-day cohorts)
- **FTC MRR** - Monthly recurring revenue from new conversions
- **Conversion Funnel** - Signups → Onboarding → First Site → FTC

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express, CORS
- **MCP Client**: @modelcontextprotocol/sdk
- **MCP Server**: snowflake-labs-mcp (Python/uvx)
- **Database**: Snowflake (ANALYTICS.WEBFLOW)
