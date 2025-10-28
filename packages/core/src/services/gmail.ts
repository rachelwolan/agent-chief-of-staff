import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose'
];

// Support both personal and work Gmail
const TOKEN_PATH = path.join(process.env.HOME || '', '.config', 'claude', 'gmail-token.json');
const WORK_TOKEN_PATH = path.join(process.env.HOME || '', '.config', 'claude', 'work-gmail-token.json');

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
  private accountType: 'personal' | 'work';
  private tokenPath: string;

  constructor(accountType: 'personal' | 'work' = 'work') {
    this.accountType = accountType;
    this.tokenPath = accountType === 'work' ? WORK_TOKEN_PATH : TOKEN_PATH;
  }

  /**
   * Initialize OAuth2 client with credentials from .env
   */
  private getOAuth2Client(): OAuth2Client {
    if (this.oauth2Client) {
      return this.oauth2Client;
    }

    const prefix = this.accountType === 'work' ? 'WORK_GMAIL' : 'PERSONAL_GMAIL';
    const clientId = process.env[`${prefix}_CLIENT_ID`];
    const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
    const redirectUri = process.env[`${prefix}_REDIRECT_URI`] || 'http://localhost:3000/oauth/gmail/callback';

    if (!clientId || !clientSecret) {
      throw new Error(`${this.accountType} Gmail OAuth credentials not found in .env file. Please set ${prefix}_CLIENT_ID and ${prefix}_CLIENT_SECRET`);
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Check if we have a token saved
    if (fs.existsSync(this.tokenPath)) {
      const token = fs.readFileSync(this.tokenPath, 'utf-8');
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
      response_type: 'code',
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
    const configDir = path.dirname(this.tokenPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(this.tokenPath, JSON.stringify(tokens));
    console.log(`✅ ${this.accountType} Gmail token stored to`, this.tokenPath);
  }

  /**
   * Check if we have valid credentials
   */
  isAuthenticated(): boolean {
    return fs.existsSync(this.tokenPath);
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

  /**
   * Archive messages (remove from INBOX)
   */
  async archiveMessages(messageIds: string[]): Promise<void> {
    const auth = this.getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    console.log(`📥 Archiving ${messageIds.length} newsletter(s)...`);

    for (const messageId of messageIds) {
      try {
        // Archive = remove INBOX label (Gmail's standard archive behavior)
        await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['INBOX']
          }
        });
        console.log(`✅ Archived newsletter: ${messageId}`);
      } catch (error) {
        console.error(`❌ Error archiving ${messageId}:`, (error as Error).message);
      }
    }
    
    console.log(`✅ Finished archiving ${messageIds.length} newsletter(s)`);
  }

  /**
   * Get unread inbox messages
   */
  async getUnreadInbox(maxResults: number = 50): Promise<GmailMessage[]> {
    const auth = this.getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread in:inbox',
      maxResults: maxResults
    });

    const messages = messagesResponse.data.messages || [];
    const detailedMessages: GmailMessage[] = [];

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

      let body = '';
      if (details.data.payload?.body?.data) {
        body = Buffer.from(details.data.payload.body.data, 'base64').toString('utf-8');
      } else if (details.data.payload?.parts) {
        for (const part of details.data.payload.parts) {
          if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            if (part.body?.data) {
              body += Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
          }
        }
      }

      detailedMessages.push({
        id: details.data.id || '',
        threadId: details.data.threadId || '',
        subject: subjectHeader?.value || 'No subject',
        from: fromHeader?.value || 'Unknown',
        to: toHeader?.value || 'Unknown',
        date: dateHeader?.value || '',
        snippet: details.data.snippet || '',
        body: body,
        links: this.extractLinks(body)
      });
    }

    return detailedMessages;
  }

  /**
   * Send an email reply
   */
  async sendReply(threadId: string, to: string, subject: string, body: string, inReplyTo?: string): Promise<void> {
    const auth = this.getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    // Create email in RFC 2822 format
    const messageParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0'
    ];

    if (inReplyTo) {
      messageParts.push(`In-Reply-To: ${inReplyTo}`);
      messageParts.push(`References: ${inReplyTo}`);
    }

    messageParts.push('');
    messageParts.push(body);

    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: threadId
      }
    });

    console.log(`✅ Sent reply to ${to}`);
  }

  /**
   * Create a draft reply
   */
  async createDraft(threadId: string, to: string, subject: string, body: string, inReplyTo?: string): Promise<string> {
    const auth = this.getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    const messageParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0'
    ];

    if (inReplyTo) {
      messageParts.push(`In-Reply-To: ${inReplyTo}`);
      messageParts.push(`References: ${inReplyTo}`);
    }

    messageParts.push('');
    messageParts.push(body);

    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const draft = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedMessage,
          threadId: threadId
        }
      }
    });

    console.log(`✅ Created draft for ${to}`);
    return draft.data.id || '';
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    const auth = this.getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });
  }

  /**
   * Get all available labels
   */
  async getLabels(): Promise<Array<{ id: string; name: string }>> {
    const auth = this.getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.labels.list({ userId: 'me' });
    const labels = response.data.labels || [];

    return labels
      .filter(label => label.id && label.name)
      .map(label => ({
        id: label.id!,
        name: label.name!
      }))
      .filter(label => !label.id.startsWith('CATEGORY_')); // Filter out system categories
  }

  /**
   * Apply label to a message
   */
  async applyLabel(messageId: string, labelName: string): Promise<void> {
    const auth = this.getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    // Get all labels to find the ID
    const labels = await this.getLabels();
    const label = labels.find(l => l.name === labelName);

    if (!label) {
      throw new Error(`Label "${labelName}" not found`);
    }

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: [label.id]
      }
    });
  }

  /**
   * Remove label from a message
   */
  async removeLabel(messageId: string, labelName: string): Promise<void> {
    const auth = this.getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth });

    const labels = await this.getLabels();
    const label = labels.find(l => l.name === labelName);

    if (!label) {
      throw new Error(`Label "${labelName}" not found`);
    }

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: [label.id]
      }
    });
  }
}
