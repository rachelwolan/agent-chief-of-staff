# Daily Dossier Generator Guide

## Overview

The Daily Dossier Generator automatically reads your Gmail newsletters, extracts article links, fetches content, and uses **Claude Sonnet 4.5** to create a comprehensive "Learn-it-all" dossier with strategic insights tailored for Rachel (CPO at Webflow).

## Features

- **Gmail Integration**: Reads emails labeled "Newsletter" from your personal Gmail
- **Smart Link Extraction**: Automatically finds and extracts all relevant article URLs
- **Content Fetching**: Downloads full article content for analysis
- **Claude Sonnet 4.5 Analysis**: Uses Anthropic's latest model to generate insights
- **Source Citations**: Includes direct links and summaries of analyzed articles
- **Strategic Synthesis**: Creates actionable insights with Webflow-specific implications

## Setup

### 1. Environment Variables

Add these variables to your `.env` file:

```bash
# Required: Anthropic API Key
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Required: Personal Gmail OAuth Credentials
PERSONAL_GMAIL_CLIENT_ID=your_gmail_client_id_here
PERSONAL_GMAIL_CLIENT_SECRET=your_gmail_client_secret_here
PERSONAL_GMAIL_REDIRECT_URI=http://localhost:3000/oauth/gmail/callback
```

### 2. Get Gmail OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Gmail API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Desktop app** as application type
6. Copy the **Client ID** and **Client Secret** to your `.env` file

### 3. Authenticate with Gmail

Run the authentication flow once:

```bash
npm run dossier:auth
```

This will:
1. Open a browser window for Gmail authorization
2. Ask you to grant read/modify permissions
3. Save authentication tokens to `~/.config/claude/gmail-token.json`

### 4. Label Your Newsletters in Gmail

Make sure your newsletter emails are labeled with **"Newsletter"** in Gmail. The system will only read emails with this label.

To create the label:
1. Open Gmail
2. Go to Settings → Labels → Create new label
3. Name it "Newsletter"
4. Apply the label to your newsletter emails (manually or with filters)

**Pro Tip**: Create a Gmail filter to automatically label incoming newsletters!

## Usage

### Generate Dossier

Generate a dossier from today's newsletters:

```bash
npm run dossier:generate
```

This will:
1. ✅ Fetch all emails labeled "Newsletter" from today
2. ✅ Extract all unique links from those emails
3. ✅ Download article content from each link
4. ✅ Analyze with Claude Sonnet 4.5
5. ✅ Generate comprehensive dossier
6. ✅ Save to `logs/dossiers/YYYY-MM-DD.json`

### Options

```bash
# Fetch newsletters from the last 2 days
npm run dossier:generate -- --days 2

# Process up to 100 newsletters
npm run dossier:generate -- --max 100
```

## Output

The dossier includes:

### 1. Executive Summary (100 words)
Quick overview of what Rachel needs to know right now.

### 2. Key Themes (3-5 bullet points)
Major patterns across articles, connected to product/tech strategy.

### 3. Trend Signals (3-5 bullet points)
Emerging indicators, competitive intelligence, and market shifts.

### 4. Strategic Implications (200 words)
What this means for Webflow:
- Product opportunities
- Competitive threats
- Strategic bets to consider

### 5. Product Org Share
ONE article to share with the Product org, with a casual Slack message in Rachel's voice.

### 6. E-Staff Share
ONE article for the executive team, with strategic Slack message and @mentions for relevant executives (Linda, Allan, Craig, Adrian, Mike).

### 7. Full Dossier (1000 words)
Complete synthesis with:
- Cross-article connections
- Non-obvious insights
- Contrarian takes when warranted
- **Inline citations with specific article URLs**
- Provocative questions for consideration

### 8. Source Articles
Complete list of all analyzed articles with:
- Article title
- Direct URL
- Source publication

## Example Workflow

```bash
# First time setup
npm run dossier:auth

# Daily routine (can be automated)
npm run dossier:generate

# View output
cat logs/dossiers/$(date +%Y-%m-%d).json
```

## Automation

You can schedule this to run automatically every morning using cron:

```bash
# Edit crontab
crontab -e

# Add this line to run at 7 AM every weekday
0 7 * * 1-5 cd /path/to/agent-chief-of-staff && npm run dossier:generate
```

## Troubleshooting

### "Gmail authentication required"
- Run `npm run dossier:auth` to authenticate

### "No newsletters found"
- Make sure your emails are labeled "Newsletter" in Gmail
- Check that you have newsletters from today (or use `--days` option)

### "Could not fetch any article content"
- Some articles may be behind paywalls
- Some sites may block automated scraping
- Check network connectivity

### "ANTHROPIC_API_KEY not found"
- Add your Anthropic API key to `.env` file
- Get one from [Anthropic Console](https://console.anthropic.com/)

## AI Model Details

**Model Used**: `claude-sonnet-4-20250514` (Claude Sonnet 4.5)

This is Anthropic's most advanced model, optimized for:
- Long-form content analysis
- Strategic synthesis
- Nuanced understanding of business context
- Citation accuracy
- Personality matching (7w6 Enneagram style)

The model is explicitly instructed to:
- Cite sources with specific URLs
- Write in Rachel's voice
- Apply Decker communication principles
- Focus on actionable insights over generic observations

## File Locations

- **Dossiers**: `logs/dossiers/YYYY-MM-DD.json`
- **Gmail Token**: `~/.config/claude/gmail-token.json`
- **Source Code**: `src/cli-dossier.ts`
- **Services**: 
  - `src/services/dossier-generator.ts` (Claude integration)
  - `src/services/gmail.ts` (Gmail integration)
  - `src/services/article-fetcher.ts` (Content fetching)

## Next Steps

Consider integrating with:
- **Slack**: Auto-post dossier to Slack channel
- **Notion**: Save to Notion database
- **Email**: Send daily email summary
- **Calendar**: Block "reading time" with dossier link
