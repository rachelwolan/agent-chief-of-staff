#!/bin/bash

echo "🚀 Launching Chief of Staff Agent Manager..."
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Resolve project root (two levels up from this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Navigate to agent-manager directory
cd "${ROOT_DIR}/apps/agent-manager"

# Install dependencies if not present
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Open browser
echo "🌐 Opening browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sleep 2 && open http://localhost:3000 &
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    sleep 2 && xdg-open http://localhost:3000 &
fi

# Start the server
echo "🤖 Starting Agent Manager server on http://localhost:3000..."
node server.js
