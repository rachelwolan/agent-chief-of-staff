import { WebClient } from '@slack/web-api';
import 'dotenv/config';

async function testCpoDirects() {
  const client = new WebClient(process.env.SLACK_BOT_TOKEN);

  console.log('Testing #cpo-directs access...\n');

  try {
    // Test 1: Can we see the channel?
    const channelInfo = await client.conversations.info({
      channel: 'C06CATWDAFM'
    });

    console.log('✅ Channel info retrieved:');
    console.log(`   Name: #${channelInfo.channel?.name}`);
    console.log(`   Members: ${channelInfo.channel?.num_members}`);
    console.log(`   Is member: ${channelInfo.channel?.is_member}`);
    console.log('');

    // Test 2: Fetch recent history (no time filter)
    const history = await client.conversations.history({
      channel: 'C06CATWDAFM',
      limit: 10
    });

    console.log(`✅ Found ${history.messages?.length || 0} recent messages\n`);

    if (history.messages && history.messages.length > 0) {
      for (const msg of history.messages.slice(0, 3)) {
        const ts = parseFloat(msg.ts || '0');
        const date = new Date(ts * 1000);
        console.log(`   [${date.toLocaleString()}] ${msg.text?.substring(0, 100)}`);
      }
    }

    // Test 3: Check specific time range
    const now = Date.now() / 1000;
    const twelveHoursAgo = now - (12 * 60 * 60);

    console.log(`\n🔍 Searching for messages in last 12 hours...`);
    console.log(`   After: ${new Date(twelveHoursAgo * 1000).toLocaleString()}`);

    const recentHistory = await client.conversations.history({
      channel: 'C06CATWDAFM',
      oldest: twelveHoursAgo.toString(),
      limit: 50
    });

    console.log(`   Found: ${recentHistory.messages?.length || 0} messages\n`);

    if (recentHistory.messages && recentHistory.messages.length > 0) {
      for (const msg of recentHistory.messages) {
        const ts = parseFloat(msg.ts || '0');
        const date = new Date(ts * 1000);
        const user = await client.users.info({ user: msg.user || '' });
        const userName = user.user?.real_name || user.user?.name || 'Unknown';
        console.log(`   [${date.toLocaleString()}] ${userName}: ${msg.text?.substring(0, 80)}`);
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.data?.error || error.message);
  }
}

testCpoDirects();
