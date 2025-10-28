# Work Gmail Setup for Email Response Drafter

## Overview

The Email Response Drafter uses Google OAuth 2.0 to access your work Gmail (rachel.wolan@webflow.com) for reading, analyzing, and drafting responses to your emails.

## Required Environment Variables

Add these to your `.env` file:

```bash
# Work Gmail OAuth Credentials
WORK_GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
WORK_GMAIL_CLIENT_SECRET=your-client-secret
WORK_GMAIL_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob

# Anthropic API (already set)
ANTHROPIC_API_KEY=your-anthropic-key
```

## Creating Google OAuth Credentials

### Step 1: Go to Google Cloud Console

1. Visit https://console.cloud.google.com
2. Select or create a project (e.g., "Chief of Staff Agent")

### Step 2: Enable Gmail API

1. Go to **APIs & Services** > **Library**
2. Search for "Gmail API"
3. Click **Enable**

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **Internal** (if using Webflow workspace) or **External**
   - App name: "Chief of Staff Email Drafter"
   - User support email: rachel.wolan@webflow.com
   - Scopes: Add Gmail API scopes
   - Test users: Add rachel.wolan@webflow.com

4. Create OAuth client:
   - Application type: **Desktop app**
   - Name: "Email Response Drafter"
   - Click **Create**

5. Copy the credentials:
   - **Client ID** → `WORK_GMAIL_CLIENT_ID`
   - **Client Secret** → `WORK_GMAIL_CLIENT_SECRET`

### Step 4: Configure Redirect URI

Since we're using the "out of band" (oob) flow:
- Set `WORK_GMAIL_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob`

**Note**: The `oob` method is deprecated but still works. If you encounter issues, you can update to:
- `WORK_GMAIL_REDIRECT_URI=http://localhost:3000/oauth/gmail/callback`
- And add that URL to your OAuth app's authorized redirect URIs

## Required Gmail Scopes

The Email Response Drafter needs these permissions:

- `gmail.readonly` - Read your email messages
- `gmail.modify` - Mark emails as read, archive, etc.
- `gmail.send` - Send email replies
- `gmail.compose` - Create draft emails

These scopes are automatically requested during authentication.

## Authentication Flow

### First-Time Setup

```bash
npm run email:auth
```

This will:
1. Generate an OAuth URL
2. Open your browser to sign in with rachel.wolan@webflow.com
3. Request the necessary Gmail permissions
4. Provide an authorization code
5. Save your token to `~/.config/claude/work-gmail-token.json`

### Using the Email Drafter

```bash
npm run email:draft
```

This will:
1. Check for valid authentication token
2. Fetch unread emails from your work inbox
3. Analyze each email with Claude
4. Present draft responses
5. Let you save drafts or send immediately

## Token Storage

- **Location**: `~/.config/claude/work-gmail-token.json`
- **Contains**: OAuth refresh token and access token
- **Security**: Keep this file secure - it provides access to your Gmail

## Troubleshooting

### "Gmail not authenticated" error

Run the authentication setup:
```bash
npm run email:auth
```

### "Invalid credentials" error

1. Verify your `.env` has correct `WORK_GMAIL_CLIENT_ID` and `WORK_GMAIL_CLIENT_SECRET`
2. Check that Gmail API is enabled in Google Cloud Console
3. Ensure you're using credentials from a Desktop app (not Web app)

### "Access denied" error

1. Make sure rachel.wolan@webflow.com is added as a test user (if using External user type)
2. Verify all required scopes are configured in OAuth consent screen
3. Try re-authenticating: `npm run email:auth`

### Token expired

The system should automatically refresh tokens. If you see persistent auth errors:
1. Delete the token: `rm ~/.config/claude/work-gmail-token.json`
2. Re-authenticate: `npm run email:auth`

## Security Best Practices

1. **Never commit** `.env` file or token files to git
2. **Use Internal user type** if possible (requires Google Workspace)
3. **Rotate credentials** if they're ever exposed
4. **Review OAuth scopes** regularly - only request what you need
5. **Monitor access** in your Google Account settings

## Support

If you encounter issues:
1. Check the Google Cloud Console for API quotas/errors
2. Review Gmail API documentation: https://developers.google.com/gmail/api
3. Ensure your Google Workspace allows API access
