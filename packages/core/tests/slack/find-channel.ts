import { WebClient } from '@slack/web-api';
import 'dotenv/config';

const channelName = process.argv[2] || 'ashwini-rachel';
const client = new WebClient(process.env.SLACK_BOT_TOKEN);

async function findChannel() {
  const usersResponse = await client.users.list();
  const rachel = (usersResponse.members as any[]).find((u: any) =>
    u.profile?.email?.includes('rachel') || u.name?.toLowerCase().includes('rachel')
  );

  const response = await client.users.conversations({
    user: rachel.id,
    types: 'public_channel,private_channel',
    limit: 1000,
    exclude_archived: true
  });

  const channel = (response.channels as any[]).find((ch: any) =>
    ch.name === channelName
  );

  if (channel) {
    console.log(`Found: #${channel.name} (${channel.id})`);
  } else {
    console.log(`Not found: ${channelName}`);
  }
}

findChannel();
