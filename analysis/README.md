# Analysis Scripts

This directory contains all ad-hoc analysis scripts for querying Snowflake data.

## Directory Structure

```
analysis/
├── organic-cohorts/    # Organic signup analysis (activation, conversion, trends)
├── expansion/          # Expansion revenue analysis (MRR, SKUs, cohort expansion)
├── visitors/           # Visitor and traffic analysis
└── exploration/        # Schema exploration and data validation scripts
```

## Guidelines for New Analysis Scripts

### 🎯 **Where to Put New Scripts**

**Organic Cohorts** (`organic-cohorts/`)
- Organic signup trends and performance
- Activation rate analysis
- Conversion funnel analysis
- Geographic or segment-based organic analysis
- Examples: `query-organic-by-geo.js`, `query-organic-activation-retention.js`

**Expansion** (`expansion/`)
- Expansion revenue analysis
- SKU/product expansion analysis
- Workspace vs user plan analysis
- NDR and retention analysis
- Examples: `analyze-expansion-monthly-yoy.js`, `query-expansion-by-sku.js`

**Visitors** (`visitors/`)
- Website visitor trends
- Visitor-to-signup conversion
- Traffic source analysis
- Examples: `analyze-visitors-by-fy.js`

**Exploration** (`exploration/`)
- Schema discovery scripts
- Data validation checks
- One-time exploratory queries
- Examples: `explore-schema.js`, `check-attribution-values.js`

### 📝 **Naming Conventions**

Use descriptive prefixes:
- `analyze-*.js` - Complex analysis with insights/summaries
- `query-*.js` - Direct data queries
- `compare-*.js` - Comparative analysis (YoY, segment vs segment)
- `explore-*.js` - Schema/table exploration
- `check-*.js` - Data validation checks

Examples:
- ✅ `analyze-expansion-by-segment-yoy.js`
- ✅ `query-organic-signups-by-month.js`
- ✅ `compare-fy25-vs-fy24-visitors.js`
- ❌ `temp.js`
- ❌ `test123.js`

### 🔧 **Script Template**

```javascript
// Brief description of what this analysis does
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

  const query = \`
    -- Your SQL query here
    SELECT ...
  \`;

  conn.execute({
    sqlText: query,
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('Failed:', err.message);
        connection.destroy((err) => {});
        process.exit(1);
      }

      if (rows && rows.length > 0) {
        // Your output logic here
        console.log('Results:', rows);
      } else {
        console.log('No data found');
      }

      connection.destroy((err) => {
        if (err) console.error('Error destroying connection:', err);
      });
    },
  });
});
```

### ⚡ **Running Analysis Scripts**

From the project root:
```bash
# With Snowflake environment variables
SNOWFLAKE_ACCOUNT="wn71398.us-east-1" \
SNOWFLAKE_USER="rachel.wolan@webflow.com" \
SNOWFLAKE_DATABASE="ANALYTICS" \
SNOWFLAKE_SCHEMA="WEBFLOW" \
SNOWFLAKE_WAREHOUSE="SNOWFLAKE_REPORTING_WH_4" \
SNOWFLAKE_AUTHENTICATOR="externalbrowser" \
node analysis/expansion/analyze-expansion-monthly-yoy.js

# Or use npm script (if configured)
npm run snowflake:analyze analysis/expansion/analyze-expansion-monthly-yoy.js
```

### 🧹 **Cleanup Guidelines**

**Keep:**
- Scripts that provide ongoing value (monthly reports, recurring analyses)
- Scripts that answer key business questions
- Well-documented comparative analyses (YoY, cohort analysis)

**Archive or Delete:**
- One-time exploratory queries (`explore-*.js`, `check-*.js`)
- Failed/broken scripts
- Duplicate analyses
- Scripts replaced by better versions

**Archive location:** Move to `analysis/archive/` with date prefix:
```bash
mv analysis/exploration/old-query.js analysis/archive/2025-10-old-query.js
```

### 📊 **Common Queries**

**Key tables:**
- `dim_user_attributions` - User signup attribution data
- `report__customer_trailing_retention` - Retention and expansion metrics
- `fct_subscription_line_item_mrr` - Subscription and MRR data
- `report__kpi_daily` - Daily KPI metrics
- `report__users_workspaces_customers` - User-customer mapping

**Fiscal Year Calculations:**
- FY starts February 1
- FY26 = Feb 1, 2025 - Jan 31, 2026
- Use: `CASE WHEN date >= '2025-02-01' AND date < '2026-02-01' THEN 'FY26' END`

### 💡 **Best Practices**

1. **Always filter dates** - Don't query entire tables
2. **Use LIMIT in exploration** - Start with small result sets
3. **Document assumptions** - Add comments about date ranges, filters
4. **Format output** - Use console tables, thousands separators
5. **Handle errors gracefully** - Always destroy connection in callbacks
6. **Clean up after yourself** - Delete or archive one-time scripts

---

**Questions?** Check existing scripts in each directory for examples.
