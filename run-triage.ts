import { ChannelTriageService } from './packages/core/src/services/channel-triage.js';
import 'dotenv/config';

async function runTriage() {
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

  const service = new ChannelTriageService(slackToken, anthropicKey);
  const timeRange = process.argv[2] || '24h';
  const result = await service.runTriage(timeRange);

  console.log('\n\n📊 TRIAGE RESULTS');
  console.log('═'.repeat(80));
  console.log(`\n${result.summary}\n`);

  if (result.requiresAttention.length > 0) {
    console.log('\n🔴 REQUIRES ATTENTION:');
    result.requiresAttention.forEach(ch => console.log(`   - ${ch}`));
  }

  if (result.canIgnore.length > 0) {
    console.log('\n✅ CAN IGNORE:');
    result.canIgnore.forEach(ch => console.log(`   - ${ch}`));
  }

  console.log('\n\n📝 CHANNEL DETAILS');
  console.log('═'.repeat(80));

  for (const update of result.channelUpdates) {
    console.log(`\n#${update.channelName} (${update.priority.toUpperCase()} priority)`);
    console.log(`Messages: ${update.messageCount}`);

    if (update.keyUpdates.length > 0) {
      console.log('\nKey Updates:');
      update.keyUpdates.forEach(u => console.log(`  • ${u}`));
    }

    if (update.actionItems.length > 0) {
      console.log('\nAction Items:');
      update.actionItems.forEach(a => console.log(`  ⚡ ${a}`));
    }

    if (update.decisions.length > 0) {
      console.log('\nDecisions:');
      update.decisions.forEach(d => console.log(`  ✓ ${d}`));
    }

    if (update.blockers.length > 0) {
      console.log('\n Blockers:');
      update.blockers.forEach(b => console.log(`  🚧 ${b}`));
    }
  }
}

runTriage().catch(console.error);
