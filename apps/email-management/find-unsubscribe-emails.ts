import { GmailService } from './packages/core/src/services/gmail.js';
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

interface EmailWithUnsubscribe {
  id: string;
  from: string;
  subject: string;
  date: string;
  unsubscribeLinks: string[];
  hasUnsubscribeText: boolean;
}

async function findUnsubscribeEmails() {
  console.log('\n🔍 Finding Emails with Unsubscribe Options\n');

  const gmailService = new GmailService('work');

  if (!gmailService.isAuthenticated()) {
    console.error('❌ Work Gmail not authenticated. Run: npm run email:auth');
    process.exit(1);
  }

  console.log('📬 Fetching emails from inbox...\n');

  try {
    // Get emails from inbox (both read and unread)
    const auth = gmailService['getOAuth2Client']();
    const { google } = await import('googleapis');
    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'in:inbox',
      maxResults: 500
    });

    const messages = response.data.messages || [];

    if (messages.length === 0) {
      console.log('✅ No emails found in inbox.');
      return;
    }

    console.log(`Found ${messages.length} emails. Analyzing for unsubscribe options...\n`);
    console.log('═'.repeat(80));

    const emailsWithUnsubscribe: EmailWithUnsubscribe[] = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (i % 10 === 0) {
        console.log(`\n📊 Progress: ${i}/${messages.length} emails analyzed...`);
      }

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

        // Check for unsubscribe text
        const hasUnsubscribeText = /unsubscribe/i.test(body);

        // Extract unsubscribe links
        const urlRegex = /(https?:\/\/[^\s<>"]+unsubscribe[^\s<>"]*)/gi;
        const unsubscribeLinks = body.match(urlRegex) || [];

        if (hasUnsubscribeText || unsubscribeLinks.length > 0) {
          emailsWithUnsubscribe.push({
            id: details.data.id || '',
            from: fromHeader?.value || 'Unknown',
            subject: subjectHeader?.value || 'No subject',
            date: dateHeader?.value || '',
            unsubscribeLinks: [...new Set(unsubscribeLinks)], // Deduplicate
            hasUnsubscribeText
          });
        }

      } catch (error) {
        console.error(`❌ Error analyzing email ${message.id}: ${(error as Error).message}`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`\n✅ Analysis complete!`);
    console.log(`📊 Found ${emailsWithUnsubscribe.length} emails with unsubscribe options\n`);

    if (emailsWithUnsubscribe.length > 0) {
      console.log('📧 Emails with Unsubscribe Options:\n');

      for (const email of emailsWithUnsubscribe) {
        console.log(`FROM: ${email.from}`);
        console.log(`SUBJECT: ${email.subject}`);
        console.log(`DATE: ${email.date}`);
        if (email.unsubscribeLinks.length > 0) {
          console.log(`UNSUBSCRIBE LINKS: ${email.unsubscribeLinks.length} found`);
          email.unsubscribeLinks.forEach(link => console.log(`   - ${link}`));
        }
        console.log('─'.repeat(80));
      }

      // Save to file
      const outputDir = path.join(process.cwd(), 'analysis');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputFile = path.join(outputDir, `unsubscribe-emails-${new Date().toISOString().split('T')[0]}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(emailsWithUnsubscribe, null, 2));

      console.log(`\n📄 Full list saved to: ${outputFile}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

findUnsubscribeEmails().catch(console.error);
