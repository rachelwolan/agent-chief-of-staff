import { GmailService } from './packages/core/src/services/gmail.js';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

interface EmailCategorization {
  messageId: string;
  from: string;
  subject: string;
  primaryLabel: string;
  secondaryLabels: string[];
  reasoning: string;
  shouldArchive: boolean;
}

const SYSTEM_PROMPT = `You are an elite Executive Email Categorization Specialist for a CPO at Webflow.

Your role is to intelligently categorize emails into the appropriate labels to maintain inbox organization.

Available labels:
- Administrative: Operational tasks, logistics, scheduling, IT, facilities
- Executive Updates: Strategic announcements, board updates, company-wide communications
- Marketing/Newsletters: Marketing materials, product announcements, industry newsletters, promotional content
- Meetings/Calendar: Meeting invitations, calendar-related items (has sub-labels: Follow-up, This Week, Urgent)
- Team Communication: Direct team discussions, project updates, 1:1 conversations, team coordination

Sub-labels for Meetings/Calendar:
- Meetings/Calendar/Follow-up: Meeting follow-ups, action items from past meetings
- Meetings/Calendar/This Week: Meetings happening this week
- Meetings/Calendar/Urgent: Urgent meeting requests or last-minute changes

Guidelines:
1. Each email gets ONE primary label
2. An email can have additional sub-labels if it's under Meetings/Calendar
3. Marketing/promotional emails should usually be archived after labeling
4. Team discussions stay in inbox with Team Communication label
5. Executive-level strategic content gets Executive Updates label
6. Routine operational tasks get Administrative label`;

async function categorizeEmail(
  anthropic: Anthropic,
  email: { subject: string; from: string; body: string; snippet: string }
): Promise<Omit<EmailCategorization, 'messageId'>> {
  const prompt = `Categorize this email:

FROM: ${email.from}
SUBJECT: ${email.subject}

BODY:
${email.body || email.snippet}

Provide your categorization in the following JSON format:
{
  "primaryLabel": "exact label name from the list",
  "secondaryLabels": ["array of additional sub-labels if applicable"],
  "reasoning": "brief explanation of why this categorization",
  "shouldArchive": true/false
}

Remember:
- Use exact label names including forward slashes for sub-labels (e.g., "Meetings/Calendar/Urgent")
- Only use sub-labels for Meetings/Calendar category
- Set shouldArchive to true for newsletters, marketing, promotional content, and routine calendar notifications
- Calendar acceptance/decline notifications should be archived as they're informational only
- Set shouldArchive to false for actionable emails or important communications`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from response');
  }

  const categorization = JSON.parse(jsonMatch[0]);

  // Auto-archive calendar notification emails (Accepted, Declined, Updated invitation, Synced invitation)
  const autoArchivePatterns = [
    /^Accepted:/i,
    /^Declined:/i,
    /^Updated invitation/i,
    /^Synced invitation/i,
    /^Canceled event/i
  ];

  const shouldAutoArchive = autoArchivePatterns.some(pattern => pattern.test(email.subject));

  return {
    from: email.from,
    subject: email.subject,
    primaryLabel: categorization.primaryLabel,
    secondaryLabels: categorization.secondaryLabels || [],
    reasoning: categorization.reasoning,
    shouldArchive: shouldAutoArchive || categorization.shouldArchive
  };
}

async function runEmailCategorizer() {
  console.log('\n🏷️  Email Auto-Categorizer (Work Gmail)\n');

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.error('❌ ANTHROPIC_API_KEY not found in environment');
    process.exit(1);
  }

  const gmailService = new GmailService('work');
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  // Check authentication
  if (!gmailService.isAuthenticated()) {
    console.error('❌ Work Gmail not authenticated. Run: npm run email:auth');
    process.exit(1);
  }

  console.log('📋 Fetching available labels...');
  const availableLabels = await gmailService.getLabels();
  const userLabels = availableLabels.filter(l =>
    !l.id.startsWith('LABEL_') &&
    !['INBOX', 'UNREAD', 'STARRED', 'TRASH', 'SPAM', 'DRAFT', 'SENT', 'IMPORTANT'].includes(l.id)
  );

  console.log(`✅ Found ${userLabels.length} custom labels\n`);

  console.log('📬 Fetching unread emails...\n');

  try {
    const emails = await gmailService.getUnreadInbox(100);

    if (emails.length === 0) {
      console.log('✅ No unread emails! Inbox zero achieved.');
      return;
    }

    console.log(`Found ${emails.length} unread email(s)\n`);
    console.log('═'.repeat(80));

    const categorizations: EmailCategorization[] = [];

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];

      console.log(`\n📧 Email ${i + 1}/${emails.length}`);
      console.log(`FROM: ${email.from}`);
      console.log(`SUBJECT: ${email.subject}`);
      console.log(`PREVIEW: ${email.snippet.substring(0, 100)}...`);

      console.log('\n🤖 Analyzing with Claude...');

      try {
        const categorization = await categorizeEmail(anthropic, email);
        categorization.messageId = email.id;

        console.log(`\n🏷️  CATEGORIZATION:`);
        console.log(`   Primary Label: ${categorization.primaryLabel}`);
        if (categorization.secondaryLabels.length > 0) {
          console.log(`   Additional Labels: ${categorization.secondaryLabels.join(', ')}`);
        }
        console.log(`   Archive: ${categorization.shouldArchive ? 'Yes' : 'No'}`);
        console.log(`\n💭 REASONING:\n   ${categorization.reasoning}`);

        // Apply primary label
        console.log(`\n🔄 Applying label "${categorization.primaryLabel}"...`);
        await gmailService.applyLabel(email.id, categorization.primaryLabel);
        console.log(`✅ Label applied`);

        // Apply secondary labels if any
        for (const secondaryLabel of categorization.secondaryLabels) {
          console.log(`🔄 Applying additional label "${secondaryLabel}"...`);
          await gmailService.applyLabel(email.id, secondaryLabel);
          console.log(`✅ Label applied`);
        }

        // Archive if recommended
        if (categorization.shouldArchive) {
          console.log(`📥 Archiving email...`);
          await gmailService.archiveMessages([email.id]);
        } else {
          // Just mark as read if not archiving
          await gmailService.markAsRead(email.id);
          console.log(`✅ Marked as read`);
        }

        categorizations.push(categorization);

      } catch (error) {
        console.error(`❌ Error categorizing email: ${(error as Error).message}`);
        console.log(`⏭️  Skipping this email`);
      }

      console.log('\n' + '═'.repeat(80));
    }

    // Save categorization log
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, `email-categorization-${new Date().toISOString()}.json`);
    const logData = {
      timestamp: new Date().toISOString(),
      totalEmails: emails.length,
      categorizations: categorizations
    };

    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));

    console.log(`\n✅ Email categorization complete!`);
    console.log(`📊 Categorized ${categorizations.length}/${emails.length} emails`);
    console.log(`📄 Log saved to: ${logFile}\n`);

  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

runEmailCategorizer().catch(console.error);
