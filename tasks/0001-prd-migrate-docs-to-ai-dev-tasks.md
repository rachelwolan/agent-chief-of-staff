# PRD: Migrate Documentation to AI-Executable Workflows

## Introduction/Overview

Currently, the agent-chief-of-staff system has documentation scattered across two directories: `/docs/workflows` and `/docs/guides`. While these documents are valuable references, they are not structured as AI-executable workflows. This PRD outlines a migration to consolidate all AI-facing specifications into the `/ai-dev-tasks` directory, transforming them from passive documentation into active, AI-executable workflow instructions.

**Problem:** Documentation exists primarily for human readers, not as actionable prompts for AI assistants. This creates friction when trying to use AI to execute workflows like "create a dossier" or "setup calendar dashboard."

**Solution:** Migrate all specification documents to the `/ai-dev-tasks` directory using the established "Rule:" format, making them executable by AI assistants while maintaining comprehensive documentation.

## Goals

1. **Consolidate AI-Facing Documentation**: Move all workflow and guide specifications from `/docs/workflows` and `/docs/guides` to `/ai-dev-tasks`
2. **Standardize Format**: Convert all specs to the "Rule:" format used by existing ai-dev-tasks files (create-prd.md, generate-tasks.md, process-task-list.md)
3. **Enable AI Execution**: Make specs directly executable by AI assistants through clear, structured instructions
4. **Improve Discoverability**: Create a single source of truth for AI-executable workflows
5. **Maintain Documentation Quality**: Preserve all valuable content from original docs while restructuring for AI consumption

## User Stories

1. **As a developer**, I want to type `/create-dossier` and have the AI execute the full dossier generation workflow without needing to reference multiple documentation files.

2. **As a user of the system**, I want all AI-executable workflows to follow a consistent format so I know what to expect and how they'll behave.

3. **As a maintainer**, I want a single directory (`/ai-dev-tasks`) where all AI workflow specifications live, making it easier to update and version control them.

4. **As an AI assistant**, I want clear, structured instructions with Goal, Process, and Output sections so I can reliably execute complex workflows.

5. **As a new user**, I want to discover available workflows by looking in one place (`/ai-dev-tasks`) rather than hunting through multiple documentation directories.

## Functional Requirements

### Migration Scope

1. **The system must migrate all files from `/docs/workflows/`:**
   - `calendar-dashboard.md` → `/ai-dev-tasks/create-calendar-dashboard.md`
   - `daily-briefing.md` → `/ai-dev-tasks/create-daily-briefing.md`
   - `snowflake-monitor.md` → `/ai-dev-tasks/monitor-snowflake.md`
   - `tableau-monitor.md` → `/ai-dev-tasks/monitor-tableau.md`

2. **The system must migrate all files from `/docs/guides/`:**
   - `dossier.md` → `/ai-dev-tasks/create-dossier.md`
   - `meeting-processor.md` → `/ai-dev-tasks/process-meeting.md`
   - `web-dashboard.md` → `/ai-dev-tasks/launch-web-dashboard.md`
   - `troubleshooting.md` → `/ai-dev-tasks/troubleshoot.md`
   - `ai-dev-tasks-guide.md` → Evaluate for merge with README.md or separate migration
   - `ai-dev-tasks.md` → Evaluate for merge with README.md or separate migration

### Format Conversion

3. **Each migrated file must follow the "Rule:" format structure:**
   - Start with `# Rule: [Action Verb] [Feature Name]`
   - Include `## Goal` section describing the purpose
   - Include `## Process` section with numbered, actionable steps
   - Include additional sections as needed (e.g., `## Clarifying Questions`, `## Output`, `## Target Audience`)
   - Use clear, imperative language for AI execution

4. **Each migrated file must preserve all essential content** from the original documentation, including:
   - Setup instructions
   - Environment variables
   - Command examples
   - API integrations
   - Workflow steps
   - Key features and capabilities

5. **Each migrated file must be action-oriented** with verb-prefixed names:
   - Use action verbs like "create", "monitor", "process", "launch", "troubleshoot"
   - Filename should clearly indicate what the AI will do when executing the workflow

### Cleanup

6. **After successful migration, the system must delete original files** from `/docs/workflows` and `/docs/guides` (except for files that remain as pure documentation like setup guides, README files, etc.)

