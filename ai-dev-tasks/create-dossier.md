# Rule: Create Daily Dossier

## Goal

To guide an AI assistant in generating a comprehensive daily "Learn-it-all" dossier by automatically reading Gmail newsletters, extracting article links, fetching content, and using Claude Sonnet 4.5 to create strategic insights tailored for a CPO. This transforms scattered newsletter content into actionable intelligence with Webflow-specific implications.

## Process

1. **Verify Prerequisites**:
   - Confirm Gmail OAuth credentials are configured in `.env`
   - Verify Anthropic API key is set
   - Ensure Gmail API is enabled in Google Cloud Console
   - Check that required dependencies are installed (googleapis, @anthropic-ai/sdk)
2. **Set Up Gmail Authentication** (first-time only):
   - Run `npm run dossier:auth` to start OAuth flow
   - Browser will open for Gmail authorization
   - Grant read/modify permissions
   - Tokens will be saved to `~/.config/claude/gmail-token.json`
3. **Label Newsletters in Gmail** (setup):
   - Create a "Newsletter" label in Gmail
   - Apply label to newsletter emails (manually or with filters)
   - Consider creating Gmail filter to auto-label incoming newsletters
4. **Fetch Newsletter Emails**:
   - Query Gmail for emails labeled "Newsletter" from today (or specified date range)
   - Retrieve email content including HTML bodies
   - Parse email metadata (sender, subject, date)
5. **Extract Article Links**:
   - Scan email HTML for all URLs
   - Filter for article links (exclude tracking, social media, etc.)
   - Deduplicate URLs across all newsletters
   - Store unique article URLs for processing
6. **Download Article Content**:
   - For each unique URL, fetch the full article HTML
   - Extract main article text from HTML (strip ads, navigation, etc.)
   - Handle errors for paywalled or blocked content
   - Save fetched content for analysis
7. **Analyze with Claude Sonnet 4.5**:
   - Use model `claude-sonnet-4-20250514` for advanced analysis
   - Send all article content to Claude with strategic analysis prompt
   - Instruct Claude to cite sources with specific URLs
   - Request output in Rachel's voice with Decker communication style
   - Focus on actionable insights over generic observations
8. **Generate Dossier Structure**:
   - Executive Summary (100 words)
   - Key Themes (3-5 bullet points)
   - Trend Signals (3-5 bullet points)
   - Strategic Implications (200 words for Webflow)
   - Product Org Share (one article + casual Slack message)
   - E-Staff Share (one article + strategic message with @mentions)
   - Full Dossier (1000 words with inline citations)
   - Source Articles (complete list with titles, URLs, sources)
9. **Save Dossier**:
   - Format output as JSON
   - Save to `logs/dossiers/YYYY-MM-DD.json`
   - Include timestamp and metadata
10. **Output Summary**:
    - Display executive summary to console
    - Show count of articles analyzed
    - Indicate file path of saved dossier
    - Suggest next actions (share with team, review strategic implications)

## Prerequisites

### Environment Variables

Add to `.env`:
```bash
# Required: Anthropic API Key
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Required: Personal Gmail OAuth Credentials
PERSONAL_GMAIL_CLIENT_ID=your_gmail_client_id_here
PERSONAL_GMAIL_CLIENT_SECRET=your_gmail_client_secret_here
PERSONAL_GMAIL_REDIRECT_URI=http://localhost:3000/oauth/gmail/callback
```

### Gmail OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Gmail API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Desktop app** as application type
6. Copy the **Client ID** and **Client Secret** to your `.env` file

### Gmail Label Setup

Create a "Newsletter" label in Gmail:
1. Open Gmail
2. Go to Settings → Labels → Create new label
3. Name it "Newsletter"
4. Apply the label to your newsletter emails (manually or with filters)

**Pro Tip**: Create a Gmail filter to automatically label incoming newsletters!

### Required Dependencies
- `googleapis` - Gmail API integration
- `google-auth-library` - OAuth authentication
- `@anthropic-ai/sdk` - Claude API for analysis
- `axios` or `node-fetch` - Article content fetching

