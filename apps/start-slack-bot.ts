import { SlackBotListener } from '../packages/core/src/services/slack-bot-listener.js';
import 'dotenv/config';

async function startBot() {
  const slackToken = process.env.SLACK_BOT_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!slackToken) {
    console.error('❌ SLACK_BOT_TOKEN not found in environment');
    process.exit(1);
  }

  if (!anthropicKey) {
    console.error('❌ ANTHROPIC_API_KEY not found in environment');
    process.exit(1);
  }

  console.log('🚀 Starting Slack Bot Listener...\n');

  const bot = new SlackBotListener(slackToken, anthropicKey);
  await bot.initialize();

  // Listen to rachels-mcp channel
  const channelId = 'C09KKS59Q83';

  console.log('📍 Monitoring channel: C09KKS59Q83 (rachels-mcp)');
  console.log('💬 Send messages in the channel and I\'ll respond!\n');
  console.log('Press Ctrl+C to stop\n');
  console.log('═'.repeat(60));

  await bot.pollChannel(channelId, 3000); // Poll every 3 seconds
}

startBot().catch(console.error);
