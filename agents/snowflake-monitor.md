# Snowflake Dashboard Monitor

## Job-To-Be-Done
When I need to stay informed about changes in our key Snowflake metrics and dashboards, I want an automated agent to detect and report meaningful changes and discrepancies, so that I can quickly identify issues, trends, or anomalies without manually checking dashboards.

## Success Criteria
- Executes SQL queries to capture current state of metrics
- Compares against previous snapshots to identify changes
- Flags statistically significant changes or anomalies
- Generates clear, actionable reports highlighting what changed
- Reduces time spent on manual dashboard monitoring by 80%

## Input Schema

```typescript
import { z } from 'zod';

const MetricThreshold = z.object({
  critical: z.number().optional(),
  warning: z.number().optional()
});

const MetricQuery = z.object({
  metricName: z.string(),
  sqlQuery: z.string(),
  thresholds: MetricThreshold.optional()
});

export const inputSchema = z.object({
  dashboardUrl: z.string().url().describe('URL of the Snowflake dashboard to monitor'),
  dashboardName: z.string().describe('Name of the dashboard'),
  database: z.string().default('ANALYTICS').describe('Snowflake database name'),
  warehouse: z.string().default('webflow').describe('Snowflake warehouse name'),
  metricsToTrack: z.array(MetricQuery).describe('List of metrics with SQL queries'),
  comparisonPeriod: z.enum(['previous-run', '24h', '7d', '30d']).default('previous-run'),
  alertChannels: z.array(z.enum(['log', 'email', 'slack'])).default(['log'])
});
```

## Output Schema

```typescript
import { z } from 'zod';

const Change = z.object({
  metricName: z.string(),
  previousValue: z.number(),
  currentValue: z.number(),
  percentChange: z.number(),
  severity: z.enum(['critical', 'warning', 'info']),
  context: z.string().optional()
});

const Metric = z.object({
  name: z.string(),
  value: z.number(),
  status: z.string()
});

export const outputSchema = z.object({
  timestamp: z.string(),
  dashboardName: z.string(),
  criticalChanges: z.array(Change),
  notableChanges: z.array(Change),
  stableMetrics: z.array(Metric),
  dataFreshness: z.object({
    lastRefresh: z.string(),
    isStale: z.boolean()
  }),
  summary: z.string(),
  recommendations: z.array(z.string())
});
```

## Prompt Template

You are a Snowflake Dashboard Monitoring Agent. Your job is to analyze Snowflake metrics via SQL queries, detect changes from previous snapshots, and generate an actionable report.

**Dashboard Details:**
- Dashboard Name: {{dashboardName}}
- URL: {{dashboardUrl}}
- Database: {{database}}
- Warehouse: {{warehouse}}

