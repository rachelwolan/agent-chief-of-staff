#!/bin/bash

echo "🚀 Starting Core Business Health Dashboard..."
echo ""
echo "1. Starting backend server on port 3001..."
node dashboards/dashboard-server.js &
SERVER_PID=$!

echo "2. Waiting for server to initialize..."
sleep 3

echo "3. Opening dashboard in browser..."
open dashboards/core-business-health-dashboard.html

echo ""
echo "✅ Dashboard is running!"
echo "   - Backend: http://localhost:3001"
echo "   - Frontend: Opening in browser"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Wait for server process
wait $SERVER_PID
