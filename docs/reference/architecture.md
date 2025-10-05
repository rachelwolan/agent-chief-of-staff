# System Architecture

## Overview

Agent Chief of Staff is a spec-driven AI agent system that processes markdown-defined agents through Claude AI. The system emphasizes simplicity, modularity, and extensibility.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              User Interfaces                        │
├──────────────┬─────────────┬──────────────────────┤
│     CLI      │   Web UI    │   Commands           │
│  (Commander) │ (localhost) │  (/create-prd)       │
└──────┬───────┴──────┬──────┴──────┬───────────────┘
       │              │              │
       ▼              ▼              ▼
┌─────────────────────────────────────────────────────┐
│          Agent Runner (src/lib/agent-runner.ts)     │
│  - Loads agent specs (markdown)                     │
│  - Validates input (Zod schemas)                    │
│  - Substitutes template variables                   │
│  - Calls Claude API                                 │
│  - Validates output                                 │
│  - Logs execution                                   │
└──────┬──────────────────┬───────────────────┬──────┘
       │                  │                   │
       ▼                  ▼                   ▼
┌──────────────────────────────────────────────────────┐
│                Service Integrations                   │
├──────────┬──────────┬──────────┬───────────────────┤
│  Gmail   │ Calendar │  Slack   │   Tableau (MCP)   │
│ (OAuth)  │ (OAuth)  │  (Bot)   │   (Token)         │
└──────────┴──────────┴──────────┴───────────────────┘
       │                  │                   │
       ▼                  ▼                   ▼
┌──────────────────────────────────────────────────────┐
│            External Services & APIs                   │
│  • Anthropic Claude API (Sonnet 4.5)                │
│  • Google Workspace (Gmail, Calendar)                │
│  • Slack Workspace                                    │
│  • Tableau Server                                     │
└──────────────────────────────────────────────────────┘
```

## Core Components

### 1. Agent Specifications (`/agents/*.md`)

Markdown files that define agent behavior:

```markdown
## Job Statement
What this agent does...

## Input Schema (Zod)
\`\`\`typescript
z.object({ ... })
\`\`\`

## Output Schema (Zod)
\`\`\`typescript
z.object({ ... })
\`\`\`

## Prompt Template
You are {{role}}. Your task is {{task}}...
```

**Key Pattern**: Template variables use `{{variable}}` syntax for runtime substitution.

### 2. Agent Runner (`src/lib/agent-runner.ts`)

Central orchestration engine:
- Loads and parses agent specs
- Validates input against Zod schema
- Substitutes template variables
- Calls Claude API (Sonnet 4.5)
- Validates output against schema
- Logs execution to `/logs/`

### 3. Services (`src/services/`)

Integration adapters for external services:
- `gmail.ts` - Personal Gmail OAuth, newsletter extraction
- `google-calendar.ts` - Calendar OAuth, event access
- `dossier-generator.ts` - Claude Sonnet 4.5 analysis
- `article-fetcher.ts` - Web scraping with Readability
- `tableau-api.ts` - Tableau REST API client

### 4. CLI (`src/cli.ts`)

Commander.js interface:
```bash
node dist/cli.js run agents/meeting-prep.md    # Production
node dist/cli.js quick agents/meeting-prep.md  # Test
node dist/cli.js list                          # List agents
```

### 5. Web Dashboard (`agent-manager/`)

Express server on port 3000:
- Daily calendar view
- Index card (3x5 focus card)
- Learn-it-all dossier viewer
- Team calendar insights
- Agent execution interface

## Data Flow

### Example: Daily Dossier Generation

```
1. User clicks "Generate Dossier" (Web UI)
   ↓
2. POST /api/learn-it-all/generate (Express)
   ↓
3. GmailService.getNewsletters()
   → Fetches emails labeled "Newsletter"
   → Extracts all article links
   ↓
4. ArticleFetcherService.fetchMultipleArticles()
   → Downloads article content
   → Parses with Readability
   ↓
5. DossierGeneratorService.generateDossier()
   → Calls Claude Sonnet 4.5
   → Synthesizes strategic insights
   ↓
6. Save to logs/dossiers/YYYY-MM-DD.json
   ↓
7. Return JSON to Web UI for display
```

## Project Structure

```
/
├── agents/              # Agent markdown specs
├── src/                 # TypeScript source
│   ├── lib/            # Core libraries
│   ├── services/       # External integrations
│   ├── agents/         # Agent implementations
│   └── mcp-servers/    # MCP server implementations
├── docs/               # Documentation
├── ai-dev-tasks/       # PRD workflow templates
├── tasks/              # Generated PRDs & task lists
├── agent-manager/      # Web dashboard
├── logs/               # Execution logs (ignored)
└── data/               # Runtime data (ignored)
```

## Key Design Principles

### 1. Spec-Driven Development
Agents are defined in markdown, not code. This makes them:
- Easy to edit and version
- Readable by both humans and AI
- Testable independently
- Self-documenting

### 2. Validation Everywhere
Zod schemas validate:
- Agent inputs before execution
- Agent outputs after generation
- API responses
- Configuration

### 3. Observable Execution
Every agent run creates a log entry with:
- Timestamp and duration
- Input data
- Output data
- Success/failure status
- Error details if failed

### 4. ES Modules
All code uses ES modules:
- Import statements must include `.js` extensions
- `package.json` has `"type": "module"`
- Works with Node 18+

## Tech Stack

- **Runtime**: Node.js 18+ (ES Modules)
- **Language**: TypeScript (ES2022 target)
- **AI**: Anthropic Claude Sonnet 4.5
- **Validation**: Zod schemas
- **CLI**: Commander.js
- **Web**: Express.js
- **OAuth**: Google Auth Library
- **APIs**: Gmail, Google Calendar, Slack, Tableau

## Integration Patterns

### OAuth 2.0 (Gmail, Calendar)
- Desktop app flow
- Tokens saved to `~/.config/claude/`
- Automatic token refresh
- Minimal scopes (read-only where possible)

### Bot Tokens (Slack)
- Long-lived tokens
- Stored in `.env`
- No refresh needed

### API Keys (Claude, OpenAI, Tableau)
- Stored in `.env`
- Rotated periodically
- Used directly in API calls

## Security

- **Local-First**: All data stored locally except Claude API calls
- **OAuth Tokens**: Encrypted at rest by OS
- **API Keys**: Never committed to git (`.gitignore`)
- **Minimal Scopes**: Only request necessary permissions
- **Read-Only**: Gmail and Calendar are read-only access

## Scalability

Current design handles:
- **Newsletters**: 100s of emails, 1000s of links
- **Articles**: 100+ articles per dossier
- **Calendar**: 1000s of events
- **Agents**: Unlimited agent specs

## Extensibility

Add new agents by:
1. Creating new `.md` spec in `/agents/`
2. Optionally implementing custom logic in `/src/agents/`
3. Testing with `quick` command
4. Running with `run` command

No core changes needed!
