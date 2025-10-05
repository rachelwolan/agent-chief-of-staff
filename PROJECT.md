# Project Organization

Quick reference for project structure and key locations.

## 🗂️ Directory Structure

```
/
├── agents/              # Agent markdown specifications
├── ai-dev-tasks/        # PRD workflow templates  
├── tasks/               # Generated PRDs & task lists
│
├── src/                 # TypeScript source code
│   ├── lib/            # Core libraries (agent-runner, transcription)
│   ├── services/       # External integrations (Gmail, Calendar, etc.)
│   ├── agents/         # Agent implementations
│   ├── mcp-servers/    # MCP server implementations
│   └── schedulers/     # Scheduled jobs (empty - future)
│
├── agent-manager/       # Web dashboard (Express server)
│   ├── server.js       # Backend API
│   ├── app.js          # Frontend logic
│   ├── index.html      # Main dashboard
│   └── *.css           # Styles
│
├── docs/                # All documentation
│   ├── guides/         # Feature guides (4 files)
│   ├── reference/      # Technical docs (3 files)
│   ├── workflows/      # Step-by-step guides (3 files)
│   ├── personal/       # Your personal resources
│   └── examples/       # Sample files
│
├── logs/                # Execution logs (git-ignored)
│   ├── dossiers/       # Daily dossiers
│   └── index-cards/    # Daily focus cards
│
├── data/                # Runtime data (git-ignored)
│   └── prep-cards/     # Meeting prep materials
│
├── dist/                # Compiled JavaScript (git-ignored)
├── venv/                # Python virtualenv for Whisper (git-ignored)
│
├── .claude/             # Claude Code configuration
│   ├── commands/       # Custom slash commands
│   └── settings.local.json
│
└── scripts/             # Helper scripts
    └── launch-manager.sh
```

## 📍 Key Files

### Configuration (Root)
- `.env` - Environment variables (git-ignored)
- `.cursorrules` - Cursor AI coding patterns
- `CLAUDE.md` - Claude Code reference
- `README.md` - Project overview
- `package.json` - Node dependencies
- `tsconfig.json` - TypeScript config

### Entry Points
- `src/cli.ts` - Main CLI for running agents
- `src/cli-calendar.ts` - Calendar commands
- `src/cli-dossier.ts` - Dossier commands
- `agent-manager/server.js` - Web dashboard server

## 🎯 Quick Navigation

### For Development
- Coding patterns: `.cursorrules`
- TypeScript config: `tsconfig.json`
- Dependencies: `package.json`
- Core logic: `src/lib/agent-runner.ts`

### For Documentation
- Start here: `docs/README.md`
- Quick setup: `docs/quick-start.md`
- Full setup: `docs/setup.md`
- Guides: `docs/guides/`

### For Agents
- Specifications: `agents/*.md`
- Implementations: `src/agents/*.ts`
- Logs: `logs/`

### For AI Workflows
- Templates: `ai-dev-tasks/`
- Generated: `tasks/`
- Commands: `.claude/commands/`

## 🔄 Data Flow

### Logs Structure
```
logs/
├── dossiers/
│   └── 2025-10-05.json         # Daily dossiers
├── index-cards/
│   └── 2025-10-05.json         # Daily focus cards
└── tableau-monitor/             # Tableau checks
```

### Data Structure
```
data/
└── prep-cards/                  # Meeting prep materials
    └── {meeting-id}.json
```

## 🚫 What's Ignored (git)

- `dist/` - Compiled TypeScript
- `logs/` - All execution logs
- `data/` - All runtime data
- `venv/` - Python virtual environment
- `.env` - Environment variables
- `node_modules/` - Dependencies

## 🎨 Web Dashboard Structure

```
agent-manager/
├── server.js              # Express backend
├── app.js                 # Frontend JavaScript
├── index.html             # Main dashboard UI
├── calendar-dashboard.html    # Calendar-specific view
├── calendar-dashboard.js      # Calendar logic
├── output-viewer.js       # Output viewing
├── output.html            # Output viewer page
├── styles.css             # Original styles
├── styles-new.css         # New styles (active)
└── package.json           # Separate dependencies
```

## 🔌 Integration Points

- **Gmail**: OAuth tokens at `~/.config/claude/gmail-token.json`
- **Google Calendar**: OAuth tokens at `~/.config/claude/google-token.json`
- **Anthropic**: API key in `.env`
- **Slack**: Bot token in `.env`
- **Tableau**: MCP server config

## 📊 Size Overview

- Source code: ~14 TypeScript files
- Agents: 9 specifications
- Documentation: 18 markdown files
- Dependencies: ~2 directories with packages (root + agent-manager)
- Python venv: ~692MB (for Whisper transcription)

## 🎯 Key Principles

1. **Single Source of Truth**: Each concept has one canonical location
2. **Spec-Driven**: Agents defined in markdown, not code
3. **Validated**: Zod schemas everywhere
4. **Observable**: Everything logged
5. **Modular**: Clean separation of concerns

## 🔄 Maintenance

### Adding Features
1. Use `/create-prd` for requirements
2. Create agent spec in `agents/`
3. Implement in `src/`
4. Test with `quick` command
5. Document in `docs/guides/`

### Updating Documentation
1. Find file in `docs/[category]/`
2. Edit once (no duplication)
3. Verify cross-references
4. Update `docs/README.md` if needed

### Deploying Changes
1. `npm run build` - Compile TypeScript
2. Test agents with `quick` command
3. Restart dashboard if server code changed
4. Commit to git

---

*For detailed information, see [docs/README.md](docs/README.md)*
