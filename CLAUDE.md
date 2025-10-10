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
cd agent-manager && node server.js    # Start on localhost:3000
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

Use these files for structured feature development:
- `/ai-dev-tasks/create-prd.md` - Create PRDs
- `/ai-dev-tasks/generate-tasks.md` - Generate task lists
- `/ai-dev-tasks/process-task-list.md` - Process iteratively

Custom commands available:
- `/create-prd` - Start PRD workflow
- `/generate-tasks` - Break down PRD
- `/process-task-list` - Implement tasks

PRDs saved to `/tasks/` as `[n]-prd-[feature].md`

## Code Standards

- **ES Modules**: Import statements must include `.js` extensions
- **Validation**: Zod schemas for all inputs/outputs
- **Logging**: All executions logged to `/logs/`
- **Template Variables**: Use `{{variable}}` syntax in prompts
- **Test Files**: Clean up temporary `.ts` test files from root directory after testing. Keep root clean - only permanent scripts like `start-slack-bot.ts` should remain

## Documentation

Comprehensive documentation in `/docs/`:
- Quick Start: `/docs/quick-start.md`
- Setup: `/docs/setup.md`
- Guides: `/docs/guides/` (dossier, web-dashboard, ai-dev-tasks, troubleshooting)
- Reference: `/docs/reference/` (commands, architecture, agents)
- Workflows: `/docs/workflows/` (tableau-monitor, daily-briefing)
- Personal: `/docs/personal/` (your frameworks and context)

## Personal Context

This system serves a CPO at Webflow. Personal resources include communication frameworks (Decker method), product overviews, and AI custom instructions in `/docs/personal/`.