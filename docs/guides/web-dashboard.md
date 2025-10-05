# 🤖 Chief of Staff Agent Manager

A beautiful web interface for managing and running your AI agents.

## Features

✨ **Visual Agent Gallery** - See all your agents in one place
📊 **Agent Details** - View capabilities, requirements, and examples
🚀 **Run Agents** - Execute agents directly from the web interface
📁 **Output History** - Track all agent outputs and results
🎨 **Modern UI** - Clean, responsive design with gradient styling

## Quick Start

### Option 1: Launch Script (Recommended)
```bash
./launch-manager.sh
```

This will:
- Install dependencies
- Start the server
- Open your browser to http://localhost:3000

### Option 2: Manual Start
```bash
cd agent-manager
npm install
npm start
```

Then open http://localhost:3000 in your browser.

## Interface Overview

### Left Panel: Available Agents
- Lists all agents from the `/agents` directory
- Shows status (Ready / Needs Config)
- Click to view details

### Center Panel: Agent Details
- Displays selected agent information
- Shows capabilities and requirements
- Provides example inputs
- Run button to execute the agent

### Right Panel: Recent Outputs
- Shows history of agent executions
- Quick preview of results
- Links to full output files

## Agent Status Indicators

- 🟢 **Ready** - Agent is configured and ready to run
- 🟠 **Needs Config** - Requires additional setup (e.g., API keys)

## Current Agents

1. **Meeting Preparation** - Google Calendar integrated meeting briefs
2. **Task Manager** - Task prioritization and tracking
3. **Email Drafter** - Professional email composition
4. **Slack Summarizer** - Channel activity summaries (needs Slack tokens)
5. **Podcast Prep Researcher** - Interview preparation and talking points

## Running Agents

1. Click on any agent card
2. Review the capabilities and requirements
3. Click "Run Agent" button
4. Edit the input JSON if needed
5. Click "Run Agent" in the modal
6. View results in the output panel

## Files Structure

```
agent-manager/
├── index.html          # Main UI
├── styles.css          # Styling
├── app.js             # Frontend logic
├── server.js          # Express backend
└── package.json       # Dependencies

agents/                # Your agent definitions
logs/                  # Agent execution outputs
```

## API Endpoints

- `GET /api/agents` - List all available agents
- `GET /api/outputs` - Get recent execution outputs
- `POST /api/run-agent` - Execute an agent with input

## Troubleshooting

**Port already in use:** The app runs on port 3000. If occupied, edit `server.js` to change the port.

**Agents not showing:** Ensure your agent markdown files are in the `/agents` directory.

**Can't run agents:** Check that you have the main project built (`npm run build` in root directory).

## Next Steps

- Configure Slack and Google Calendar tokens for full functionality
- Add more agents to expand capabilities
- Check execution logs in the `/logs` directory

Enjoy managing your AI agents! 🚀