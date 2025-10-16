# Task List: Migrate Documentation to AI-Executable Workflows

## Relevant Files

### Source Files (to be migrated)
- `/docs/workflows/calendar-dashboard.md` - Calendar dashboard workflow specification
- `/docs/workflows/daily-briefing.md` - Daily briefing workflow specification
- `/docs/workflows/snowflake-monitor.md` - Snowflake monitoring workflow specification
- `/docs/workflows/tableau-monitor.md` - Tableau monitoring workflow specification
- `/docs/guides/dossier.md` - Dossier generation guide
- `/docs/guides/meeting-processor.md` - Meeting processor guide
- `/docs/guides/web-dashboard.md` - Web dashboard setup guide
- `/docs/guides/troubleshooting.md` - Troubleshooting guide
- `/docs/guides/ai-dev-tasks-guide.md` - AI dev tasks usage guide
- `/docs/guides/ai-dev-tasks.md` - AI dev tasks overview

### Target Files (new ai-dev-tasks workflows)
- `/ai-dev-tasks/create-calendar-dashboard.md` - Migrated calendar dashboard workflow
- `/ai-dev-tasks/create-daily-briefing.md` - Migrated daily briefing workflow
- `/ai-dev-tasks/monitor-snowflake.md` - Migrated snowflake monitor workflow
- `/ai-dev-tasks/monitor-tableau.md` - Migrated tableau monitor workflow
- `/ai-dev-tasks/create-dossier.md` - Migrated dossier generation workflow
- `/ai-dev-tasks/process-meeting.md` - Migrated meeting processor workflow
- `/ai-dev-tasks/launch-web-dashboard.md` - Migrated web dashboard workflow
- `/ai-dev-tasks/troubleshoot.md` - Migrated troubleshooting workflow
- `/ai-dev-tasks/README.md` - Updated with all workflows and merged content

### Custom Command Files (new slash commands)
- `.claude/commands/create-calendar-dashboard.md` - Slash command for calendar dashboard
- `.claude/commands/create-daily-briefing.md` - Slash command for daily briefing
- `.claude/commands/monitor-snowflake.md` - Slash command for snowflake monitor
- `.claude/commands/monitor-tableau.md` - Slash command for tableau monitor
- `.claude/commands/create-dossier.md` - Slash command for dossier generation
- `.claude/commands/process-meeting.md` - Slash command for meeting processor
- `.claude/commands/launch-web-dashboard.md` - Slash command for web dashboard
- `.claude/commands/troubleshoot.md` - Slash command for troubleshooting

### Documentation Files (to be updated)
- `/CLAUDE.md` - Project configuration, needs updated references
- `/README.md` - Main project README, may need updates
- `/docs/README.md` - Documentation index, needs updated references

### Notes
- All migrated files must follow the "Rule:" format with Goal, Process, Output sections
- All custom commands should reference the new `/ai-dev-tasks/` file paths
- Original source files will be deleted after successful migration
- Action-verb prefixes: create-, monitor-, process-, launch-, troubleshoot-

## Tasks

- [x] 1.0 Migrate workflow specifications to ai-dev-tasks with "Rule:" format
  - [x] 1.1 Read `/docs/workflows/calendar-dashboard.md` and convert to "Rule: Create Calendar Dashboard" format in `/ai-dev-tasks/create-calendar-dashboard.md`
  - [x] 1.2 Read `/docs/workflows/daily-briefing.md` and convert to "Rule: Create Daily Briefing" format in `/ai-dev-tasks/create-daily-briefing.md`
  - [x] 1.3 Read `/docs/workflows/snowflake-monitor.md` and convert to "Rule: Monitor Snowflake" format in `/ai-dev-tasks/monitor-snowflake.md`
  - [x] 1.4 Read `/docs/workflows/tableau-monitor.md` and convert to "Rule: Monitor Tableau" format in `/ai-dev-tasks/monitor-tableau.md`

