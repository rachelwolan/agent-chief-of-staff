import { WebClient } from '@slack/web-api';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

interface ChannelConfig {
  id: string;
  name: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  description?: string;
}

interface TriageConfig {
  channels: ChannelConfig[];
  settings: {
    messageLimit: number;
    maxMessagesPerChannel: number;
    excludeThreads: boolean;
    includeBotMessages: boolean;
  };
}

interface ChannelUpdate {
  channelId: string;
  channelName: string;
  priority: string;
  messageCount: number;
  keyUpdates: string[];
  actionItems: string[];
  decisions: string[];
  blockers: string[];
}

interface TriageResult {
  summary: string;
  channelUpdates: ChannelUpdate[];
  requiresAttention: string[];
  canIgnore: string[];
}

export class ChannelTriageService {
  private slackClient: WebClient;
  private anthropic: Anthropic;
  private config: TriageConfig;

  constructor(slackToken: string, anthropicKey: string) {
    this.slackClient = new WebClient(slackToken);
    this.anthropic = new Anthropic({ apiKey: anthropicKey });

    // Load config
    const configPath = path.join(process.cwd(), 'config', 'triage-channels.json');
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  async runTriage(timeRange: string = '4h'): Promise<TriageResult> {
    console.log(`🔍 Running channel triage (last ${timeRange})...\n`);

    // Calculate oldest timestamp based on time range
    const now = Date.now() / 1000;
    const oldestTs = this.calculateOldestTimestamp(now, timeRange);

    // Fetch messages from all configured channels
    const channelData: any[] = [];
    const errors: string[] = [];

    for (const channel of this.config.channels) {
      try {
        console.log(`   📥 Fetching ${channel.name}...`);
        console.log(`      Looking for messages after ${new Date(oldestTs * 1000).toLocaleString()}`);

        const history = await this.slackClient.conversations.history({
          channel: channel.id,
          oldest: oldestTs.toString(),
          limit: this.config.settings.maxMessagesPerChannel
        });

        console.log(`      Found ${history.messages?.length || 0} total messages`);

        // Fetch thread replies for messages that have them
        const messagesWithThreads = await Promise.all(
          (history.messages || []).map(async (msg: any) => {
            if (msg.reply_count && msg.reply_count > 0) {
              try {
                const replies = await this.slackClient.conversations.replies({
                  channel: channel.id,
                  ts: msg.ts,
                  oldest: oldestTs.toString()
                });
                return { ...msg, thread_replies: replies.messages?.slice(1) }; // Skip first message (the parent)
              } catch (error) {
                console.error(`      Error fetching thread for ${msg.ts}`);
                return msg;
              }
            }
            return msg;
          })
        );

        if (!history.messages || history.messages.length === 0) {
          console.log(`      ℹ️  No new messages`);
          continue;
        }

        // Enrich messages with user names and extract files/links
        const enrichedMessages = await Promise.all(
          messagesWithThreads
            .filter((msg: any) => {
              // Filter out bot messages if configured
              if (!this.config.settings.includeBotMessages && msg.bot_id) {
                return false;
              }
              return true;
            })
            .map(async (msg: any) => {
              try {
                let messageText = msg.text || '(no text)';

                // Add file/attachment info
                if (msg.files && msg.files.length > 0) {
                  const fileLinks = msg.files.map((f: any) =>
                    `[FILE: ${f.name} - ${f.permalink}]`
                  ).join(' ');
                  messageText += ` ${fileLinks}`;
                }

                let fullMessage = '';
                if (msg.user) {
                  const userInfo = await this.slackClient.users.info({ user: msg.user });
                  const userName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown';
                  const timestamp = new Date(parseFloat(msg.ts) * 1000).toLocaleString();
                  fullMessage = `[${timestamp}] ${userName}: ${messageText}`;
                } else {
                  fullMessage = `[${new Date(parseFloat(msg.ts) * 1000).toLocaleString()}] ${messageText}`;
                }

                // Add thread replies if present
                if (msg.thread_replies && msg.thread_replies.length > 0) {
                  const threadReplies = await Promise.all(
                    msg.thread_replies.map(async (reply: any) => {
                      if (reply.user) {
                        const userInfo = await this.slackClient.users.info({ user: reply.user });
                        const userName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown';
                        const timestamp = new Date(parseFloat(reply.ts) * 1000).toLocaleString();
                        return `    ↳ [${timestamp}] ${userName}: ${reply.text || '(no text)'}`;
                      }
                      return `    ↳ ${reply.text || '(no text)'}`;
                    })
                  );
                  fullMessage += '\n' + threadReplies.join('\n');
                }

                return fullMessage;
              } catch (error) {
                return msg.text || '(no text)';
              }
            })
        );

        channelData.push({
          id: channel.id,
          name: channel.name,
          priority: channel.priority,
          category: channel.category,
          messageCount: enrichedMessages.length,
          messages: enrichedMessages.reverse() // chronological order
        });

        console.log(`      ✅ ${enrichedMessages.length} messages`);

      } catch (error: any) {
        console.error(`      ❌ Error fetching ${channel.name}:`, error);
        const errorMsg = error?.data?.error || error?.message || 'Unknown error';
        if (errorMsg === 'not_in_channel') {
          errors.push(`Bot not in #${channel.name} - add with: /invite @slack_mcp`);
        } else {
          errors.push(`Error fetching #${channel.name}: ${errorMsg}`);
        }
      }
    }

    if (channelData.length === 0 && errors.length > 0) {
      throw new Error(`Channel access errors:\n${errors.join('\n')}`);
    }

    if (channelData.length === 0) {
      return {
        summary: 'No new messages in monitored channels.',
        channelUpdates: [],
        requiresAttention: [],
        canIgnore: []
      };
    }

    console.log(`\n🤖 Analyzing with Claude...\n`);

    // Format channel data for Claude
    const channelDataText = channelData.map(ch => {
      return `\n## #${ch.name} (${ch.priority} priority, ${ch.category})\n` +
             `Messages: ${ch.messageCount}\n\n` +
             ch.messages.join('\n');
    }).join('\n\n---\n');

    // Call Claude API
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: `You are analyzing Slack channel activity for Rachel Wolan (CPO at Webflow).

TIME RANGE: ${timeRange}
CHANNELS: ${channelData.length}

Focus ONLY on what requires Rachel's attention:
- Direct asks/questions for her
- Decisions she needs to make
- Critical blockers
- Strategic alignment issues
- Documents shared (if any, note them for summary)

CRITICAL: Thread replies are shown with "↳".

WHEN SUMMARIZING MESSAGES:
1. ALWAYS summarize the ORIGINAL parent message (what was asked/shared)
2. Use thread replies ONLY to determine if Rachel already responded
3. If Rachel already responded in thread, mark as low priority (🟢) BUT still summarize the original message content
4. NEVER summarize Rachel's response as the key update - summarize what was originally asked of her

Skip everything else. Be extremely concise.

For each channel with important content:
- 1-2 bullet key updates MAX - these should describe the ORIGINAL message/ask, not Rachel's response
- Action items ONLY if Rachel still needs to do something (check thread replies first!)
- If a document/file is shared, include the link in the key update
- Blockers ONLY if critical

Assign priority:
- high (🔴): Needs Rachel's action today
- medium (🟡): Important, awaiting others
- low (🟢): Already handled or FYI only

Executive summary: 1-2 sentences max on what needs her attention NOW.

Format as JSON:
{
  "summary": "executive summary text",
  "channelUpdates": [
    {
      "channelId": "C123",
      "channelName": "channel-name",
      "priority": "high|medium|low",
      "messageCount": 10,
      "keyUpdates": ["update 1", "update 2"],
      "actionItems": ["action 1"],
      "decisions": ["decision 1"],
      "blockers": ["blocker 1"]
    }
  ],
  "requiresAttention": ["#channel-name"],
  "canIgnore": ["#channel-name"]
}`,
      messages: [
        {
          role: 'user',
          content: `CHANNEL DATA:\n${channelDataText}`
        }
      ]
    });