### File Locations
- **Dossiers**: `logs/dossiers/YYYY-MM-DD.json`
- **Gmail Token**: `~/.config/claude/gmail-token.json`
- **Source Code**: `packages/core/src/cli-dossier.ts`
- **Services**:
  - `packages/core/src/services/dossier-generator.ts` (Claude integration)
  - `packages/core/src/services/gmail.ts` (Gmail integration)
  - `packages/core/src/services/article-fetcher.ts` (Content fetching)

## Features

- **Gmail Integration**: Reads emails labeled "Newsletter" from personal Gmail
- **Smart Link Extraction**: Automatically finds and extracts all relevant article URLs
- **Content Fetching**: Downloads full article content for analysis
- **Claude Sonnet 4.5 Analysis**: Uses Anthropic's most advanced model
- **Source Citations**: Includes direct links and summaries of analyzed articles
- **Strategic Synthesis**: Creates actionable insights with Webflow-specific implications

## Usage

### First-Time Setup

Authenticate with Gmail once:
```bash
npm run dossier:auth
```

This will:
1. Open a browser window for Gmail authorization
2. Ask you to grant read/modify permissions
3. Save authentication tokens to `~/.config/claude/gmail-token.json`

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

### View Output

```bash
# View today's dossier
cat logs/dossiers/$(date +%Y-%m-%d).json

# Pretty print with jq
cat logs/dossiers/$(date +%Y-%m-%d).json | jq .
```

## Output Format

The dossier includes these sections:

### 1. Executive Summary (100 words)
Quick overview of what you need to know right now.

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

Schedule this to run automatically every morning using cron:

```bash
# Edit crontab
crontab -e

# Add this line to run at 7 AM every weekday
0 7 * * 1-5 cd /path/to/agent-chief-of-staff && npm run dossier:generate
```

Or use a GitHub Action for cloud scheduling.

## Troubleshooting

### "Gmail authentication required"
- Run `npm run dossier:auth` to authenticate
- Check that `~/.config/claude/gmail-token.json` exists
- Verify OAuth credentials in `.env` are correct

### "No newsletters found"
- Make sure your emails are labeled "Newsletter" in Gmail
- Check that you have newsletters from today (or use `--days` option)
- Verify Gmail API is enabled in Google Cloud Console

### "Could not fetch any article content"
- Some articles may be behind paywalls
- Some sites may block automated scraping
- Check network connectivity
- Review error logs for specific URLs that failed

### "ANTHROPIC_API_KEY not found"
- Add your Anthropic API key to `.env` file
- Get one from [Anthropic Console](https://console.anthropic.com/)

### "Invalid OAuth credentials"
- Verify `PERSONAL_GMAIL_CLIENT_ID` and `PERSONAL_GMAIL_CLIENT_SECRET` are correct
- Make sure redirect URI matches: `http://localhost:3000/oauth/gmail/callback`
- Re-run `npm run dossier:auth` if tokens are expired

### "Rate limit exceeded"
- Anthropic API has rate limits - consider spacing out requests
- Gmail API has quotas - check usage in Google Cloud Console
- Add delays between article fetches if needed

## Output

A comprehensive daily dossier that:
1. Synthesizes all newsletter content from the day
2. Identifies key themes and trend signals
3. Provides strategic implications specific to Webflow
4. Suggests articles to share with Product org and E-Staff
5. Includes full analysis with inline citations
6. Lists all source articles with direct links
7. Saves to JSON file for programmatic access
8. Can be automated to run daily at 7 AM

## Target Audience

This workflow is designed to be executed by an AI assistant (like Claude Code) to automate the creation of a strategic daily briefing for executives who want to stay informed on industry trends without spending hours reading newsletters.

## Next Steps

Consider integrating with:
- **Slack**: Auto-post dossier to Slack channel
- **Notion**: Save to Notion database
- **Email**: Send daily email summary
- **Calendar**: Block "reading time" with dossier link
- **Dashboard**: Display key insights on morning dashboard

## Notes

- Uses Claude Sonnet 4.5 for highest quality analysis
- Gmail OAuth token is stored locally and refreshed automatically
- First run requires browser-based authentication
- Subsequent runs use stored tokens
- Article fetching may fail for paywalled content
- Dossier voice is customized to Rachel's 7w6 Enneagram style
- Applies Decker communication principles for clarity
- Output is JSON format for easy integration with other tools

---

*Transform newsletter overload into strategic intelligence - automatically, every morning.*
