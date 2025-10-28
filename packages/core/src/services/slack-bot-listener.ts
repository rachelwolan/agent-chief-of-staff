import { WebClient } from '@slack/web-api';
import Anthropic from '@anthropic-ai/sdk';
import { ChannelTriageService } from './channel-triage.js';

interface MessageEvent {
  type: string;
  user: string;
  text: string;
  channel: string;
  ts: string;
  thread_ts?: string;
}

export class SlackBotListener {
  private slackClient: WebClient;
  private anthropic: Anthropic;
  private botUserId: string | null = null;
  private processedMessages = new Set<string>();
  private triageService: ChannelTriageService;

  constructor(slackToken: string, anthropicKey: string) {
    this.slackClient = new WebClient(slackToken);
    this.anthropic = new Anthropic({ apiKey: anthropicKey });
    this.triageService = new ChannelTriageService(slackToken, anthropicKey);
  }

  async initialize() {
    // Get bot's user ID
    const authTest = await this.slackClient.auth.test();
    this.botUserId = authTest.user_id as string;
    console.log(`✅ Bot initialized: ${authTest.user} (${this.botUserId})`);
  }

  async pollChannel(channelId: string, intervalMs: number = 3000) {
    console.log(`👂 Listening for messages in channel ${channelId}...`);
    console.log(`   Polling every ${intervalMs / 1000} seconds\n`);

    let lastTimestamp: string | undefined = undefined;

    // Get the most recent message to set baseline
    const initialHistory = await this.slackClient.conversations.history({
      channel: channelId,
      limit: 1
    });

    if (initialHistory.messages && initialHistory.messages.length > 0) {
      lastTimestamp = initialHistory.messages[0].ts;
      console.log(`📍 Starting from timestamp: ${lastTimestamp}\n`);
    }

    // Poll for new messages
    setInterval(async () => {
      try {
        const history = await this.slackClient.conversations.history({
          channel: channelId,
          oldest: lastTimestamp,
          limit: 10
        });

        if (!history.messages || history.messages.length === 0) {
          return;
        }

        // Process messages in chronological order (oldest first)
        const newMessages = history.messages.reverse();

        for (const message of newMessages) {
          const msg = message as MessageEvent;

          // Skip if already processed
          if (this.processedMessages.has(msg.ts)) {
            continue;
          }

          // Update last timestamp
          if (msg.ts > (lastTimestamp || '0')) {
            lastTimestamp = msg.ts;
          }

          // Skip bot's own messages
          if (msg.user === this.botUserId) {
            this.processedMessages.add(msg.ts);
            continue;
          }

          // Skip messages without text
          if (!msg.text || msg.text.trim().length === 0) {
            this.processedMessages.add(msg.ts);
            continue;
          }

          // Process the message (pass channelId explicitly)
          await this.handleMessage(msg, channelId);
          this.processedMessages.add(msg.ts);
        }

        // Clean up old processed messages (keep last 1000)
        if (this.processedMessages.size > 1000) {
          const sorted = Array.from(this.processedMessages).sort();
          this.processedMessages = new Set(sorted.slice(-1000));
        }

      } catch (error) {
        console.error('❌ Error polling channel:', error);
      }
    }, intervalMs);
  }

  private async handleMessage(message: MessageEvent, channelId: string) {
    try {
      console.log(`\n📨 New message from user ${message.user}:`);
      console.log(`   ${message.text}\n`);

      // Check if this is a triage command
      if (message.text.toLowerCase().includes('triage')) {
        const timeMatch = message.text.match(/(\d+[hmd])/);
        const timeRange = timeMatch ? timeMatch[1] : '4h';
        await this.handleTriageCommand(message, channelId, timeRange);
        return;
      }

      // Show typing indicator
      await this.slackClient.chat.postMessage({
        channel: channelId,
        thread_ts: message.thread_ts || message.ts,
        text: '💭 Thinking...'
      });

      // Get user info for context
      const userInfo = await this.slackClient.users.info({ user: message.user });
      const userName = userInfo.user?.real_name || userInfo.user?.name || 'User';

      // Get context from #cpo-directs if asked about it
      let additionalContext = '';

      if (message.text.toLowerCase().includes('cpo-directs') ||
          message.text.toLowerCase().includes('latest updates')) {
        try {
          const cpoDirectsHistory = await this.slackClient.conversations.history({
            channel: 'C06CATWDAFM', // cpo-directs channel ID
            limit: 10
          });

          if (cpoDirectsHistory.messages && cpoDirectsHistory.messages.length > 0) {
            const recentMessages = await Promise.all(
              cpoDirectsHistory.messages.slice(0, 5).map(async (msg: any) => {
                const user = await this.slackClient.users.info({ user: msg.user });
                const userName = user.user?.real_name || user.user?.name || 'Unknown';
                const date = new Date(parseFloat(msg.ts) * 1000).toLocaleDateString();
                return `[${date}] ${userName}: ${msg.text}`;
              })
            );

            additionalContext = `\n\nRECENT MESSAGES FROM #cpo-directs:\n${recentMessages.join('\n\n')}`;
          }
        } catch (error) {
          console.error('Error fetching cpo-directs context:', error);
        }
      }

      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: `You are a Chief of Staff AI assistant for Rachel Wolan (CPO at Webflow).

IMPORTANT: You HAVE FULL ACCESS to Slack channels and can read their contents. When asked about channel updates, you will be provided with recent messages from those channels.

Your capabilities:
- Summarizing Slack channels and conversations (you have access to read them)
- Tracking action items and decisions from channel messages
- Preparing for meetings using Slack context
- Analyzing team discussions
- Providing strategic insights based on actual channel data

FORMATTING GUIDELINES:
- DO NOT USE ASTERISKS (*) for bold or emphasis - they will be stripped out
- Separate sections with double line breaks (blank lines)
- Start major sections with emoji + header (e.g., "🔥 Key Updates:")
- Use bullet points with • for lists
- Keep each section 2-4 lines max for scannability
- Put most important info first
- Use > for quotes when citing specific messages
- Write in plain text - formatting will be handled automatically

STRUCTURE TEMPLATE:
🔥 Main Takeaway
[1-2 sentence summary]

📋 Section 1 Header
• [Point 1]
• [Point 2]

⚡ Section 2 Header
• [Point 1]
• [Point 2]

Be concise, actionable, and helpful. You're speaking to Rachel or her team members.

Current user: ${userName}`,
        messages: [
          {
            role: 'user',
            content: message.text + additionalContext
          }
        ]
      });