7. **The system must update any references** to the old file paths in:
   - `CLAUDE.md`
   - `README.md`
   - Other documentation files
   - Command files in `.claude/commands/`

### Documentation Updates

8. **The system must update `/ai-dev-tasks/README.md`** to:
   - List all newly migrated workflows
   - Provide brief descriptions of each workflow
   - Include usage examples for each workflow
   - Maintain the existing content about create-prd, generate-tasks, and process-task-list

9. **The system must create or update custom commands** in `.claude/commands/` for frequently used workflows (e.g., `/create-dossier`, `/launch-web-dashboard`)

## Non-Goals (Out of Scope)

1. **Migrating pure documentation files** like `/docs/setup.md`, `/docs/quick-start.md`, `/docs/reference/` files that are meant for human consumption, not AI execution

2. **Changing the functionality** of any existing workflows - this is purely a reorganization and format conversion, not a feature enhancement

3. **Creating new workflows** beyond what already exists in the current documentation

4. **Modifying the core ai-dev-tasks workflow** (create-prd, generate-tasks, process-task-list) - these remain unchanged

5. **Converting all documentation to ai-dev-tasks format** - only workflow/guide specs that are meant to be AI-executable should be migrated

## Design Considerations

### File Structure Example

Each migrated file should follow this structure (example for `create-dossier.md`):

```markdown
# Rule: Create Daily Dossier

## Goal

To guide an AI assistant in generating a comprehensive daily dossier by reading Gmail newsletters, extracting articles, and synthesizing insights using Claude Sonnet 4.5.

## Process

1. **Authenticate with Gmail**: [Steps...]
2. **Fetch Newsletter Emails**: [Steps...]
3. **Extract Article Links**: [Steps...]
4. **Fetch Article Content**: [Steps...]
5. **Generate Insights with Claude**: [Steps...]
6. **Format Output**: [Steps...]

## Prerequisites

[Environment variables, setup requirements...]

## Output

[Description of expected output format...]

## Target Audience

This workflow is designed to be executed by an AI assistant (like Claude Code) either on-demand or on a schedule.
```

### Naming Convention

- Use verb prefixes: `create-`, `monitor-`, `process-`, `launch-`, `troubleshoot-`
- Use kebab-case: `create-calendar-dashboard.md` not `createCalendarDashboard.md`
- Be descriptive: `launch-web-dashboard.md` not `dashboard.md`

## Technical Considerations

1. **Preserve Code Examples**: All bash commands, npm scripts, and code snippets must be preserved accurately in the migrated files

2. **Maintain Accuracy**: Environment variable names, API endpoints, and configuration details must be migrated without changes

3. **File References**: Update any internal file references (e.g., `@create-prd.md` style references) to reflect new locations

4. **Custom Commands**: Consider which workflows deserve custom slash commands in `.claude/commands/` based on frequency of use

5. **Version Control**: This is a significant restructuring - consider creating a git branch for the migration work

## Success Metrics

1. **Complete Migration**: All 10 files successfully migrated to `/ai-dev-tasks` with proper "Rule:" format
2. **Zero Information Loss**: All essential content from original files preserved in migrated versions
3. **AI Executability**: Each migrated workflow can be successfully executed by an AI assistant without additional context
4. **Documentation Updated**: README.md and CLAUDE.md accurately reflect new file locations
5. **Clean Repository**: Original files removed from `/docs/workflows` and `/docs/guides`
6. **Custom Commands Created**: At least 3-5 frequently-used workflows have corresponding slash commands

## Open Questions

1. **Should `ai-dev-tasks-guide.md` and `ai-dev-tasks.md` be merged into the main README.md, kept separate, or archived?** These seem potentially redundant with the existing README.

2. **Should troubleshooting.md become an AI-executable workflow, or remain as reference documentation?** It might be better suited as a reference guide than an executable workflow.

3. **Do we need to create custom slash commands for all migrated workflows, or just the most frequently used ones?** This affects scope of work.

4. **Should we version the migrated files (e.g., v1.0) to track evolution over time?**

5. **Are there any other files in the codebase that reference these documentation paths that need updating beyond CLAUDE.md and README.md?**
