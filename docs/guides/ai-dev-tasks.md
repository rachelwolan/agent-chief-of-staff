# Tasks Directory

This directory stores Product Requirement Documents (PRDs) and their corresponding task lists for structured AI-assisted feature development.

## File Naming Convention

- **PRDs**: `[n]-prd-[feature-name].md` 
  - Example: `0001-prd-calendar-sync.md`
  - Sequential numbering starting from 0001

- **Task Lists**: `tasks-[n]-prd-[feature-name].md`
  - Example: `tasks-0001-prd-calendar-sync.md`
  - Must match the PRD number

## Workflow

### 1. Create a PRD
```
/create-prd
```
Describe your feature and Claude will create a structured PRD using `/ai-dev-tasks/create-prd.md`.

### 2. Generate Tasks
```
/generate-tasks
```
Claude will break down the PRD into actionable tasks using `/ai-dev-tasks/generate-tasks.md`.

### 3. Process Tasks
```
/process-task-list
```
Work through tasks iteratively, one at a time, with approval at each step using `/ai-dev-tasks/process-task-list.md`.

## Benefits

- **Structured Development**: Clear process from idea to implementation
- **Step-by-Step Verification**: Review and approve each change
- **Complexity Management**: Break down large features into digestible tasks
- **Progress Tracking**: Visual representation of completed work

## Source

This workflow is based on [snarktank/ai-dev-tasks](https://github.com/snarktank/ai-dev-tasks).

