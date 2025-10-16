# Quick Start (5 Minutes)

Get your AI Chief of Staff running in 5 minutes.

## Step 1: Install (1 min)

```bash
npm install
```

## Step 2: Configure (2 min)

Create `.env` file with your Anthropic API key:

```bash
# Required
ANTHROPIC_API_KEY=your_key_here
```

Get your key from: https://console.anthropic.com/

## Step 3: Build (1 min)

```bash
npm run build
```

## Step 4: Try It! (1 min)

### Option A: Web Dashboard

```bash
cd apps/agent-manager && node server.js
```

Open http://localhost:3000

### Option B: Command Line

**Calendar** (if authenticated):
```bash
npm run calendar:today
```

**Test an agent**:
```bash
node dist/cli.js quick agents/meeting-prep.md
```

## Next Steps

### Add Newsletter Analysis

1. Get Gmail OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
2. Add to `.env`:
   ```bash
   PERSONAL_GMAIL_CLIENT_ID=xxx
   PERSONAL_GMAIL_CLIENT_SECRET=xxx
   ```
3. Authenticate:
   ```bash
   npm run dossier:auth
   ```
4. Generate dossier:
   ```bash
   npm run dossier:generate
   ```

See [Create Dossier](../ai-dev-tasks/create-dossier.md) workflow or use `/create-dossier`.

### Add Calendar Intelligence

1. Get Google Calendar OAuth credentials
2. Add to `.env`
3. Authenticate:
   ```bash
   npm run calendar:auth
   ```
4. View calendar:
   ```bash
   npm run calendar:today
   ```

## Full Setup

For complete configuration of all features, see [Setup Guide](setup.md).

## Help

- [All Commands](reference/commands.md)
- [Troubleshooting](../ai-dev-tasks/troubleshoot.md) - or use `/troubleshoot`
- [Full Documentation](../README.md)
