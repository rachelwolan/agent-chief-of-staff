# Quick Reference Guide

## 🚀 Essential Commands

### Agent Operations
```bash
# Build the project
npm run build

# Run an agent with real data
node dist/cli.js run agents/meeting-prep.md

# Quick test an agent with sample data
node dist/cli.js quick agents/meeting-prep.md

# Start development mode
npm run dev
```

### Agent Manager
```bash
# Start the web interface
cd apps/agent-manager
npm start
# Open: http://localhost:3000

# Quick launch script
./tooling/scripts/launch-manager.sh
```

---

## 📁 Directory Structure
```
/agent-chief-of-staff
├── /agents              # Agent definitions (.md files)
│   └── /resources       # Documentation and guides
├── /apps/agent-manager  # Web interface application
├── /apps/start-slack-bot.ts
├── /packages/core/src   # TypeScript source code
├── /packages/core/tests # Tests
├── /tooling/scripts     # Helper scripts
├── /dist                # Compiled JavaScript
├── /logs                # Execution logs and outputs
├── .env                 # API keys (create from .env.example)
└── ~/.config/claude/    # MCP server configuration
```

---

## 🔑 Configuration Files

### `.env` (Root Directory)
```env
ANTHROPIC_API_KEY=sk-ant-api...
```

### `~/.config/claude/config.json`
```json
{
  "mcpServers": {
    "google-calendar": {
      "env": {
        "GOOGLE_CLIENT_ID": "xxx.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "GOCSPX-xxx"
      }
    },
    "slack": {
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-xxx",
        "SLACK_USER_TOKEN": "xoxp-xxx"
      }
    }
  }
}
```

---

## 🤖 Available Agents

| Agent | Status | Purpose | Key Input |
|-------|--------|---------|-----------|
| **meeting-prep** | ✅ Ready* | Meeting briefings | `calendarEventId` or `searchQuery` |
| **task-manager** | ✅ Ready | Task organization | `tasks[]`, `timeframe` |
| **email-drafter** | ✅ Ready | Email composition | `to`, `subject`, `key_points[]` |
| **slack-summarizer** | ⚠️ Config | Channel summaries | `channel`, `timeRange` |
| **podcast-prep** | ✅ Ready | Interview prep | `podcast`, `host`, `topics[]` |

*Requires Google Calendar setup

---

## 📅 Calendar Commands

```bash
npm run calendar:today      # Today's schedule
npm run calendar:week       # Week view
npm run calendar:upcoming   # Upcoming events
npm run calendar:auth       # Re-authenticate with Google
```

---

## ❄️ Snowflake Commands

Quick access to Webflow metrics from Snowflake:

```bash
# Get signup metrics
npm run snowflake signups                  # Yesterday's signups (default)
npm run snowflake signups 2025-10-14       # Signups for specific date

# View trends
npm run snowflake trend                    # Last 7 days signup trend

# Custom queries
npm run snowflake query "SELECT * FROM analytics.webflow.report__kpi_daily LIMIT 5"
```

**Configuration:**
- Warehouse: `SNOWFLAKE_REPORTING_WH_4`
- Database: `ANALYTICS`
- Schema: `WEBFLOW`
- Authentication: External browser (SSO)

---

## 🔗 Quick URLs

- **Agent Manager**: http://localhost:3000
- **Output Viewer**: http://localhost:3000/output.html?file=filename
- **Google Cloud Console**: https://console.cloud.google.com
- **Slack Apps**: https://api.slack.com/apps
- **Anthropic Console**: https://console.anthropic.com

---

## 📝 Agent Input Examples

### Meeting Prep (Calendar)
```json
{
  "meeting": {
    "calendarEventId": "event_abc123"
  },
  "calendarConfig": {
    "email": "rachel.wolan@webflow.com"
  }
}
```

### Task Manager
```json
{
  "tasks": [
    "Review Q4 goals",
    "Prepare board deck"
  ],
  "timeframe": "this week"
}
```

### Slack Summarizer
```json
{
  "channel": "#random-ai",
  "timeRange": "last 24 hours"
}
```

---

## 🛠️ Troubleshooting Checklist

### Agent Won't Run
- [ ] Built project? (`npm run build`)
- [ ] API key in `.env`?
- [ ] Valid input JSON?
- [ ] Agent file exists?

### MCP Not Working
- [ ] Claude Desktop restarted?
- [ ] Tokens configured?
- [ ] MCP server installed?
- [ ] Config file valid JSON?

### Web Interface Issues
- [ ] Server running? (`npm start`)
- [ ] Port 3000 free?
- [ ] Browser cache cleared?
- [ ] Console errors checked?

---

## 🎯 Common Workflows

### 1. Run Meeting Prep
```bash
# Build first
npm run build

# Create input file
echo '{"meeting": {"searchQuery": "Product Review"}}' > input.json

# Run agent
node dist/cli.js run agents/meeting-prep.md < input.json
```

### 2. Test New Agent
```bash
# Quick test with sample data
node dist/cli.js quick agents/your-agent.md

# Check output
ls -la logs/
```

### 3. View Outputs
1. Start manager: `cd apps/agent-manager && npm start`
2. Open browser: http://localhost:3000
3. Click "View Output →" on any file

---

## ⌨️ Keyboard Shortcuts

### In Claude Code
- `/help` - Get help
- `/agents` - List agents
- `/mcp` - Check MCP status

### In Browser (Agent Manager)
- `Ctrl/Cmd + R` - Refresh page
- `Ctrl/Cmd + Shift + R` - Hard refresh

---

## 📊 Status Indicators

| Symbol | Meaning |
|--------|---------|
| ✅ | Ready to use |
| ⚠️ | Needs configuration |
| 🔄 | In progress |
| ❌ | Error/Failed |
| 📝 | Documentation |
| 🔑 | Requires API key |

---

## 💡 Tips

1. **Always build after changes**: `npm run build`
2. **Test with `quick` first**: Faster debugging
3. **Check logs for errors**: `/logs` directory
4. **Use absolute paths**: Avoid relative path issues
5. **Restart Claude after MCP changes**: Required for config reload

---

Last Updated: September 28, 2025
