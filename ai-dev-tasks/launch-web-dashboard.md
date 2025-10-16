# Rule: Launch Web Dashboard

## Goal

To guide an AI assistant in launching and using the Chief of Staff Agent Manager web interface - a beautiful dashboard for managing, viewing, and executing AI agents through a modern web UI instead of the command line.

## Process

1. **Verify Prerequisites**:
   - Confirm Node.js and npm are installed
   - Verify main project is built (`npm run build` in root directory)
   - Check that agents exist in `/agents` directory
   - Ensure server dependencies are available
2. **Choose Launch Method**:
   - **Option 1** (Recommended): Use launch script `./launch-manager.sh`
   - **Option 2** (Manual): Navigate to `apps/agent-manager` and run manually
3. **Install Dependencies**:
   - If using launch script, dependencies install automatically
   - If manual, run `npm install` in `apps/agent-manager`
4. **Start the Server**:
   - Launch script: Automatically starts server
   - Manual: Run `npm start` in `apps/agent-manager`
   - Server will start on port 3000 (default)
5. **Open Web Interface**:
   - Launch script: Automatically opens browser to http://localhost:3000
   - Manual: Navigate to http://localhost:3000 in your browser
6. **Verify Dashboard Loaded**:
   - Check that agent gallery appears in left panel
   - Verify agents are listed with status indicators
   - Confirm recent outputs panel is visible
7. **Explore Interface**:
   - Left Panel: Browse available agents
   - Center Panel: View agent details when clicked
   - Right Panel: See recent execution outputs
8. **Configure Agents** (if needed):
   - Review agents marked "Needs Config"
   - Add missing API keys or tokens to `.env`
   - Restart server to load new configuration
9. **Run an Agent**:
   - Click on an agent card to view details
   - Click "Run Agent" button
   - Edit input JSON if needed
   - Click "Run Agent" in modal to execute
   - View results in output panel
10. **Monitor Execution**:
    - Check output panel for new results
    - Review full output files in `/logs` directory
    - Verify agent executed successfully

## Prerequisites

### System Requirements
- Node.js and npm installed
- Main project built (`npm run build` from root)
- Port 3000 available (or configure different port)

### Project Structure
```
apps/agent-manager/
├── index.html          # Main UI
├── styles.css          # Styling
├── app.js             # Frontend logic
├── server.js          # Express backend
└── package.json       # Dependencies

agents/                # Your agent definitions
logs/                  # Agent execution outputs
```

### Dependencies
The dashboard requires:
- `express` - Web server
- `cors` - Cross-origin resource sharing
- Other dependencies listed in `apps/agent-manager/package.json`

## Features

✨ **Visual Agent Gallery** - See all your agents in one place
📊 **Agent Details** - View capabilities, requirements, and examples
🚀 **Run Agents** - Execute agents directly from the web interface
📁 **Output History** - Track all agent outputs and results
🎨 **Modern UI** - Clean, responsive design with gradient styling

## Launch Methods

### Option 1: Launch Script (Recommended)

```bash
./launch-manager.sh
```

This will:
- Install dependencies automatically
- Start the server
- Open your browser to http://localhost:3000

### Option 2: Manual Start

```bash
cd apps/agent-manager
npm install
npm start
```

Then open http://localhost:3000 in your browser.

## Interface Overview

### Left Panel: Available Agents
- Lists all agents from the `/agents` directory
- Shows status indicators (Ready / Needs Config)
- Click any agent to view details in center panel

### Center Panel: Agent Details
When you select an agent, this panel displays:
- Agent name and description
- Capabilities and features
- Requirements (API keys, tokens, etc.)
- Example input JSON
- "Run Agent" button to execute

### Right Panel: Recent Outputs
- Shows history of agent executions
- Quick preview of results
- Links to full output files in `/logs`
- Automatically updates when new agents run

## Agent Status Indicators

- 🟢 **Ready** - Agent is configured and ready to run
- 🟠 **Needs Config** - Requires additional setup (e.g., API keys in `.env`)

## Running Agents from Dashboard

Follow these steps to execute an agent:

1. **Select Agent**: Click on any agent card in the left panel
2. **Review Details**: Check capabilities and requirements in center panel
3. **Click "Run Agent"**: Button appears in agent details
4. **Edit Input** (optional): Modify the input JSON if needed
5. **Execute**: Click "Run Agent" in the modal dialog
6. **View Results**: Check the output panel for execution results
7. **Access Full Output**: Click links to view complete output files

## API Endpoints

The dashboard server provides these REST endpoints:

- `GET /api/agents` - List all available agents from `/agents` directory
- `GET /api/outputs` - Get recent execution outputs from `/logs`
- `POST /api/run-agent` - Execute an agent with provided input JSON

