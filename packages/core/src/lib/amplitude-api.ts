import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

interface AmplitudeEventSegmentationParams {
  e: object; // Event definition
  start: string; // YYYYMMDD
  end: string; // YYYYMMDD
  m?: string; // Metric (uniques, totals, average, etc.)
  i?: string; // Interval (1, 7, 30 for daily, weekly, monthly)
  s?: object[]; // Segments
  g?: string; // Group by property
}

interface AmplitudeFunnelParams {
  e: object[]; // Array of event definitions
  start: string;
  end: string;
  n?: string; // Funnel name
  mode?: string; // ordered, unordered, sequential
}

interface AmplitudeUsersParams {
  start: string;
  end: string;
  m?: string; // active, new
  i?: string; // Interval
}

interface AmplitudeChartResponse {
  data: {
    series: number[][];
    xValues: string[];
    seriesLabels?: string[];
  };
}

export class AmplitudeAPI {
  private baseUrl: string;
  private apiKey: string;
  private secretKey: string;
  private client: AxiosInstance;

  constructor() {
    this.apiKey = process.env.AMPLITUDE_API_KEY || '';
    this.secretKey = process.env.AMPLITUDE_SECRET_KEY || '';

    // Support EU residency region
    const region = process.env.AMPLITUDE_REGION || 'standard';
    this.baseUrl =
      region === 'eu'
        ? 'https://analytics.eu.amplitude.com/api/2'
        : 'https://amplitude.com/api/2';

    if (!this.apiKey || !this.secretKey) {
      console.warn('⚠️  Amplitude credentials not found. Set AMPLITUDE_API_KEY and AMPLITUDE_SECRET_KEY in .env');
    }

    // Create client with basic auth
    const auth = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64');

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
      },
      // Add timeout to prevent hanging
      timeout: 30000,
    });
  }

  /**
   * Test connection by listing events
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.listEvents();
      console.log('✓ Successfully connected to Amplitude');
      return true;
    } catch (error: any) {
      console.error('✗ Failed to connect to Amplitude:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * List all events in the project
   */
  async listEvents(): Promise<string[]> {
    try {
      const response = await this.client.get('/events/list');
      const events = response.data.data || [];
      console.log(`✓ Found ${events.length} events`);
      return events;
    } catch (error: any) {
      console.error('✗ Failed to list events:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get active and/or new users
   */
  async getUsers(params: AmplitudeUsersParams): Promise<any> {
    try {
      const response = await this.client.get('/users', { params });
      console.log(`✓ Retrieved user data from ${params.start} to ${params.end}`);
      return response.data;
    } catch (error: any) {
      console.error('✗ Failed to get users:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get daily active users for a date range
   */
  async getDailyActiveUsers(startDate: string, endDate: string): Promise<any> {
    return this.getUsers({
      start: startDate.replace(/-/g, ''),
      end: endDate.replace(/-/g, ''),
      m: 'active',
      i: '1', // Daily interval
    });
  }

  /**
   * Get event segmentation (most versatile query type)
   */
  async getEventSegmentation(params: AmplitudeEventSegmentationParams): Promise<any> {
    try {
      const response = await this.client.get('/events/segmentation', {
        params: {
          ...params,
          e: JSON.stringify(params.e),
          s: params.s ? JSON.stringify(params.s) : undefined,
        },
      });
      console.log(`✓ Retrieved event segmentation data`);
      return response.data;
    } catch (error: any) {
      console.error('✗ Failed to get event segmentation:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get funnel analysis
   */
  async getFunnel(params: AmplitudeFunnelParams): Promise<any> {
    try {
      const response = await this.client.get('/funnels', {
        params: {
          ...params,
          e: JSON.stringify(params.e),
        },
      });
      console.log(`✓ Retrieved funnel data`);
      return response.data;
    } catch (error: any) {
      console.error('✗ Failed to get funnel:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get real-time active users (last 5 minutes)
   */
  async getRealtimeActiveUsers(): Promise<any> {
    try {
      const response = await this.client.get('/realtime');
      console.log(`✓ Retrieved real-time active users`);
      return response.data;
    } catch (error: any) {
      console.error('✗ Failed to get real-time users:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get saved chart data by chart ID
   */
  async getChart(chartId: string): Promise<any> {
    try {
      const response = await this.client.get(`/chart/${chartId}/csv`);
      console.log(`✓ Retrieved chart ${chartId}`);
      return response.data;
    } catch (error: any) {
      console.error(`✗ Failed to get chart ${chartId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get retention analysis
   */
  async getRetention(params: {
    start: string;
    end: string;
    re?: object; // Return event
    se?: object; // Start event
    rm?: string; // Retention type
  }): Promise<any> {
    try {
      const response = await this.client.get('/retention', {
        params: {
          ...params,
          re: params.re ? JSON.stringify(params.re) : undefined,
          se: params.se ? JSON.stringify(params.se) : undefined,
        },
      });
      console.log(`✓ Retrieved retention data`);
      return response.data;
    } catch (error: any) {
      console.error('✗ Failed to get retention:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get average session length
   */
  async getAverageSessionLength(startDate: string, endDate: string): Promise<any> {
    try {
      const response = await this.client.get('/sessions/average', {
        params: {
          start: startDate.replace(/-/g, ''),
          end: endDate.replace(/-/g, ''),
        },
      });
      console.log(`✓ Retrieved average session length`);
      return response.data;
    } catch (error: any) {
      console.error('✗ Failed to get session length:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Search for a user by user ID
   */
  async searchUser(userId: string): Promise<any> {
    try {
      const response = await this.client.get('/usersearch', {
        params: { user: userId },
      });
      console.log(`✓ Found user ${userId}`);
      return response.data;
    } catch (error: any) {
      console.error(`✗ Failed to find user ${userId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user activity (event stream for a specific user)
   */
  async getUserActivity(userId: string, offset?: number, limit?: number): Promise<any> {
    try {
      const response = await this.client.get('/useractivity', {
        params: {
          user: userId,
          offset: offset || 0,
          limit: limit || 1000,
        },
      });
      console.log(`✓ Retrieved activity for user ${userId}`);
      return response.data;
    } catch (error: any) {
      console.error(`✗ Failed to get user activity:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Helper: Format date to Amplitude format (YYYYMMDD)
   */
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Helper: Get yesterday's date in Amplitude format
   */
  static getYesterday(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return AmplitudeAPI.formatDate(yesterday);
  }

  /**
   * Helper: Get date N days ago in Amplitude format
   */
  static getDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return AmplitudeAPI.formatDate(date);
  }
}
