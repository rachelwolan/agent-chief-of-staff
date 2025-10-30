import { GmailService } from './packages/core/src/services/gmail.js';
import 'dotenv/config';

async function cleanupCalendarEmails() {
  console.log('\n🧹 Calendar Email Cleanup Tool\n');
  console.log('This will archive ALL calendar notification emails in your inbox');
  console.log('(Accepted, Declined, Updated invitation, Synced invitation, Canceled event)\n');

  const gmailService = new GmailService('work');

  if (!gmailService.isAuthenticated()) {
    console.error('❌ Work Gmail not authenticated. Run: npm run email:auth');
    process.exit(1);
  }

  // Patterns to search for
  const searchPatterns = [
    'subject:Accepted:',
    'subject:"Declined:"',
    'subject:"Updated invitation"',
    'subject:"Synced invitation"',
    'subject:"Canceled event"',
    'subject:"Tentatively Accepted"'
  ];

  console.log('🔍 Searching for calendar notification emails...\n');

  let totalArchived = 0;

  for (const pattern of searchPatterns) {
    try {
      console.log(`\n📋 Searching: ${pattern}`);

      // Use Gmail search to find emails matching the pattern in inbox
      const auth = gmailService['getOAuth2Client']();
      const { google } = await import('googleapis');
      const gmail = google.gmail({ version: 'v1', auth });

      const response = await gmail.users.messages.list({
        userId: 'me',
        q: `in:inbox ${pattern}`,
        maxResults: 500
      });

      const messages = response.data.messages || [];

      if (messages.length === 0) {
        console.log(`   ✅ No emails found`);
        continue;
      }

      console.log(`   📧 Found ${messages.length} emails`);

      // Archive them
      const messageIds = messages.map(m => m.id!);

      console.log(`   📥 Archiving...`);
      await gmailService.archiveMessages(messageIds);

      totalArchived += messages.length;

    } catch (error) {
      console.error(`   ❌ Error: ${(error as Error).message}`);
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log(`\n✅ Cleanup complete!`);
  console.log(`📊 Total emails archived: ${totalArchived}\n`);
}

cleanupCalendarEmails().catch(console.error);
