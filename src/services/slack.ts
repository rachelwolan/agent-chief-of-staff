import fetch from 'node-fetch';

interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
}

interface SlackResponse {
  ok: boolean;
  error?: string;
  channel?: string;
  ts?: string;
}

export class SlackClient {
  private botToken: string;
  private userToken?: string;

  constructor(botToken: string, userToken?: string) {
    this.botToken = botToken;
    this.userToken = userToken;
  }

  async sendMessage(message: SlackMessage): Promise<SlackResponse> {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.botToken}`
      },
      body: JSON.stringify(message)
    });

    return await response.json() as SlackResponse;
  }

  async testConnection(): Promise<{ ok: boolean; error?: string; user?: string; team?: string }> {
    const response = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.botToken}`
      }
    });

    return await response.json() as any;
  }

  async getUserInfo(userId: string): Promise<any> {
    const response = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
      headers: {
        'Authorization': `Bearer ${this.botToken}`
      }
    });

    return await response.json();
  }

  async listChannels(): Promise<any> {
    const response = await fetch('https://slack.com/api/conversations.list', {
      headers: {
        'Authorization': `Bearer ${this.botToken}`
      }
    });

    return await response.json();
  }
}

// Factory function to create client from environment
export function createSlackClient(): SlackClient {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const userToken = process.env.SLACK_USER_TOKEN;

  if (!botToken) {
    throw new Error('SLACK_BOT_TOKEN not found in environment');
  }

  return new SlackClient(botToken, userToken);
}
