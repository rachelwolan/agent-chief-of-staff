# Agent Specifications

This directory contains agent specification files for the Agent Chief of Staff system.

## 🤖 Available Agents

### Calendar & Meeting Agents
- **[meeting-prep.md](meeting-prep.md)** - Generates comprehensive meeting preparation materials
- **[calendar-analyzer.md](calendar-analyzer.md)** - Analyzes calendar patterns and provides insights
- **[daily-index-card.md](daily-index-card.md)** - Creates daily index cards with priorities and prep

### Content & Learning Agents
- **[video-transcriber.md](video-transcriber.md)** - Transcribes and summarizes video/audio content
- **[learn-it-all.md](learn-it-all.md)** - Research and learning assistant
- **[podcast-prep-researcher.md](podcast-prep-researcher.md)** - Prepares research for podcast appearances

### Communication Agents
- **[slack-summarizer.md](slack-summarizer.md)** - Summarizes Slack conversations and channels

### Monitoring Agents
- **[tableau-monitor.md](tableau-monitor.md)** - Monitors Tableau workbooks and alerts on failures

## 📝 Agent Specification Format

Each agent specification is a markdown file containing:

1. **Job Statement** - What the agent does (Jobs-To-Be-Done format)
2. **Success Criteria** - How to measure if the agent succeeded
3. **Input Schema** - Zod schema defining required inputs
4. **Output Schema** - Zod schema defining expected outputs
5. **Prompt Template** - Parameterized prompt using `{{variables}}`

### Example Structure

\`\`\`markdown
# Agent Name

## Job Statement
When [situation], I want to [action], so that [outcome].

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Input Schema
\`\`\`typescript
z.object({
  field: z.string()
})
\`\`\`

## Output Schema
\`\`\`typescript
z.object({
  result: z.string()
})
\`\`\`

## Prompt
Your instructions with {{variables}} for substitution.
\`\`\`

## 🚀 Running Agents

### Quick Test (with sample data)
\`\`\`bash
node dist/cli.js quick agents/agent-name.md
\`\`\`

### Production Run (with real data)
\`\`\`bash
node dist/cli.js run agents/agent-name.md
\`\`\`

### Via Web Dashboard
1. Start the dashboard: `cd agent-manager && node server.js`
2. Open http://localhost:3000
3. Select and run agents from the UI

## 🔧 Development

### Adding a New Agent

1. **Create Specification**
   \`\`\`bash
   touch agents/new-agent.md
   \`\`\`

2. **Define the Agent** (use format above)

3. **Test with Sample Data**
   \`\`\`bash
   npm run build
   node dist/cli.js quick agents/new-agent.md
   \`\`\`

4. **Check Logs**
   \`\`\`bash
   cat logs/[timestamp]-new-agent.json
   \`\`\`

5. **Run in Production**
   \`\`\`bash
   node dist/cli.js run agents/new-agent.md
   \`\`\`

### Modifying an Existing Agent

1. Edit the `.md` file
2. Rebuild: `npm run build`
3. Test: `node dist/cli.js quick agents/agent-name.md`
4. Verify output in `/logs/`

## 📚 Related Documentation

- **[Quick Reference](../docs/guides/quick-reference.md)** - Essential commands
- **[Agent Manager Guide](../docs/guides/agent-manager-guide.md)** - Web dashboard usage
- **[System Overview](../docs/specs/architecture/system-overview.md)** - Architecture details
- **[Claude Development Guide](../docs/guides/claude-development-guide.md)** - Development guidelines

## 🔗 Integration

Agents integrate with:
- **Google Calendar** - Meeting and event data
- **Slack** - Team communications
- **Gmail** - Email context
- **Tableau** - Workbook monitoring
- **OpenAI Whisper** - Audio transcription

See `/docs/setup/` for integration configuration.

---

*For more information, see the [main README](../README.md)*