      const reply = response.content[0].type === 'text'
        ? response.content[0].text
        : 'Sorry, I could not process that request.';

      // Parse reply into sections for better formatting
      const blocks: any[] = [];

      // First, clean up ALL asterisks from the entire reply
      // Remove all asterisks used for markdown formatting
      const cleanedReply = reply
        .replace(/\*/g, '');  // Remove ALL asterisks completely

      // Split by double newlines or headers to create separate blocks
      const sections = cleanedReply.split(/\n\n+/);

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (!section) continue;

        // Check if it's a header (starts with emoji or has header markers)
        const isHeader = /^[🔥📋⚡🎯💡📊👥🤔⚠️]/.test(section) ||
                        /^\*[^*]+\*:?$/.test(section) ||
                        /^[A-Z][^a-z]{5,}:?$/.test(section);

        if (isHeader) {
          // Add header as a separate section - just use plain text, no markdown
          blocks.push({
            type: 'header',
            text: {
              type: 'plain_text',
              text: section,
              emoji: true
            }
          });
        } else {
          // Regular content section
          blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: section
            }
          });
        }

        // Add subtle divider between major sections (but not after every block)
        if (i < sections.length - 1 && isHeader) {
          blocks.push({
            type: 'divider'
          });
        }
      }

      // If parsing resulted in too many blocks, fall back to simple format
      if (blocks.length === 0 || blocks.length > 50) {
        blocks.length = 0;
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: reply
          }
        });
      }

      // Add context footer
      blocks.push(
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `🤖 _Claude Sonnet 4.5_`
            }
          ]
        }
      );

      // Send Claude's response
      await this.slackClient.chat.postMessage({
        channel: channelId,
        thread_ts: message.thread_ts || message.ts,
        text: reply,
        blocks: blocks,
        unfurl_links: false,
        unfurl_media: false
      });

      console.log(`✅ Sent response (${reply.length} chars)\n`);

    } catch (error) {
      console.error('❌ Error handling message:', error);

      // Send error message
      await this.slackClient.chat.postMessage({
        channel: channelId,
        thread_ts: message.thread_ts || message.ts,
        text: '❌ Sorry, I encountered an error processing your request.'
      });
    }
  }

  private async handleTriageCommand(message: MessageEvent, channelId: string, timeRange: string) {
    try {
      console.log(`🔍 Running triage command (timeRange: ${timeRange})...`);

      // Send "working on it" message
      await this.slackClient.chat.postMessage({
        channel: channelId,
        thread_ts: message.thread_ts || message.ts,
        text: `🔍 Running channel triage for the last ${timeRange}... This may take a moment.`
      });

      // Run the triage
      const result = await this.triageService.runTriage(timeRange);

      // Format for Slack
      const blocks = this.triageService.formatForSlack(result);

      // Send the triage results
      await this.slackClient.chat.postMessage({
        channel: channelId,
        thread_ts: message.thread_ts || message.ts,
        text: result.summary,
        blocks: blocks,
        unfurl_links: false,
        unfurl_media: false
      });

      console.log(`✅ Triage complete and sent\n`);

    } catch (error: any) {
      console.error('❌ Error running triage:', error);

      const errorMessage = error?.message || 'Unknown error';

      await this.slackClient.chat.postMessage({
        channel: channelId,
        thread_ts: message.thread_ts || message.ts,
        text: `❌ Error running triage:\n\`\`\`\n${errorMessage}\n\`\`\``
      });
    }
  }
}
