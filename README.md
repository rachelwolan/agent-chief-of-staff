# Agent Chief of Staff

AI-powered executive assistant system that prepares you for meetings, analyzes newsletters, manages your calendar, and helps you stay focused on what matters.

## 🎯 Core Features

- **Learn-it-all Dossier**: Analyzes Gmail newsletters with Claude Sonnet 4.5, creates strategic insights
- **Meeting Preparation**: Auto-generates prep materials from calendar and context
- **Calendar Intelligence**: Daily briefing with smart schedule insights  
- **Index Cards**: 3x5 focus cards for daily priorities
- **Context Gathering**: Pulls information from Slack, email, Tableau dashboards

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and add your API keys:
```bash
ANTHROPIC_API_KEY=your_key_here
PERSONAL_GMAIL_CLIENT_ID=your_gmail_oauth_id
PERSONAL_GMAIL_CLIENT_SECRET=your_gmail_oauth_secret
```

See [Environment Setup Guide](docs/setup/env-variables.md) for details.

### 3. Authenticate Services

**Gmail** (for newsletter dossiers):
```bash
npm run dossier:auth
```

**Google Calendar**:
```bash
npm run calendar:auth
```

### 4. Start Using

**Web Dashboard**:
```bash
cd apps/agent-manager && node server.js
```
Open http://localhost:3000

**Generate Daily Dossier**:
```bash
npm run dossier:generate
```

**View Calendar**:
```bash
npm run calendar:today
```

## 📁 Project Structure

```
/
├── agents/            # Agent specifications (markdown)
├── apps/
│   ├── agent-manager/ # Web dashboard
│   └── start-slack-bot.ts
├── packages/
│   └── core/          # Shared TypeScript sources and tests
├── tooling/           # Developer scripts & automation
├── docs/              # Comprehensive documentation
├── ai-dev-tasks/      # PRD workflow templates
├── tasks/             # Generated PRDs & task lists
├── logs/              # Execution logs (git-ignored)
└── data/              # Runtime data (git-ignored)
```

## 📚 Documentation

**Start here**: [Quick Start Guide](docs/quick-start.md) - Get running in 5 minutes

### Core Guides
- **[Setup](docs/setup.md)** - Complete configuration (Gmail, Calendar, Slack, Tableau)
- **[AI Dev Tasks](ai-dev-tasks/README.md)** - Structured PRD workflow and Chief of Staff workflows

### AI-Executable Workflows
All workflows in `/ai-dev-tasks/` - use with Claude Code slash commands:
- **[Create Dossier](ai-dev-tasks/create-dossier.md)** - Newsletter analysis (`/create-dossier`)
- **[Process Meeting](ai-dev-tasks/process-meeting.md)** - Meeting transcription & action items (`/process-meeting`)
- **[Launch Web Dashboard](ai-dev-tasks/launch-web-dashboard.md)** - Start Agent Manager UI (`/launch-web-dashboard`)
- **[Troubleshoot](ai-dev-tasks/troubleshoot.md)** - System diagnostics (`/troubleshoot`)
- **[Monitor Snowflake](ai-dev-tasks/monitor-snowflake.md)** - Business metrics tracking (`/monitor-snowflake`)
- **[Monitor Tableau](ai-dev-tasks/monitor-tableau.md)** - Dashboard monitoring (`/monitor-tableau`)
- **[Create Calendar Dashboard](ai-dev-tasks/create-calendar-dashboard.md)** - Intelligent calendar UI (`/create-calendar-dashboard`)
- **[Create Daily Briefing](ai-dev-tasks/create-daily-briefing.md)** - Automated prep system (`/create-daily-briefing`)

### Reference
- **[Commands](docs/reference/commands.md)** - All CLI commands
- **[Architecture](docs/reference/architecture.md)** - System design
- **[Agents](docs/reference/agents.md)** - All agent specs

### Personal Resources
Located in [docs/personal/](docs/personal/) - Your frameworks, prep materials, and product context

## 🔧 Key Commands

### Daily Dossier
```bash
npm run dossier:auth        # Authenticate Gmail (once)
npm run dossier:generate    # Generate today's dossier
```

### Calendar
```bash
npm run calendar:today      # Today's events
npm run calendar:week       # This week
npm run calendar:upcoming   # Next 10 events
```

### Development
```bash
npm run build              # Compile TypeScript
npm run dev                # Hot reload mode
```

### AI Dev Tasks (Structured Development)
```bash
/create-prd                # Create PRD for new feature
/generate-tasks            # Generate task list from PRD
/process-task-list         # Work through tasks iteratively
```

## 🤖 Available Agents

Located in `/agents/` directory:
- `learn-it-all.md` - Newsletter dossier generator
- `meeting-prep.md` - Meeting preparation
- `daily-index-card.md` - Focus card generator
- `calendar-analyzer.md` - Calendar insights
- `video-transcriber.md` - Video/audio transcription
- `tableau-monitor.md` - Dashboard monitoring
- `slack-summarizer.md` - Slack channel summaries
- `podcast-prep-researcher.md` - Podcast preparation

## 🌐 Web Dashboard

Start the dashboard:
```bash
cd apps/agent-manager && node server.js
```

Access at **http://localhost:3000**

Features:
- Daily briefing with Focus card
- Today's calendar with meeting details
- Team calendar insights
- Learn-it-all dossier viewer
- Newsletter source tracking

## 🔐 Security & Privacy

- OAuth2 for Gmail and Google Calendar (read-only)
- Tokens stored locally in `~/.config/claude/`
- Newsletter content analyzed by Claude (no storage)
- All data stays local except Claude API calls
- See [Environment Variables](docs/setup/env-variables.md) for secure configuration

## 💡 How It Works

### Daily Dossier (Learn-it-all)
1. Reads emails labeled "Newsletter" from your Gmail
2. Extracts all article links from newsletters
3. Fetches article content
4. Claude Sonnet 4.5 analyzes and synthesizes insights
5. Generates strategic implications for your role
6. Saves with full source citations

### Meeting Prep
1. Reads your calendar for upcoming meetings
2. Gathers context from Slack, email, past meetings
3. Generates tailored prep materials
4. Creates one-page brief + detailed notes

### Calendar Intelligence
1. Analyzes your schedule patterns
2. Identifies priorities and time allocation
3. Provides team availability insights
4. Generates daily focus card

## 🛠️ Tech Stack

- **TypeScript** - Type-safe development
- **Claude Sonnet 4.5** - AI analysis and synthesis
- **Node.js** - Runtime environment
- **Express** - Web dashboard server
- **Zod** - Schema validation
- **Gmail API** - Newsletter integration
- **Google Calendar API** - Schedule integration

## 📖 Learn More

- **[Full Documentation Index](docs/README.md)** - Complete documentation
- **[Architecture](docs/reference/architecture.md)** - System design
- **[AI Dev Tasks](docs/guides/ai-dev-tasks.md)** - Development workflow

## 🤝 Contributing

When adding features:
1. Use `/create-prd` to define requirements
2. Create agent spec in `/agents/` if needed
3. Implement in `/packages/core/src/`
4. Test thoroughly
5. Update documentation in `/docs/`

---

Built with TypeScript, Claude AI, and ☕

*Designed for a CPO at Webflow*
