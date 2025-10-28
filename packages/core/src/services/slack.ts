import fetch from 'node-fetch';

interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
}

interface MeetingActionItem {
  task: string;
  owner: string;
  dueDate?: string;
  priority?: string;
}

interface MeetingSummary {
  summary: string;
  keyDecisions?: string[];
  actionItems?: MeetingActionItem[];
  openQuestions?: string[];
  nextSteps?: string[];
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

  async postMeetingSummary(channel: string, summary: MeetingSummary): Promise<SlackResponse> {
    // Build formatted message text
    let messageText = `*Meeting Summary*\n\n${summary.summary}`;

    if (summary.keyDecisions && summary.keyDecisions.length > 0) {
      messageText += `\n\n*Key Decisions:*\n${summary.keyDecisions.map(d => `• ${d}`).join('\n')}`;
    }

    if (summary.actionItems && summary.actionItems.length > 0) {
      messageText += `\n\n*Action Items:*\n`;
      summary.actionItems.forEach((item, idx) => {
        const owner = item.owner;
        const dueDate = item.dueDate ? ` | Due: ${item.dueDate}` : '';
        const priority = item.priority ? ` | Priority: ${item.priority}` : '';
        messageText += `${idx + 1}. *${item.task}* - Owner: ${owner}${dueDate}${priority}\n`;
      });
    }

    if (summary.openQuestions && summary.openQuestions.length > 0) {
      messageText += `\n\n*Open Questions & Follow-ups:*\n${summary.openQuestions.map(q => `• ${q}`).join('\n')}`;
    }

    if (summary.nextSteps && summary.nextSteps.length > 0) {
      messageText += `\n\n*Next Steps:*\n${summary.nextSteps.map(s => `• ${s}`).join('\n')}`;
    }

    return this.sendMessage({
      channel,
      text: messageText
    });
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
