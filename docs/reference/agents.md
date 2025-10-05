# Agents Reference

Complete guide to all available agents and how to use them.

## Available Agents

### 1. Learn-it-all (`learn-it-all.md`)

**Purpose**: Analyzes Gmail newsletters and generates strategic dossiers

**What it does**:
- Reads emails labeled "Newsletter" from Gmail
- Extracts all article links
- Fetches and analyzes article content with Claude Sonnet 4.5
- Generates executive summary, themes, trends, strategic implications
- Creates shareable insights for Product Org and E-Staff

**Usage**:
```bash
npm run dossier:generate
```

**Requirements**: Gmail OAuth configured

**Output**: `logs/dossiers/YYYY-MM-DD.json`

---

### 2. Meeting Prep (`meeting-prep.md`)

**Purpose**: Generates comprehensive meeting preparation materials

**What it does**:
- Pulls meeting details from Google Calendar
- Gathers context from Slack, email, past meetings
- Creates one-page brief + detailed notes
- Identifies key discussion points

**Usage**:
```bash
node dist/cli.js run agents/meeting-prep.md --input meeting-input.json
```

**Requirements**: Google Calendar OAuth

**Output**: Prep card in markdown format

---

### 3. Daily Index Card (`daily-index-card.md`)

**Purpose**: Creates 3x5 index card with daily focus

**What it does**:
- Analyzes today's calendar
- Extracts top 3 priorities
- Formats as scannable index card
- Filters out noise (travel, meals, holds)

**Usage**: Automatic via web dashboard

**Requirements**: Google Calendar OAuth

**Output**: Displayed on dashboard

---

### 4. Calendar Analyzer (`calendar-analyzer.md`)

**Purpose**: Analyzes calendar patterns and provides insights

**What it does**:
- Identifies strategic priorities from meeting schedules
- Filters out noise (travel, meals, personal)
- Determines availability status
- Provides team calendar summaries

**Usage**: Automatic via web dashboard team views

**Requirements**: Google Calendar OAuth

**Output**: JSON with insights and status

---

### 5. Video Transcriber (`video-transcriber.md`)

**Purpose**: Transcribes video/audio files with OpenAI Whisper

**What it does**:
- Extracts audio from video
- Transcribes with Whisper
- Formats with timestamps
- Saves as markdown

**Usage**:
```bash
node dist/cli.js run agents/video-transcriber.md --input video-input.json
```

**Requirements**: OpenAI API key, ffmpeg installed

**Output**: Markdown transcription with timestamps

---

### 6. Tableau Monitor (`tableau-monitor.md`)

**Purpose**: Monitors Tableau dashboards for changes and anomalies

**What it does**:
- Connects to Tableau via MCP server
- Checks specified workbooks
- Detects data changes
- Sends Slack alerts

**Usage**:
```bash
node dist/cli.js run agents/tableau-monitor.md --input tableau-input.json
```

**Requirements**: Tableau credentials, MCP server configured

**Output**: Alert summary

---

### 7. Slack Summarizer (`slack-summarizer.md`)

**Purpose**: Summarizes Slack channel conversations

**What it does**:
- Fetches messages from specified channel
- Analyzes conversation patterns
- Generates key takeaways
- Identifies action items

**Usage**:
```bash
node dist/cli.js run agents/slack-summarizer.md --input slack-input.json
```

**Requirements**: Slack bot token

**Output**: Summary markdown

---

### 8. Podcast Prep Researcher (`podcast-prep-researcher.md`)

**Purpose**: Researches guests and topics for podcast preparation

**What it does**:
- Gathers background on podcast guests
- Researches relevant topics
- Generates discussion points
- Creates prep brief

**Usage**:
```bash
node dist/cli.js run agents/podcast-prep-researcher.md --input podcast-input.json
```

**Requirements**: Anthropic API key

**Output**: Research brief

---

## How Agents Work

