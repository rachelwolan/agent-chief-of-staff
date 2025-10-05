# AI Dev Tasks Guide

This guide explains how to use the structured AI-assisted development workflow integrated from [snarktank/ai-dev-tasks](https://github.com/snarktank/ai-dev-tasks).

## Quick Start

Use these custom commands to start the workflow:

1. **Create a PRD**: `/create-prd`
2. **Generate Tasks**: `/generate-tasks`
3. **Process Tasks**: `/process-task-list`

## What is AI Dev Tasks?

AI Dev Tasks is a structured workflow that helps you build features systematically with AI assistance by:
- Creating clear Product Requirement Documents (PRDs)
- Breaking PRDs into granular, actionable task lists
- Processing tasks iteratively with approval at each step

## Workflow Details

### 1. Create a Product Requirement Document (PRD)

```
/create-prd
```

**What it does:**
- Asks clarifying questions about your feature
- Generates a structured PRD with goals, user stories, and requirements
- Saves to `/tasks/[n]-prd-[feature-name].md`

**Example:**
```
/create-prd

I want to build a feature that monitors Tableau workbooks and alerts me when they fail.
```

Claude will ask questions like:
- What problem does this solve?
- Who is the target user?
- What are the key actions?
- What are the success criteria?

### 2. Generate Task List

```
/generate-tasks
```

**What it does:**
- Takes your PRD and breaks it into specific implementation tasks
- Creates a hierarchical task structure with sub-tasks
- Saves to `/tasks/tasks-[n]-prd-[feature-name].md`

If you have multiple PRDs, Claude will show you a list to choose from.

### 3. Process Tasks Iteratively

```
/process-task-list
```

**What it does:**
- Works through tasks one at a time
- Waits for your approval before moving to the next task
- Marks tasks complete as you progress
- Provides clear visual tracking of progress

**How it works:**
1. Claude starts on task 1.1
2. You review the changes
3. Reply "yes" to approve and move to the next task
4. Or provide feedback to refine the current task

## File Structure

```
/tasks/
├── README.md
├── 0001-prd-tableau-monitoring.md        # PRD for feature #1
├── tasks-0001-prd-tableau-monitoring.md  # Tasks for feature #1
├── 0002-prd-calendar-sync.md             # PRD for feature #2
└── tasks-0002-prd-calendar-sync.md       # Tasks for feature #2
```

## Benefits

- **Structured Development**: Clear process from idea to implementation
- **Prevents Scope Creep**: PRD defines boundaries before coding starts
- **Step-by-Step Verification**: Review each change before moving forward
- **Manages Complexity**: Large features broken into manageable chunks
- **Progress Tracking**: Visual representation of completed work
- **Better AI Results**: Focused context prevents AI from getting lost

## Tips for Success

1. **Be Specific**: The more detail in your initial description, the better the PRD
2. **Answer Questions Thoroughly**: Claude's clarifying questions help create better PRDs
3. **Review Each Task**: Don't rush through approvals - each step builds on previous ones
4. **Provide Feedback**: If a task isn't quite right, give specific feedback
5. **Keep Tasks Small**: If a task seems too large, ask Claude to break it down further

## Example Workflow

```
User: /create-prd

User: I want to add a Slack integration that sends daily summaries of my calendar.

Claude: [asks clarifying questions]

User: [answers questions]

Claude: [creates 0001-prd-slack-calendar-summary.md]

User: /generate-tasks

Claude: [breaks down into 12 tasks across 3 phases]

User: /process-task-list

Claude: Starting on task 1.1: Set up Slack API client
[makes changes]
Ready for review. Should I proceed? (yes to continue)

User: yes

Claude: ✅ Task 1.1 complete
Starting task 1.2: Create authentication flow
[makes changes]
Ready for review. Should I proceed?

User: Can you add error handling for expired tokens?

Claude: [adds error handling]
Ready for review now. Should I proceed?

User: yes

Claude: ✅ Task 1.2 complete
[continues...]
```

## Reference Files

The workflow uses these core files in `/ai-dev-tasks/`:
- `create-prd.md` - PRD generation instructions
- `generate-tasks.md` - Task breakdown instructions
- `process-task-list.md` - Iterative processing instructions

## Related Documentation

- [Project Overview](./project-overview.md)
- [Agent Manager Guide](./agent-manager-guide.md)
- [Claude Development Guide](./claude-development-guide.md)