## Current Agents

Example agents that may appear in the dashboard:

1. **Meeting Preparation** - Google Calendar integrated meeting briefs
2. **Task Manager** - Task prioritization and tracking
3. **Email Drafter** - Professional email composition
4. **Slack Summarizer** - Channel activity summaries (needs Slack tokens)
5. **Podcast Prep Researcher** - Interview preparation and talking points

*Note: Actual agents depend on what's in your `/agents` directory*

## Troubleshooting

### Port Already in Use
- **Issue**: Port 3000 is occupied by another service
- **Solution**: Edit `apps/agent-manager/server.js` to change the port number
- **Example**: Change `const PORT = 3000;` to `const PORT = 3001;`

### Agents Not Showing
- **Issue**: No agents appear in the left panel
- **Solution**: Ensure your agent markdown files are in the `/agents` directory
- **Check**: Run `ls agents/` to verify agent files exist
- **Restart**: Restart the server after adding new agents

### Can't Run Agents
- **Issue**: Error when clicking "Run Agent" button
- **Solution**: Build the main project first: `npm run build` in root directory
- **Check**: Verify `dist/` directory exists with compiled code
- **Restart**: Restart dashboard server after building

### Agents Show "Needs Config"
- **Issue**: Agent status shows configuration needed
- **Solution**: Add required API keys or tokens to `.env` file
- **Examples**:
  - `SLACK_BOT_TOKEN` for Slack agents
  - `GOOGLE_CALENDAR_CLIENT_ID` for calendar agents
  - `ANTHROPIC_API_KEY` for Claude-powered agents
- **Restart**: Restart server to load new environment variables

### Server Won't Start
- **Issue**: Error when running `npm start`
- **Solution**: Install dependencies first: `npm install` in `apps/agent-manager`
- **Check**: Verify `package.json` exists in `apps/agent-manager`
- **Check**: Ensure port 3000 is not already in use

### Browser Doesn't Auto-Open
- **Issue**: Using launch script but browser doesn't open
- **Solution**: Manually navigate to http://localhost:3000
- **Check**: Verify server started successfully (look for "Server running on port 3000" message)

### Output Panel Empty
- **Issue**: No recent outputs showing
- **Solution**: Run an agent first to generate outputs
- **Check**: Verify `/logs` directory exists and has files
- **Refresh**: Refresh the page to load latest outputs

## File Locations

### Dashboard Files
- `apps/agent-manager/index.html` - Main UI interface
- `apps/agent-manager/styles.css` - Styling and design
- `apps/agent-manager/app.js` - Frontend JavaScript logic
- `apps/agent-manager/server.js` - Express backend server
- `apps/agent-manager/package.json` - Dependencies

### Agent Files
- `agents/` - Directory containing all agent markdown definitions
- `logs/` - Directory containing agent execution outputs

### Configuration
- `.env` - Environment variables for API keys and tokens

## Output

A fully functional web dashboard that:
1. Displays all available agents in a visual gallery
2. Shows agent status (Ready or Needs Config)
3. Provides detailed information about each agent
4. Allows one-click agent execution from the browser
5. Displays recent agent outputs and results
6. Offers a modern, responsive UI for managing AI agents
7. Eliminates need to use command line for agent management
8. Tracks execution history automatically
9. Makes agent development and testing more accessible

## Target Audience

This workflow is designed for anyone who wants to manage and run AI agents through a web interface instead of the command line - particularly useful for:
- Executives who prefer visual interfaces
- Teams collaborating on agent development
- Users who want to quickly test and iterate on agents
- Anyone who prefers GUI over CLI

## Next Steps

After launching the dashboard:

1. **Configure Missing APIs**: Add any missing tokens/keys to `.env` for agents showing "Needs Config"
2. **Run Test Agents**: Execute a few agents to verify everything works
3. **Add New Agents**: Create more agent definitions in `/agents` directory
4. **Check Logs**: Review execution logs in `/logs` directory for debugging
5. **Customize UI**: Modify `styles.css` to match your preferences
6. **Integrate Services**: Connect Slack, Google Calendar, etc. for full functionality

## Notes

- Dashboard runs on localhost:3000 by default
- Server must stay running for dashboard to work
- Refresh browser to see newly added agents
- Agent outputs are saved to `/logs` directory
- Status indicators automatically detect missing API keys
- Launch script is the easiest way to get started
- Modern browsers recommended (Chrome, Firefox, Safari, Edge)
- Mobile-responsive design works on tablets and phones
- Can run multiple agent executions concurrently

---

*Transform your command-line agents into a beautiful web experience.*
