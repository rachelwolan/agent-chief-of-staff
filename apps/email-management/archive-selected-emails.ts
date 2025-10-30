import { GmailService } from './packages/core/src/services/gmail.js';
import 'dotenv/config';

async function archiveSelectedEmails() {
  console.log('\n📥 Archiving Selected Emails\n');

  const gmailService = new GmailService('work');

  if (!gmailService.isAuthenticated()) {
    console.error('❌ Work Gmail not authenticated. Run: npm run email:auth');
    process.exit(1);
  }

  // Email IDs and subjects to archive (from the analysis, excluding Braintrust "approved")
  const emailsToArchive = [
    { subject: 'Zoom meeting is rescheduled - Dmitry Shapiro', from: 'no-reply@zoom.us' },
    { subject: 'Registration pending approval for Formula 1 with Braintrust', from: 'braintrustdata@calendar.luma-mail.com' },
    { subject: 'Vibe coding internal tools on your production data', from: 'info@retool.com' },
    { subject: 'Rachel:Linda 1:1 - no', from: 'comments-noreply@docs.google.com' },
    { subject: 'Rachel:Linda 1:1 - Let\'s sync on 4.0 at some point', from: 'comments-noreply@docs.google.com' },
    { subject: 'Rachel\'s Loom Notetaker has joined your meeting', from: 'no-reply@zoom.us' },
    { subject: 'Document shared with you: "Research Proposal', from: 'drive-shares-dm-noreply@google.com' },
    { subject: 'Self Serve Busine... - What type?', from: 'comments-noreply@docs.google.com' },
    { subject: 'Spreadsheet shared with you: "P&P 4', from: 'drive-shares-dm-noreply@google.com' },
    { subject: 'FY27 DS Financial Forecast: Self-Serve Updates', from: 'comments-noreply@docs.google.com' },
    { subject: 'FY27 DS Financial... - @ashwini.chaube', from: 'comments-noreply@docs.google.com' },
    { subject: 'Next-Gen CMS/ Nov... - Where can I see competitive', from: 'comments-noreply@docs.google.com' },
    { subject: 'Self-Serve - State of the Business Slides', from: 'comments-noreply@docs.google.com' },
    { subject: 'FY27 Target Setting: Self-Serve Updates', from: 'comments-noreply@docs.google.com' },
    { subject: 'Presentation shared with you: "Self-Serve', from: 'drive-shares-dm-noreply@google.com' },
    { subject: 'Build a voice agent for your email', from: 'jacob@send.relay.app' },
    { subject: 'Document shared with you: "Upside from Direct Price Increases"', from: 'drive-shares-dm-noreply@google.com' }
  ];

  try {
    const auth = gmailService['getOAuth2Client']();
    const { google } = await import('googleapis');
    const gmail = google.gmail({ version: 'v1', auth });

    // Get last 100 emails from inbox
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'in:inbox',
      maxResults: 100
    });

    const messages = response.data.messages || [];
    const messageIdsToArchive: string[] = [];

    console.log('🔍 Finding emails to archive...\n');

    for (const message of messages) {
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full'
      });

      const headers = details.data.payload?.headers || [];
      const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');
      const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');

      const subject = subjectHeader?.value || '';
      const from = fromHeader?.value || '';

      // Check if this email should be archived
      // Exclude the Braintrust "approved" email, archive everything else including "pending"
      if (from.includes('braintrustdata@calendar.luma-mail.com')) {
        if (subject.includes('pending approval')) {
          messageIdsToArchive.push(message.id!);
          console.log(`✓ Will archive: ${subject}`);
        } else if (subject.includes('approved')) {
          console.log(`✗ Keeping: ${subject}`);
        }
      }
      // Archive read Google Workspace notifications
      else if (
        (from.includes('comments-noreply@docs.google.com') ||
         from.includes('drive-shares-dm-noreply@google.com')) &&
        details.data.labelIds && !details.data.labelIds.includes('UNREAD')
      ) {
        messageIdsToArchive.push(message.id!);
        console.log(`✓ Will archive: ${subject.substring(0, 60)}...`);
      }
      // Archive read Zoom notifications
      else if (from.includes('no-reply@zoom.us') &&
               details.data.labelIds && !details.data.labelIds.includes('UNREAD')) {
        messageIdsToArchive.push(message.id!);
        console.log(`✓ Will archive: ${subject.substring(0, 60)}...`);
      }
      // Archive Retool marketing
      else if (from.includes('info@retool.com') &&
               details.data.labelIds && !details.data.labelIds.includes('UNREAD')) {
        messageIdsToArchive.push(message.id!);
        console.log(`✓ Will archive: ${subject.substring(0, 60)}...`);
      }
      // Archive Relay.app marketing
      else if (from.includes('jacob@send.relay.app') &&
               details.data.labelIds && !details.data.labelIds.includes('UNREAD')) {
        messageIdsToArchive.push(message.id!);
        console.log(`✓ Will archive: ${subject.substring(0, 60)}...`);
      }
    }

    if (messageIdsToArchive.length === 0) {
      console.log('\n✅ No emails to archive.');
      return;
    }

    console.log(`\n📥 Archiving ${messageIdsToArchive.length} emails...\n`);

    await gmailService.archiveMessages(messageIdsToArchive);

    console.log(`\n✅ Successfully archived ${messageIdsToArchive.length} emails!`);

  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

archiveSelectedEmails().catch(console.error);