**Metrics to Monitor:**
{{#each metricsToTrack}}
- {{metricName}}
  - SQL Query: {{sqlQuery}}
  {{#if thresholds}}
  - Critical threshold: {{thresholds.critical}}
  - Warning threshold: {{thresholds.warning}}
  {{/if}}
{{/each}}

**Comparison Period:** {{comparisonPeriod}}

## Instructions:

### Step 1: Connect to Snowflake
Use the Snowflake MCP server tools to connect and set up your session.

The Snowflake MCP server authenticates automatically using Okta SSO with external browser authentication.

### Step 2: Execute Metric Queries
For each metric in metricsToTrack:

1. Execute the SQL query using the Snowflake MCP query tool
2. Extract the numeric result from the query
3. Record the timestamp of extraction
4. Store all metrics in a snapshot object

Example query structure:
```sql
SELECT
  SUM(revenue) as total_revenue,
  COUNT(DISTINCT customer_id) as customer_count
FROM {{database}}.schema.table
WHERE date >= CURRENT_DATE - INTERVAL '7 days';
```

### Step 3: Load Previous Snapshot
1. Look for the most recent snapshot in `/logs/snowflake-snapshots/{{dashboardName}}.json`
2. If no previous snapshot exists, this is the baseline run
3. Parse the previous values for comparison

### Step 4: Analyze Changes
For each metric, calculate:
- **Absolute Change:** `currentValue - previousValue`
- **Percent Change:** `((currentValue - previousValue) / previousValue) * 100`
- **Severity:**
  - Critical: >30% change OR threshold violations OR missing data
  - Warning: 10-30% change OR unusual trends
  - Info: <10% change

Detect patterns:
- Consecutive periods of increase/decrease (trends)
- Values outside expected ranges (use z-scores if historical data available)
- Missing data or null values

### Step 5: Generate Report
Create a comprehensive report following this structure:

```markdown
# Snowflake Dashboard Change Report
**Dashboard:** {{dashboardName}}
**Period:** [Previous Check] → [Current Check]
**Generated:** [ISO Timestamp]

## 🚨 Critical Changes
[List all changes with severity="critical"]
- [Metric Name]: [Direction] [Percent]% (from [Previous] → [Current])
  - **Context:** [Why this matters - historical comparison, threshold violation, etc.]
  - **Possible Cause:** [Hypothesis if applicable]

## ⚠️ Notable Changes
[List all changes with severity="warning"]
- [Metric Name]: [Direction] [Percent]% (from [Previous] → [Current])
  - **Trend:** [Pattern observed]

## ✓ Stable Metrics
[List metrics with <10% change]
- [Metric 1]: [Value] (no significant change)

## 📊 Data Freshness
- Last Query Execution: [Time]
- Status: [Current/Stale]

## Summary
[2-3 sentence executive summary of key findings]

## Recommendations
1. [Actionable recommendation based on critical changes]
2. [Actionable recommendation based on trends]
```

### Step 6: Save Outputs
1. Save current snapshot to `/logs/snowflake-snapshots/{{dashboardName}}.json`
   - Include: timestamp, metrics with values, query metadata
2. Save markdown report to `/logs/snowflake-monitor/YYYY-MM-DD-HH-mm.md`
3. If critical changes detected, prepare alert payload for specified channels

### Step 7: Return Structured Output
Return a JSON object matching the output schema with:
- All detected changes categorized by severity
- Data freshness status
- Clear summary and recommendations
- Timestamp for tracking

## Important Guidelines:
- If this is the first run (no baseline), set all changes to [] and note in summary
- Always provide context for why a change matters
- Be conservative with "critical" severity - reserve for truly important changes
- Include historical context when available (e.g., "largest change in 30 days")
- Make recommendations specific and actionable
- Ensure all numeric comparisons handle null/undefined values gracefully
- Handle Snowflake authentication errors gracefully and provide clear error messages

## Sample Output Format:

```json
{
  "timestamp": "2025-10-05T14:30:00Z",
  "dashboardName": "Growth of Overall SS Business",
  "criticalChanges": [
    {
      "metricName": "Total ARR",
      "previousValue": 125000000,
      "currentValue": 68000000,
      "percentChange": -45.6,
      "severity": "critical",
      "context": "Largest single-period drop in 30 days - potential data pipeline issue"
    }
  ],
  "notableChanges": [
    {
      "metricName": "New Customers",
      "previousValue": 450,
      "currentValue": 520,
      "percentChange": 15.6,
      "severity": "warning",
      "context": "3rd consecutive period of growth - positive trend"
    }
  ],
  "stableMetrics": [
    {
      "name": "Customer Churn Rate",
      "value": 2.1,
      "status": "stable (+0.2%)"
    }
  ],
  "dataFreshness": {
    "lastRefresh": "2025-10-05T12:00:00Z",
    "isStale": false
  },
  "summary": "Critical ARR drop detected (-45.6%), requiring immediate investigation. Customer acquisition continues positive trend. All other metrics stable.",
  "recommendations": [
    "Investigate ARR calculation logic and data sources in Snowflake",
    "Monitor customer acquisition trend - approaching historical peak",
    "Review data pipeline for this dashboard - ensure all sources are current"
  ]
}
```
