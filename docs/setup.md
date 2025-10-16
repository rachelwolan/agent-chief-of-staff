# Setup Guide

Complete setup instructions for Agent Chief of Staff.

## Prerequisites

- **Node.js** 18.0 or higher
- **macOS** 10.15+, Windows 10+, or Linux (Ubuntu 18.04+)
- **4GB RAM** minimum
- **Internet connection** for APIs

## 1. Install Dependencies

```bash
npm install
```

## 2. Environment Variables

Create a `.env` file in the project root:

```bash
# ============================================
# REQUIRED
# ============================================

# Anthropic API Key (for Claude Sonnet 4.5)
ANTHROPIC_API_KEY=your_key_here

# ============================================
# OPTIONAL - Based on Features You Use
# ============================================

# Personal Gmail (for Learn-it-all Dossier)
PERSONAL_GMAIL_CLIENT_ID=your_gmail_oauth_id
PERSONAL_GMAIL_CLIENT_SECRET=your_gmail_oauth_secret
PERSONAL_GMAIL_REDIRECT_URI=http://localhost:3000/oauth/gmail/callback

# Google Calendar (for Calendar Intelligence)
GOOGLE_CLIENT_ID=your_google_oauth_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback

# OpenAI (for Whisper Transcription)
OPENAI_API_KEY=your_openai_key

# Substack (for Reading Paywalled Articles)
SUBSTACK_SESSION_COOKIE=your_substack_session_id

# Slack (for Notifications)
SLACK_BOT_TOKEN=xoxb-your-slack-token

# Tableau (for Dashboard Monitoring)
TABLEAU_SERVER_URL=your_tableau_server
TABLEAU_SITE_ID=your_site_id
TABLEAU_TOKEN_NAME=your_token_name
TABLEAU_TOKEN_VALUE=your_token_value
```

### Get API Keys

**Anthropic (Required)**:
1. Visit https://console.anthropic.com/
2. Create account or sign in
3. Go to API Keys
4. Generate new key
5. Add to `.env` as `ANTHROPIC_API_KEY`

**OpenAI (Optional - for transcription)**:
1. Visit https://platform.openai.com/
2. Go to API Keys
3. Create new key
4. Add to `.env` as `OPENAI_API_KEY`

## 3. Gmail Setup (for Dossier)

Required for the Learn-it-all dossier feature.

### Get OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the **Gmail API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Desktop app** as application type
6. Copy **Client ID** and **Client Secret** to `.env`:
   ```bash
   PERSONAL_GMAIL_CLIENT_ID=xxx.apps.googleusercontent.com
   PERSONAL_GMAIL_CLIENT_SECRET=GOCSPX-xxx
   ```

### Authenticate

Run once to grant access:

```bash
npm run dossier:auth
```

This will:
- Open browser for Gmail authorization
- Save tokens to `~/.config/claude/gmail-token.json`
- Enable automatic access to newsletters

### Label Your Newsletters

In Gmail, create a label called **"Newsletter"** and apply it to your newsletter emails (manually or with filters).

**Pro Tip**: Create a Gmail filter to auto-label newsletters!

## 4. Google Calendar Setup

Required for calendar intelligence features.

### Get OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Google Calendar API**
3. Create OAuth 2.0 credentials (or reuse Gmail credentials)
4. Add to `.env`:
   ```bash
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxx
   ```

### Authenticate

```bash
npm run calendar:auth
```

This will:
- Open browser for Calendar authorization
- Save tokens to `~/.config/claude/google-token.json`
- Enable calendar access

## 5. Substack Authentication (Optional)

Required for reading paywalled Substack articles in your newsletters.

### Get Your Session Cookie

1. Open a browser and log in to https://substack.com/
2. Open **Developer Tools** (F12 or Cmd+Option+I on Mac)
3. Go to **Application** tab → **Cookies** → `https://substack.com`
4. Find the cookie named `substack.sid`
5. Copy its **Value** (long string starting with `s%3A`)
6. Add to `.env`:
   ```bash
   SUBSTACK_SESSION_COOKIE=s%3Ayour-session-id-here.xxx
   ```

**Security Notes**:
- This cookie grants access to your Substack account
- Keep it secure and never commit to git
- Rotate periodically by logging out and back in
- Only your paid subscriptions will be accessible

Used by:
- Article fetcher when accessing Substack URLs
- Enables reading paid newsletter content

## 6. Slack Setup (Optional)

Required for Slack notifications and channel summaries.

### Get Bot Token

1. Go to https://api.slack.com/apps
2. Create new app or select existing
3. Go to **OAuth & Permissions**
4. Add required scopes:
   - `chat:write` - Send messages
   - `files:write` - Upload files
   - `channels:read` - List channels
   - `users:read` - Get user info
5. Install app to workspace
6. Copy **Bot User OAuth Token**
7. Add to `.env`:
   ```bash
   SLACK_BOT_TOKEN=xoxb-your-token
   ```

## 7. Tableau Setup (Optional)

Required for dashboard monitoring.

### Get Token

1. Sign in to your Tableau Server
2. Go to **My Account Settings**
3. Create **Personal Access Token**
4. Add to `.env`:
   ```bash
   TABLEAU_SERVER_URL=https://your-server.tableau.com
   TABLEAU_SITE_ID=your-site
   TABLEAU_TOKEN_NAME=your-token-name
   TABLEAU_TOKEN_VALUE=your-token-value
   ```

## 8. Build & Test

```bash
# Compile TypeScript
npm run build

# Test calendar
npm run calendar:today

# Test dossier
npm run dossier:generate

# Start web dashboard
cd apps/agent-manager && node server.js
```

Open http://localhost:3000

## Verification Checklist

- [ ] `.env` file created with ANTHROPIC_API_KEY
- [ ] Gmail authenticated (if using dossier)
- [ ] Calendar authenticated (if using calendar)
- [ ] TypeScript compiled successfully (`npm run build`)
- [ ] Web dashboard loads at http://localhost:3000
- [ ] No console errors when running commands

## Troubleshooting

### "API key not found"
- Check `.env` file exists in project root
- Verify no spaces around `=` sign
- No quotes needed around values
- Restart any running servers

### "Gmail authentication required"
- Run `npm run dossier:auth`
- Check tokens at `~/.config/claude/gmail-token.json`

### "Calendar authentication required"
- Run `npm run calendar:auth`
- Check tokens at `~/.config/claude/google-token.json`

### "Module not found" errors
- Run `npm install`
- Run `npm run build`
- Check import statements include `.js` extensions

## Security Best Practices

1. ✅ Never commit `.env` to git (already in `.gitignore`)
2. ✅ Rotate API keys periodically
3. ✅ Use minimum OAuth scopes needed
4. ✅ Store production credentials securely (1Password, etc.)
5. ✅ Review token access regularly

## Next Steps

- [Quick Start Guide](quick-start.md) - Get running in 5 minutes
- [Create Dossier](../ai-dev-tasks/create-dossier.md) - Newsletter analysis workflow (or use `/create-dossier`)
- [Commands Reference](reference/commands.md) - All available commands
- [Troubleshooting](../ai-dev-tasks/troubleshoot.md) - Common issues (or use `/troubleshoot`)

---

**Need Help?** Use `/troubleshoot` or check [../ai-dev-tasks/troubleshoot.md](../ai-dev-tasks/troubleshoot.md), or review the [main README](../README.md).
