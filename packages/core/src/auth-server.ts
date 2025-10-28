#!/usr/bin/env node

import express from 'express';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_PATH = path.join(process.env.HOME || '', '.config', 'claude', 'google-calendar-token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME || '', '.config', 'claude', 'config.json');
const PORT = 3000;

const app = express();

// Load credentials
const configContent = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
const config = JSON.parse(configContent);
const googleConfig = config.mcpServers['google-calendar'].env;

const oauth2Client = new google.auth.OAuth2(
  googleConfig.GOOGLE_CLIENT_ID,
  googleConfig.GOOGLE_CLIENT_SECRET,
  googleConfig.GOOGLE_REDIRECT_URI
);

// Root route - start OAuth flow
app.get('/', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Calendar Authorization</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #4285f4;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
          }
          .button:hover {
            background: #3367d6;
          }
        </style>
      </head>
      <body>
        <h1>🔐 Google Calendar Authorization</h1>
        <p>Click the button below to authorize access to your Google Calendar:</p>
        <a href="${authUrl}" class="button">Authorize Google Calendar</a>
      </body>
    </html>
  `);
});

// OAuth callback route
app.get('/oauth/callback', async (req, res) => {
  const code = req.query.code as string;

  if (!code) {
    res.send('❌ No authorization code received');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save the token
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Successful</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
            }
            .success {
              padding: 16px;
              background: #d4edda;
              border: 1px solid #c3e6cb;
              border-radius: 4px;
              color: #155724;
            }
          </style>
        </head>
        <body>
          <h1>✅ Authorization Successful!</h1>
          <div class="success">
            <p>Your Google Calendar has been successfully connected.</p>
            <p>Token saved to: <code>${TOKEN_PATH}</code></p>
          </div>
          <p>You can now close this window and use the calendar commands:</p>
          <ul>
            <li><code>npm run calendar:today</code></li>
            <li><code>npm run calendar:week</code></li>
            <li><code>npm run calendar:upcoming</code></li>
          </ul>
        </body>
      </html>
    `);

    console.log('\n✅ Authorization successful! Token saved.');
    console.log('You can now use calendar commands.\n');

    // Close server after 5 seconds
    setTimeout(() => {
      console.log('Shutting down auth server...');
      process.exit(0);
    }, 5000);
  } catch (error) {
    console.error('Error getting token:', error);
    res.send(`❌ Error: ${error}`);
  }
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Google Calendar Authorization Server    ║
║                                            ║
║   Open: http://localhost:${PORT}              ║
║                                            ║
║   Click the link to authorize access      ║
╚════════════════════════════════════════════╝
  `);
});
