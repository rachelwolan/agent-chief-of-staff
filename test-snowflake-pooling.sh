#!/bin/bash

# Test Snowflake connection pooling
# You should only see ONE authentication prompt for all 3 queries

echo "🧪 Testing Snowflake Connection Pooling"
echo "========================================"
echo "You should only need to authenticate ONCE for all queries below..."
echo ""

# Query 1
echo "Query 1: Count sites with code components"
SNOWFLAKE_ACCOUNT="wn71398.us-east-1" \
SNOWFLAKE_USER="rachel.wolan@webflow.com" \
SNOWFLAKE_DATABASE="ANALYTICS" \
SNOWFLAKE_SCHEMA="WEBFLOW" \
SNOWFLAKE_WAREHOUSE="SNOWFLAKE_REPORTING_WH_4" \
SNOWFLAKE_AUTHENTICATOR="externalbrowser" \
node dist/cli-snowflake.js query "SELECT COUNT(DISTINCT site_id) as sites FROM analytics.webflow.symbol_dom_nodes WHERE is_code_symbol = true"

echo ""
echo "Query 2: Count unique code components"
SNOWFLAKE_ACCOUNT="wn71398.us-east-1" \
SNOWFLAKE_USER="rachel.wolan@webflow.com" \
SNOWFLAKE_DATABASE="ANALYTICS" \
SNOWFLAKE_SCHEMA="WEBFLOW" \
SNOWFLAKE_WAREHOUSE="SNOWFLAKE_REPORTING_WH_4" \
SNOWFLAKE_AUTHENTICATOR="externalbrowser" \
node dist/cli-snowflake.js query "SELECT COUNT(DISTINCT node_id) as components FROM analytics.webflow.symbol_dom_nodes WHERE is_code_symbol = true"

echo ""
echo "Query 3: Top 5 code component names"
SNOWFLAKE_ACCOUNT="wn71398.us-east-1" \
SNOWFLAKE_USER="rachel.wolan@webflow.com" \
SNOWFLAKE_DATABASE="ANALYTICS" \
SNOWFLAKE_SCHEMA="WEBFLOW" \
SNOWFLAKE_WAREHOUSE="SNOWFLAKE_REPORTING_WH_4" \
SNOWFLAKE_AUTHENTICATOR="externalbrowser" \
node dist/cli-snowflake.js query "SELECT symbol_name, COUNT(DISTINCT site_id) as sites FROM analytics.webflow.symbol_dom_nodes WHERE is_code_symbol = true GROUP BY symbol_name ORDER BY sites DESC LIMIT 5"

echo ""
echo "✅ Test complete! If you only authenticated once, connection pooling is working!"