    // Parse Claude's response
    const replyText = response.content[0].type === 'text'
      ? response.content[0].text
      : '{}';

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = replyText;
    const jsonMatch = replyText.match(/```json\n([\s\S]+?)\n```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const result: TriageResult = JSON.parse(jsonText);

    // Log results
    const timestamp = new Date().toISOString();
    const logPath = path.join(process.cwd(), 'logs', `triage-${timestamp}.json`);

    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, JSON.stringify({
      timestamp,
      timeRange,
      channelCount: channelData.length,
      result
    }, null, 2));

    console.log(`✅ Triage complete. Log saved to ${logPath}\n`);

    return result;
  }

  private calculateOldestTimestamp(now: number, timeRange: string): number {
    const match = timeRange.match(/^(\d+)([hmd])$/);
    if (!match) {
      // Default to 4 hours
      return now - (4 * 60 * 60);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'h':
        return now - (value * 60 * 60);
      case 'd':
        return now - (value * 24 * 60 * 60);
      case 'm':
        return now - (value * 60);
      default:
        return now - (4 * 60 * 60);
    }
  }

  formatForSlack(result: TriageResult): any[] {
    const blocks: any[] = [];

    // Summary header
    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📊 Channel Triage Summary',
        emoji: true
      }
    });

    // Executive summary
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: result.summary
      }
    });

    blocks.push({ type: 'divider' });

    // Channel updates - only show channels with content
    for (const update of result.channelUpdates) {
      const checkbox = update.priority === 'low' ? '✅' : '☐';

      // Build compact channel section
      let channelText = `${checkbox} *#${update.channelName}* (${update.messageCount})`;

      if (update.keyUpdates.length > 0) {
        channelText += `\n${update.keyUpdates.map(u => `• ${u}`).join('\n')}`;
      }

      if (update.actionItems.length > 0) {
        channelText += `\n\n*Action:* ${update.actionItems.join('; ')}`;
      }

      if (update.blockers.length > 0) {
        channelText += `\n\n*Blocker:* ${update.blockers.join('; ')}`;
      }

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: channelText
        }
      });
    }

    // Footer
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `🤖 _Claude Sonnet 4.5 • Generated at ${new Date().toLocaleString()}_`
        }
      ]
    });

    return blocks;
  }
}
