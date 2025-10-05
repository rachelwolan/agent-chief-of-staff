# Tableau Dashboard Monitor

## Job-To-Be-Done
When I need to stay informed about changes in our key Tableau dashboards, I want an automated agent to detect and report meaningful changes and discrepancies, so that I can quickly identify issues, trends, or anomalies without manually checking dashboards.

## Success Criteria
- Captures current state of dashboard metrics and visualizations
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

const MetricToTrack = z.object({
  metricName: z.string(),
  worksheetName: z.string(),
  fieldName: z.string(),
  thresholds: MetricThreshold.optional()
});

export const inputSchema = z.object({
  dashboardUrl: z.string().url().describe('URL of the Tableau dashboard to monitor'),
  workbookName: z.string().describe('Name of the Tableau workbook'),
  viewName: z.string().describe('Name of the view/dashboard within the workbook'),
  metricsToTrack: z.array(MetricToTrack).describe('List of metrics to monitor'),
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

You are a Tableau Dashboard Monitoring Agent. Your job is to analyze a Tableau dashboard, detect changes from previous snapshots, and generate an actionable report.

**Dashboard Details:**
- Workbook: {{workbookName}}
- View: {{viewName}}
- URL: {{dashboardUrl}}

**Metrics to Monitor:**
{{#each metricsToTrack}}
- {{metricName}} (Worksheet: {{worksheetName}}, Field: {{fieldName}})
  {{#if thresholds}}
  - Critical threshold: {{thresholds.critical}}
  - Warning threshold: {{thresholds.warning}}
  {{/if}}
{{/each}}

**Comparison Period:** {{comparisonPeriod}}

## Instructions:

### Step 1: Connect to Tableau
Use the Tableau MCP server tools:

1. **Sign in:** Call `tableau_sign_in()` to authenticate
2. **Parse URL:** Call `tableau_parse_dashboard_url({ url: "{{dashboardUrl}}" })` to extract workbook and view names
3. **Find workbook:** Call `tableau_find_workbook({ workbookName: "{{workbookName}}" })` to get the workbook ID
4. **Find view:** Call `tableau_find_view({ workbookId: workbook.id, viewName: "{{viewName}}" })` to get the view ID

### Step 2: Extract Current Metrics
Call `tableau_get_view_data({ viewId: view.id })` to get the CSV data from the view.

Parse the CSV data to extract metrics specified in metricsToTrack:
1. For each metric, find the row matching the `fieldName`
2. Extract the current value
3. Record the timestamp of extraction
4. Store all metrics in a snapshot object

### Step 3: Load Previous Snapshot
1. Look for the most recent snapshot in `/logs/tableau-snapshots/{{workbookName}}-{{viewName}}.json`
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
# Tableau Dashboard Change Report
**Dashboard:** {{viewName}} ({{workbookName}})
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
- Last Refresh: [Time] ([Expected refresh frequency check])
- Status: [Current/Stale]

## Summary
[2-3 sentence executive summary of key findings]

## Recommendations
1. [Actionable recommendation based on critical changes]
2. [Actionable recommendation based on trends]
```

### Step 6: Save Outputs
1. Save current snapshot to `/logs/tableau-snapshots/{{workbookName}}-{{viewName}}.json`
   - Include: timestamp, metrics with values, data freshness
2. Save markdown report to `/logs/tableau-monitor/YYYY-MM-DD-HH-mm.md`
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

## Sample Output Format:

```json
{
  "timestamp": "2025-10-05T14:30:00Z",
  "dashboardName": "Sales Performance Dashboard",
  "criticalChanges": [
    {
      "metricName": "Total Revenue",
      "previousValue": 125000,
      "currentValue": 68000,
      "percentChange": -45.6,
      "severity": "critical",
      "context": "Largest single-day drop in 30 days - potential data pipeline issue"
    }
  ],
  "notableChanges": [
    {
      "metricName": "New Customers",
      "previousValue": 450,
      "currentValue": 520,
      "percentChange": 15.6,
      "severity": "warning",
      "context": "3rd consecutive day of growth - positive trend"
    }
  ],
  "stableMetrics": [
    {
      "name": "Customer Satisfaction",
      "value": 4.2,
      "status": "stable (+0.5%)"
    }
  ],
  "dataFreshness": {
    "lastRefresh": "2025-10-05T12:00:00Z",
    "isStale": false
  },
  "summary": "Critical revenue drop detected (-45.6%), requiring immediate investigation. Customer acquisition continues positive trend. All other metrics stable.",
  "recommendations": [
    "Investigate revenue data pipeline - verify data source connections",
    "Monitor customer acquisition trend - approaching historical peak",
    "Review weekend revenue patterns for seasonality"
  ]
}
```