### Agent Specification Format

All agents are defined in markdown with:

```markdown
## Job Statement
Clear description of what the agent does

## Success Criteria
- Bullet points defining successful execution

## Input Schema (Zod)
\`\`\`typescript
z.object({
  field: z.string()
})
\`\`\`

## Output Schema (Zod)
\`\`\`typescript
z.object({
  result: z.string()
})
\`\`\`

## Prompt Template
Parameterized prompt with {{variables}}
```

### Template Variables

Agents use `{{variable}}` syntax for runtime substitution:

```markdown
Analyze meeting with {{attendees}} at {{time}} about {{topic}}.
```

At runtime, these are replaced with actual values from input.

### Execution Flow

1. Load agent spec from `/agents/`
2. Parse Zod schemas
3. Validate input against schema
4. Substitute template variables
5. Call Claude API
6. Validate output against schema
7. Log results to `/logs/`
8. Return output

## Running Agents

### Production Mode

```bash
node dist/cli.js run agents/agent-name.md --input input.json
```

Uses real data and executes fully.

### Test Mode

```bash
node dist/cli.js quick agents/agent-name.md
```

Uses sample data for quick testing.

### List All Agents

```bash
node dist/cli.js list
```

## Creating New Agents

1. **Create spec file**: `agents/my-agent.md`
2. **Define job statement**: Clear description
3. **Add schemas**: Input and output with Zod
4. **Write prompt**: Use template variables
5. **Test**: `node dist/cli.js quick agents/my-agent.md`
6. **Run**: `node dist/cli.js run agents/my-agent.md`

See [AI Dev Tasks](../guides/ai-dev-tasks.md) for structured workflow.

## Agent Best Practices

### Good Agent Design

✅ **Single Responsibility**: Each agent does one thing well
✅ **Clear Inputs**: Well-defined Zod schemas
✅ **Validated Outputs**: Structured, parseable results
✅ **Reusable**: Can be called multiple times with different inputs
✅ **Observable**: Logs all executions

### Anti-Patterns

❌ **Too Broad**: Agent tries to do multiple unrelated tasks
❌ **Unclear Inputs**: Vague or loosely defined schemas
❌ **Unstructured Output**: Free-form text that's hard to parse
❌ **Stateful**: Depends on previous executions
❌ **Silent Failures**: Doesn't log or report errors

## Extending the System

### Add New Service Integration

1. Create service class in `src/services/`
2. Implement authentication (OAuth, API key, etc.)
3. Add methods for data access
4. Use in agent implementations
5. Document in setup guide

### Add New Agent

1. Define spec in `/agents/`
2. Optionally add custom logic in `/src/agents/`
3. Test thoroughly
4. Document usage

### Add Web Dashboard Feature

1. Add API endpoint in `agent-manager/server.js`
2. Add UI in `agent-manager/index.html`
3. Add logic in `agent-manager/app.js`
4. Add styles in `agent-manager/styles-new.css`

## Agent Examples

Example inputs/outputs available in `/docs/examples/`:
- `podcast-prep-example.md` - Sample podcast prep
- `tableau-monitor-input.json` - Tableau monitoring input

## Performance

**Typical Execution Times**:
- Quick test: < 5 seconds
- Meeting prep: 10-15 seconds
- Dossier generation: 30-90 seconds (depending on article count)
- Video transcription: Varies by video length

**Rate Limits**:
- Claude API: Follow Anthropic's rate limits
- Gmail API: 250 quota units per user per second
- Calendar API: 1M queries per day (free tier)

## Logging

All agent executions logged to `/logs/`:

```json
{
  "agentName": "meeting-prep",
  "input": { ... },
  "output": { ... },
  "timestamp": "2025-10-05T12:00:00.000Z",
  "duration": 12500,
  "success": true
}
```

Use logs for:
- Debugging failures
- Performance monitoring
- Audit trail
- Usage analytics
