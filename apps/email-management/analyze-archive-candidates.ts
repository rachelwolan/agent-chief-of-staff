import { GmailService } from './packages/core/src/services/gmail.js';
import 'dotenv/config';

interface ArchiveRecommendation {
  id: string;
  from: string;
  subject: string;
  date: string;
  isRead: boolean;
  category: 'calendar-notification' | 'marketing' | 'newsletter' | 'informational' | 'actionable';
  shouldArchive: boolean;
  reason: string;
}

async function analyzeArchiveCandidates() {
  console.log('\n📊 Analyzing Last 100 Emails for Archive Recommendations\n');

  const gmailService = new GmailService('work');

  if (!gmailService.isAuthenticated()) {
    console.error('❌ Work Gmail not authenticated. Run: npm run email:auth');
    process.exit(1);
  }

  console.log('📬 Fetching emails from inbox...\n');

  try {
    const auth = gmailService['getOAuth2Client']();
    const { google } = await import('googleapis');
    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'in:inbox',
      maxResults: 100
    });

    const messages = response.data.messages || [];

    if (messages.length === 0) {
      console.log('✅ No emails found in inbox.');
      return;
    }

    console.log(`Found ${messages.length} emails. Analyzing...\n`);

    const recommendations: ArchiveRecommendation[] = [];
    const archiveCandidates: ArchiveRecommendation[] = [];
    const keepInInbox: ArchiveRecommendation[] = [];

    // Calendar notification patterns
    const calendarPatterns = [
      /^Accepted:/i,
      /^Declined:/i,
      /^Updated invitation/i,
      /^Synced invitation/i,
      /^Canceled event/i,
      /^Tentatively Accepted/i
    ];

    // Marketing/newsletter indicators
    const marketingIndicators = [
      /unsubscribe/i,
      /newsletter/i,
      /promotional/i,
      /noreply@/i,
      /no-reply@/i,
      /marketing@/i,
      /promo@/i
    ];

    for (const message of messages) {
      try {
        const details = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full'
        });

        const headers = details.data.payload?.headers || [];
        const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');
        const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');
        const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date');

        const subject = subjectHeader?.value || 'No subject';
        const from = fromHeader?.value || 'Unknown';
        const date = dateHeader?.value || '';

        // Check if read
        const labels = details.data.labelIds || [];
        const isRead = !labels.includes('UNREAD');

        // Extract body
        let body = '';
        if (details.data.payload?.body?.data) {
          body = Buffer.from(details.data.payload.body.data, 'base64').toString('utf-8');
        } else if (details.data.payload?.parts) {
          for (const part of details.data.payload.parts) {
            if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
              if (part.body?.data) {
                body += Buffer.from(part.body.data, 'base64').toString('utf-8');
              }
            }
          }
        }

        let category: ArchiveRecommendation['category'] = 'actionable';
        let shouldArchive = false;
        let reason = '';

        // Check calendar notifications
        if (calendarPatterns.some(pattern => pattern.test(subject))) {
          category = 'calendar-notification';
          shouldArchive = true;
          reason = 'Calendar notification email (informational only)';
        }
        // Check marketing/newsletters
        else if (marketingIndicators.some(indicator => indicator.test(from) || indicator.test(body))) {
          category = 'marketing';
          shouldArchive = isRead; // Archive if already read
          reason = isRead ? 'Marketing/newsletter email (already read)' : 'Marketing/newsletter email (unread - review first)';
        }
        // Check if it's from a no-reply address and already read
        else if (from.toLowerCase().includes('noreply') && isRead) {
          category = 'informational';
          shouldArchive = true;
          reason = 'No-reply informational email (already read)';
        }
        // Event invitations (Luma, etc.) that are already read
        else if ((from.includes('luma') || from.includes('calendar')) && isRead) {
          category = 'informational';
          shouldArchive = true;
          reason = 'Event invitation (already read)';
        }
        // Keep actionable emails
        else {
          category = 'actionable';
          shouldArchive = false;
          reason = 'Potentially actionable - keep in inbox';
        }

        const recommendation: ArchiveRecommendation = {
          id: details.data.id || '',
          from,
          subject,
          date,
          isRead,
          category,
          shouldArchive,
          reason
        };

        recommendations.push(recommendation);

        if (shouldArchive) {
          archiveCandidates.push(recommendation);
        } else {
          keepInInbox.push(recommendation);
        }

      } catch (error) {
        console.error(`❌ Error analyzing email ${message.id}: ${(error as Error).message}`);
      }
    }

    console.log('═'.repeat(80));
    console.log(`\n✅ Analysis Complete!`);
    console.log(`\n📊 Summary:`);
    console.log(`   Total emails analyzed: ${recommendations.length}`);
    console.log(`   📥 Recommend archiving: ${archiveCandidates.length}`);
    console.log(`   📌 Keep in inbox: ${keepInInbox.length}`);

    // Group archive candidates by category
    const calendarNotifications = archiveCandidates.filter(r => r.category === 'calendar-notification');
    const marketing = archiveCandidates.filter(r => r.category === 'marketing');
    const informational = archiveCandidates.filter(r => r.category === 'informational');

    console.log(`\n📂 Archive Candidates by Category:`);
    console.log(`   📅 Calendar notifications: ${calendarNotifications.length}`);
    console.log(`   📧 Marketing/newsletters: ${marketing.length}`);
    console.log(`   ℹ️  Informational: ${informational.length}`);

    if (archiveCandidates.length > 0) {
      console.log(`\n\n📥 RECOMMENDED TO ARCHIVE (${archiveCandidates.length} emails):`);
      console.log('═'.repeat(80));

      for (const email of archiveCandidates) {
        console.log(`\n[${email.category.toUpperCase()}]`);
        console.log(`FROM: ${email.from}`);
        console.log(`SUBJECT: ${email.subject}`);
        console.log(`DATE: ${email.date}`);
        console.log(`STATUS: ${email.isRead ? 'Read' : 'Unread'}`);
        console.log(`REASON: ${email.reason}`);
        console.log('─'.repeat(80));
      }

      console.log(`\n\n💡 To archive these ${archiveCandidates.length} emails, you can:`);
      console.log(`   1. Run the calendar cleanup: npm run email:cleanup`);
      console.log(`   2. Manually archive marketing emails after reviewing`);
      console.log(`   3. Use the categorizer to auto-process: npm run email:categorize`);
    }

    if (keepInInbox.length > 0 && keepInInbox.length <= 20) {
      console.log(`\n\n📌 KEEP IN INBOX (${keepInInbox.length} emails):`);
      console.log('═'.repeat(80));

      for (const email of keepInInbox) {
        console.log(`\nFROM: ${email.from}`);
        console.log(`SUBJECT: ${email.subject}`);
        console.log(`DATE: ${email.date}`);
        console.log(`STATUS: ${email.isRead ? 'Read' : 'Unread'}`);
        console.log(`REASON: ${email.reason}`);
        console.log('─'.repeat(80));
      }
    } else if (keepInInbox.length > 20) {
      console.log(`\n\n📌 KEEP IN INBOX: ${keepInInbox.length} emails (list too long to display)`);
    }

  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

analyzeArchiveCandidates().catch(console.error);
