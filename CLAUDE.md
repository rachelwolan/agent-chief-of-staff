# Claude Code Configuration

AI-powered Chief of Staff system using Claude 3.5 Sonnet for executive support tasks.

## Quick Commands

```bash
# Development
npm run dev              # Hot reload with tsx
npm run build           # Compile TypeScript

# Dossier (analyze newsletters with Claude Sonnet 4.5)
npm run dossier:generate    # Generate from Gmail newsletters

# Calendar
npm run calendar:today      # Today's schedule

# Web Dashboard
cd apps/agent-manager && node server.js    # Start on localhost:3000
```

## Architecture

**Spec-Driven Agents**: Markdown files in `/agents/` define jobs with Zod schemas and prompt templates
**Agent Runner**: `src/lib/agent-runner.ts` orchestrates parsing, validation, and Claude API calls
**Services**: Integrations with Gmail, Google Calendar, Slack, Tableau

Run agents:
```bash
node dist/cli.js run agents/agent-name.md    # Production
node dist/cli.js quick agents/agent-name.md  # Test
```

## AI Dev Tasks

### Core Workflow
Use these files for structured feature development:
- `/ai-dev-tasks/create-prd.md` - Create PRDs
- `/ai-dev-tasks/generate-tasks.md` - Generate task lists
- `/ai-dev-tasks/process-task-list.md` - Process iteratively

Custom commands:
- `/create-prd` - Start PRD workflow
- `/generate-tasks` - Break down PRD
- `/process-task-list` - Implement tasks

PRDs saved to `/tasks/` as `[n]-prd-[feature].md`

### Chief of Staff Workflows
AI-executable workflows for executive support tasks:

**Dashboard & Calendar:**
- `/create-calendar-dashboard` - Build intelligent calendar dashboard with AI-powered meeting prep
- `/create-daily-briefing` - Set up automated daily calendar intelligence and morning briefings

**Monitoring:**
- `/monitor-snowflake` - Configure Snowflake dashboard monitoring with MCP server
- `/monitor-tableau` - Set up Tableau dashboard monitoring with custom MCP server

**Content & Communication:**
- `/create-dossier` - Generate daily strategic briefings from Gmail newsletters
- `/process-meeting` - Analyze meeting transcripts/audio and extract action items

**System Management:**
- `/launch-web-dashboard` - Launch Agent Manager web interface on localhost:3000
- `/troubleshoot` - Systematic troubleshooting for API, integration, and runtime issues

All workflows available in `/ai-dev-tasks/` directory.

## Code Standards

- **ES Modules**: Import statements must include `.js` extensions
- **Validation**: Zod schemas for all inputs/outputs
- **Logging**: All executions logged to `/logs/`
- **Template Variables**: Use `{{variable}}` syntax in prompts
- **Test Files**: Clean up temporary `.ts` test files from root directory after testing. Keep the root clean—only permanent scripts like `apps/start-slack-bot.ts` should remain

## Documentation

Comprehensive documentation in `/docs/`:
- Quick Start: `/docs/quick-start.md`
- Setup: `/docs/setup.md`
- Reference: `/docs/reference/` (commands, architecture, agents)
- Personal: `/docs/personal/` (your frameworks and context)

AI-executable workflows in `/ai-dev-tasks/`:
- Core: `create-prd.md`, `generate-tasks.md`, `process-task-list.md`
- Dashboard & Calendar: `create-calendar-dashboard.md`, `create-daily-briefing.md`
- Monitoring: `monitor-snowflake.md`, `monitor-tableau.md`
- Content & Communication: `create-dossier.md`, `process-meeting.md`
- System: `launch-web-dashboard.md`, `troubleshoot.md`

## Personal Context

This system serves a CPO at Webflow. Personal resources include communication frameworks (Decker method), product overviews, and AI custom instructions in `/docs/personal/`.
