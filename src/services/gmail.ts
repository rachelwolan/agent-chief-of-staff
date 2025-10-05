import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];
const TOKEN_PATH = path.join(process.env.HOME || '', '.config', 'claude', 'gmail-token.json');

interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
  links?: string[];
}

export class GmailService {
  private oauth2Client: OAuth2Client | null = null;

  /**
   * Initialize OAuth2 client with credentials from .env
   */
  private getOAuth2Client(): OAuth2Client {
    if (this.oauth2Client) {
      return this.oauth2Client;
    }

    const clientId = process.env.PERSONAL_GMAIL_CLIENT_ID;
    const clientSecret = process.env.PERSONAL_GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.PERSONAL_GMAIL_REDIRECT_URI || 'http://localhost:3000/oauth/gmail/callback';

    if (!clientId || !clientSecret) {
      throw new Error('Personal Gmail OAuth credentials not found in .env file. Please set PERSONAL_GMAIL_CLIENT_ID and PERSONAL_GMAIL_CLIENT_SECRET');
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Check if we have a token saved
    if (fs.existsSync(TOKEN_PATH)) {
      const token = fs.readFileSync(TOKEN_PATH, 'utf-8');
      this.oauth2Client.setCredentials(JSON.parse(token));
    }

    return this.oauth2Client;
  }

  /**
   * Generate authorization URL
   */
  getAuthUrl(): string {
    const oauth2Client = this.getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // Force consent screen to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async handleAuthCallback(code: string): Promise<void> {
    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save the token
    const configDir = path.dirname(TOKEN_PATH);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log('✅ Gmail token stored to', TOKEN_PATH);
  }

  /**
   * Check if we have valid credentials
   */
  isAuthenticated(): boolean {
    return fs.existsSync(TOKEN_PATH);
  }

  /**
   * Get messages with a specific label
   */
  async getMessagesByLabel(labelName: string, maxResults: number = 100): Promise<GmailMessage[]> {
    const auth = this.getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    // Get the label ID
    const labelsResponse = await gmail.users.labels.list({ userId: 'me' });
    const label = labelsResponse.data.labels?.find(l =>
      l.name?.toLowerCase() === labelName.toLowerCase()
    );

    if (!label) {
      throw new Error(`Label "${labelName}" not found`);
    }

    // Get messages with this label
    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [label.id!],
      maxResults: maxResults
    });

    const messages = messagesResponse.data.messages || [];
    const detailedMessages: GmailMessage[] = [];

    // Get full details for each message
    for (const message of messages) {
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full'
      });

      const headers = details.data.payload?.headers || [];
      const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');
      const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');
      const toHeader = headers.find(h => h.name?.toLowerCase() === 'to');
      const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date');

      // Extract body
      let body = '';
      if (details.data.payload?.body?.data) {
        body = Buffer.from(details.data.payload.body.data, 'base64').toString('utf-8');
      } else if (details.data.payload?.parts) {
        // Multipart message
        for (const part of details.data.payload.parts) {
          if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            if (part.body?.data) {
              body += Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
          }
        }
      }

      // Extract links from body
      const links = this.extractLinks(body);

      detailedMessages.push({
        id: details.data.id || '',
        threadId: details.data.threadId || '',
        subject: subjectHeader?.value || 'No subject',
        from: fromHeader?.value || 'Unknown',
        to: toHeader?.value || 'Unknown',
        date: dateHeader?.value || '',
        snippet: details.data.snippet || '',
        body: body,
        links: links
      });
    }

    return detailedMessages;
  }

  /**
   * Extract URLs from text
   */
  private extractLinks(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s<>"]+)/gi;
    const matches = text.match(urlRegex) || [];

    // Deduplicate and filter out common tracking/unsubscribe links
    const filteredLinks = matches
      .filter((url, index, self) => self.indexOf(url) === index)
      .filter(url => {
        const lower = url.toLowerCase();
        return !lower.includes('unsubscribe') &&
               !lower.includes('tracking') &&
               !lower.includes('pixel') &&
               !lower.includes('beacon');
      });

    return filteredLinks;
  }

  /**
   * Get newsletter messages from today (with Newsletter label)
   */
  async getNewsletters(maxResults: number = 50): Promise<GmailMessage[]> {
    const auth = this.getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    // Get the label ID
    const labelsResponse = await gmail.users.labels.list({ userId: 'me' });
    const label = labelsResponse.data.labels?.find(l =>
      l.name?.toLowerCase() === 'newsletter'
    );

    if (!label) {
      throw new Error('Label "Newsletter" not found');
    }

    // Calculate today's date range (midnight to midnight in UTC)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(today.getTime() / 1000);

    // Query for messages from today with Newsletter label
    const query = `label:${label.name} after:${todayTimestamp}`;

    // Get messages with this label from today
    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: maxResults
    });

    const messages = messagesResponse.data.messages || [];
    const detailedMessages: GmailMessage[] = [];

    // Get full details for each message
    for (const message of messages) {
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full'
      });

      const headers = details.data.payload?.headers || [];
      const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');
      const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');
      const toHeader = headers.find(h => h.name?.toLowerCase() === 'to');
      const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date');

      // Extract body
      let body = '';
      if (details.data.payload?.body?.data) {
        body = Buffer.from(details.data.payload.body.data, 'base64').toString('utf-8');
      } else if (details.data.payload?.parts) {
        // Multipart message
        for (const part of details.data.payload.parts) {
          if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            if (part.body?.data) {
              body += Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
          }
        }
      }

      // Extract links from body
      const links = this.extractLinks(body);

      detailedMessages.push({
        id: details.data.id || '',
        threadId: details.data.threadId || '',
        subject: subjectHeader?.value || 'No subject',
        from: fromHeader?.value || 'Unknown',
        to: toHeader?.value || 'Unknown',
        date: dateHeader?.value || '',
        snippet: details.data.snippet || '',
        body: body,
        links: links
      });
    }

    return detailedMessages;
  }
}