- [x] 2.0 Migrate guide specifications to ai-dev-tasks with "Rule:" format
  - [x] 2.1 Read `/docs/guides/dossier.md` and convert to "Rule: Create Daily Dossier" format in `/ai-dev-tasks/create-dossier.md`
  - [x] 2.2 Read `/docs/guides/meeting-processor.md` and convert to "Rule: Process Meeting" format in `/ai-dev-tasks/process-meeting.md`
  - [x] 2.3 Read `/docs/guides/web-dashboard.md` and convert to "Rule: Launch Web Dashboard" format in `/ai-dev-tasks/launch-web-dashboard.md`
  - [x] 2.4 Read `/docs/guides/troubleshooting.md` and convert to "Rule: Troubleshoot System Issues" format in `/ai-dev-tasks/troubleshoot.md`

- [x] 3.0 Merge ai-dev-tasks documentation into README.md
  - [x] 3.1 Read `/docs/guides/ai-dev-tasks-guide.md` and `/docs/guides/ai-dev-tasks.md` to extract relevant content
  - [x] 3.2 Read current `/ai-dev-tasks/README.md` to understand existing structure
  - [x] 3.3 Merge content from ai-dev-tasks guides into README.md, adding a new section listing all 8 migrated workflows with descriptions
  - [x] 3.4 Ensure README.md includes usage examples for new workflows (e.g., "Use @create-dossier.md to generate daily dossier")

- [x] 4.0 Create custom slash commands for all migrated workflows
  - [x] 4.1 Create `.claude/commands/create-calendar-dashboard.md` with reference to `/ai-dev-tasks/create-calendar-dashboard.md`
  - [x] 4.2 Create `.claude/commands/create-daily-briefing.md` with reference to `/ai-dev-tasks/create-daily-briefing.md`
  - [x] 4.3 Create `.claude/commands/monitor-snowflake.md` with reference to `/ai-dev-tasks/monitor-snowflake.md`
  - [x] 4.4 Create `.claude/commands/monitor-tableau.md` with reference to `/ai-dev-tasks/monitor-tableau.md`
  - [x] 4.5 Create `.claude/commands/create-dossier.md` with reference to `/ai-dev-tasks/create-dossier.md`
  - [x] 4.6 Create `.claude/commands/process-meeting.md` with reference to `/ai-dev-tasks/process-meeting.md`
  - [x] 4.7 Create `.claude/commands/launch-web-dashboard.md` with reference to `/ai-dev-tasks/launch-web-dashboard.md`
  - [x] 4.8 Create `.claude/commands/troubleshoot.md` with reference to `/ai-dev-tasks/troubleshoot.md`

- [ ] 5.0 Update project documentation and references
  - [ ] 5.1 Update `/CLAUDE.md` to replace references to `/docs/workflows/` and `/docs/guides/` with new `/ai-dev-tasks/` paths
  - [ ] 5.2 Add new slash commands to CLAUDE.md documentation (list all 8 new commands)
  - [ ] 5.3 Check and update `/README.md` if it contains references to old documentation paths
  - [ ] 5.4 Update `/docs/README.md` to reflect new ai-dev-tasks structure
  - [ ] 5.5 Search codebase for any other references to moved files and update them

- [ ] 6.0 Clean up original files from docs directories
  - [ ] 6.1 Delete `/docs/workflows/calendar-dashboard.md`
  - [ ] 6.2 Delete `/docs/workflows/daily-briefing.md`
  - [ ] 6.3 Delete `/docs/workflows/snowflake-monitor.md`
  - [ ] 6.4 Delete `/docs/workflows/tableau-monitor.md`
  - [ ] 6.5 Delete `/docs/guides/dossier.md`
  - [ ] 6.6 Delete `/docs/guides/meeting-processor.md`
  - [ ] 6.7 Delete `/docs/guides/web-dashboard.md`
  - [ ] 6.8 Delete `/docs/guides/troubleshooting.md`
  - [ ] 6.9 Delete `/docs/guides/ai-dev-tasks-guide.md`
  - [ ] 6.10 Delete `/docs/guides/ai-dev-tasks.md`
  - [ ] 6.11 Verify `/docs/workflows/` and `/docs/guides/` are empty or contain only remaining documentation files
