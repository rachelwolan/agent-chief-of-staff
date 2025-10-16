# Documentation

Complete documentation for Agent Chief of Staff.

## 🚀 Getting Started

**New here?** Start with these:

1. **[Quick Start](quick-start.md)** - Get running in 5 minutes
2. **[Setup Guide](setup.md)** - Complete configuration
3. **[Commands Reference](reference/commands.md)** - All CLI commands

## 📖 AI-Executable Workflows

AI-powered workflows available as Claude Code slash commands (in `/ai-dev-tasks/`):

### Dashboard & Calendar
- **[Create Calendar Dashboard](../ai-dev-tasks/create-calendar-dashboard.md)** - Intelligent calendar with AI prep (`/create-calendar-dashboard`)
- **[Create Daily Briefing](../ai-dev-tasks/create-daily-briefing.md)** - Automated daily intelligence (`/create-daily-briefing`)

### Monitoring
- **[Monitor Snowflake](../ai-dev-tasks/monitor-snowflake.md)** - Business metrics tracking (`/monitor-snowflake`)
- **[Monitor Tableau](../ai-dev-tasks/monitor-tableau.md)** - Dashboard monitoring (`/monitor-tableau`)

### Content & Communication
- **[Create Dossier](../ai-dev-tasks/create-dossier.md)** - Newsletter analysis with Claude Sonnet 4.5 (`/create-dossier`)
- **[Process Meeting](../ai-dev-tasks/process-meeting.md)** - Meeting transcription & action items (`/process-meeting`)

### System Management
- **[Launch Web Dashboard](../ai-dev-tasks/launch-web-dashboard.md)** - Start Agent Manager UI (`/launch-web-dashboard`)
- **[Troubleshoot](../ai-dev-tasks/troubleshoot.md)** - System diagnostics (`/troubleshoot`)

### Core Workflow
- **[AI Dev Tasks Overview](../ai-dev-tasks/README.md)** - Structured PRD workflow with `/create-prd`, `/generate-tasks`, `/process-task-list`

## 📚 Reference

### Technical Documentation
- **[Commands](reference/commands.md)** - All CLI commands and options
- **[Architecture](reference/architecture.md)** - System design and data flow
- **[Agents](reference/agents.md)** - All agent specifications and usage

## 👤 Personal Resources

Your personal frameworks and context:
- **[Personal Resources Index](personal/personal-resources.md)** - Overview
- **[CPO Prep](personal/cpo-prep-general-about-me.md)** - Executive materials
- **[AEO Masterclass](personal/aeo-masterclass.md)** - Communication frameworks
- **[Webflow Products](personal/webflow_products_overview.md)** - Product suite
- **PDFs**: Decker method communication frameworks

## 💡 Examples

Sample inputs and outputs:
- **[Podcast Prep Example](examples/podcast-prep-example.md)** - Sample agent output
- **[Tableau Input](examples/tableau-monitor-input.json)** - Monitoring configuration

## 📂 Directory Structure

```
docs/
├── README.md                # This file
├── quick-start.md           # 5-minute setup
├── setup.md                 # Complete setup guide
│
├── reference/               # Technical reference
│   ├── commands.md
│   ├── architecture.md
│   └── agents.md
│
├── personal/                # Your personal resources
│   └── ...
│
└── examples/                # Sample files
    └── ...

../ai-dev-tasks/             # AI-executable workflows (migrated from guides/ and workflows/)
├── README.md                # Workflow documentation
├── create-prd.md            # Core: Create PRDs
├── generate-tasks.md        # Core: Generate task lists
├── process-task-list.md     # Core: Process tasks
├── create-calendar-dashboard.md
├── create-daily-briefing.md
├── monitor-snowflake.md
├── monitor-tableau.md
├── create-dossier.md
├── process-meeting.md
├── launch-web-dashboard.md
└── troubleshoot.md
```

## 🔗 Quick Links

- **Main README**: [/README.md](../README.md)
- **Agents Directory**: [/agents/](../agents/)
- **Source Code**: [/packages/core/src/](../packages/core/src/)
- **AI Dev Tasks**: [/ai-dev-tasks/](../ai-dev-tasks/)
- **Tasks (PRDs)**: [/tasks/](../tasks/)

## 🆘 Need Help?

1. Check [Quick Start](quick-start.md) for basics
2. Review [Troubleshoot](../ai-dev-tasks/troubleshoot.md) for common issues (or use `/troubleshoot`)
3. Read [Setup Guide](setup.md) for configuration
4. Check [Commands Reference](reference/commands.md) for all CLI options

---

*Documentation last updated: October 2025*
