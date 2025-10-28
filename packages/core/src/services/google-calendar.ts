import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = path.join(process.env.HOME || '', '.config', 'claude', 'google-calendar-token.json');
const CREDENTIALS_PATH = path.join(process.env.HOME || '', '.config', 'claude', 'config.json');

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  attendees?: string[];
  location?: string;
  colorId?: string;
}

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client | null = null;

  /**
   * Load client credentials from config
   */
  private async loadCredentials(): Promise<{ clientId: string; clientSecret: string; redirectUri: string }> {
    const configContent = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const config = JSON.parse(configContent);

    const googleConfig = config.mcpServers['google-calendar'].env;

    return {
      clientId: googleConfig.GOOGLE_CLIENT_ID,
      clientSecret: googleConfig.GOOGLE_CLIENT_SECRET,
      redirectUri: googleConfig.GOOGLE_REDIRECT_URI
    };
  }

  /**
   * Create OAuth2 client
   */
  private async getOAuth2Client(): Promise<OAuth2Client> {
    if (this.oauth2Client) {
      return this.oauth2Client;
    }

    const credentials = await this.loadCredentials();
    const { clientId, clientSecret, redirectUri } = credentials;

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Check if we have a token saved
    if (fs.existsSync(TOKEN_PATH)) {
      const token = fs.readFileSync(TOKEN_PATH, 'utf-8');
      this.oauth2Client.setCredentials(JSON.parse(token));
    } else {
      // Need to authenticate
      await this.authenticate();
    }

    return this.oauth2Client;
  }

  /**
   * Authenticate with Google OAuth
   */
  private async authenticate(): Promise<void> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('\n🔐 Authorize this app by visiting this URL:');
    console.log(authUrl);
    console.log('\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const code = await new Promise<string>((resolve) => {
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        resolve(code);
      });
    });

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    // Save the token
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log('✅ Token stored to', TOKEN_PATH);
  }

  /**
   * Get calendar events for a date range
   */
  async getEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
    const auth = await this.getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    return events.map(event => ({
      id: event.id || '',
      summary: event.summary || 'No title',
      description: event.description || undefined,
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      attendees: event.attendees?.map(a => a.email || '') || [],
      location: event.location || undefined,
      colorId: event.colorId || undefined,
    }));
  }

  /**
   * Get today's events
   */
  async getTodayEvents(): Promise<CalendarEvent[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    return this.getEvents(startOfDay, endOfDay);
  }

  /**
   * Get this week's events
   */
  async getWeekEvents(): Promise<CalendarEvent[]> {
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

    return this.getEvents(startOfWeek, endOfWeek);
  }

  /**
   * Get upcoming events (next N events)
   */
  async getUpcomingEvents(count: number = 10): Promise<CalendarEvent[]> {
    const auth = await this.getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: count,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    return events.map(event => ({
      id: event.id || '',
      summary: event.summary || 'No title',
      description: event.description || undefined,
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      attendees: event.attendees?.map(a => a.email || '') || [],
      location: event.location || undefined,
      colorId: event.colorId || undefined,
    }));
  }

  /**
   * Get events for a specific date
   */
  async getEventsForDate(date: Date): Promise<CalendarEvent[]> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    return this.getEvents(startOfDay, endOfDay);
  }

  /**
   * Get events from a specific calendar (requires calendar sharing)
   */
  async getEventsFromCalendar(calendarId: string, date: Date): Promise<CalendarEvent[]> {
    try {
      const auth = await this.getOAuth2Client();
      const calendar = google.calendar({ version: 'v3', auth });

      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];

      return events.map(event => ({
        id: event.id || '',
        summary: event.summary || 'No title',
        description: event.description || undefined,
        start: event.start?.dateTime || event.start?.date || '',
        end: event.end?.dateTime || event.end?.date || '',
        attendees: event.attendees?.map(a => a.email || '') || [],
        location: event.location || undefined,
        colorId: event.colorId || undefined,
      }));
    } catch (error) {
      // Calendar not accessible or not shared
      console.error(`Cannot access calendar ${calendarId}:`, (error as Error).message);
      return [];
    }
  }

  /**
   * Get events for multiple team members
   */
  async getTeamCalendars(emails: string[], date: Date): Promise<Record<string, CalendarEvent[]>> {
    const results: Record<string, CalendarEvent[]> = {};

    for (const email of emails) {
      results[email] = await this.getEventsFromCalendar(email, date);
    }

    return results;
  }
}
