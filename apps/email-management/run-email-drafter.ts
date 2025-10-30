import { GmailService } from './packages/core/src/services/gmail.js';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

interface EmailAnalysis {
  messageId: string;
  threadId: string;
  from: string;
  subject: string;
  priority: 'urgent' | 'important' | 'standard' | 'defer';
  sentiment: string;
  keyQuestions: string[];
  suggestedResponse: string;
  reasoning: string;
}

const SYSTEM_PROMPT = `You are an elite Executive Email Response Specialist for a CPO at Webflow.

Your role is to analyze emails and draft professional, strategic responses that:
1. Match the executive's voice (clear, direct, strategic)
2. Address all questions and concerns
3. Maintain appropriate relationships
4. Advance business objectives

For each email, provide:
- Priority level (urgent/important/standard/defer)
- Sentiment analysis
- Key questions that need answers
- A draft response
- Your reasoning

The executive values:
- Clarity over politeness
- Strategic thinking
- Quick decision-making
- Authentic communication`;

async function analyzeEmail(
  anthropic: Anthropic,
  email: { subject: string; from: string; body: string; snippet: string }
): Promise<EmailAnalysis> {
  const prompt = `Analyze this email and draft a response:

FROM: ${email.from}
SUBJECT: ${email.subject}

BODY:
${email.body || email.snippet}

Provide your analysis in the following JSON format:
{
  "priority": "urgent|important|standard|defer",
  "sentiment": "brief sentiment description",
  "keyQuestions": ["question 1", "question 2"],
  "suggestedResponse": "full draft response text",
  "reasoning": "why you drafted this response"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
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

  const analysis = JSON.parse(jsonMatch[0]);

  return {
    messageId: '',
    threadId: '',
    from: email.from,
    subject: email.subject,
    priority: analysis.priority,
    sentiment: analysis.sentiment,
    keyQuestions: analysis.keyQuestions,
    suggestedResponse: analysis.suggestedResponse,
    reasoning: analysis.reasoning
  };
}

async function getUserChoice(prompt: string, options: string[]): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`\n${prompt}`);
  options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));

  const answer = await new Promise<string>(resolve => {
    rl.question('\nYour choice: ', resolve);
  });
  rl.close();

  const index = parseInt(answer) - 1;
  if (index >= 0 && index < options.length) {
    return options[index];
  }

  return options[0]; // default to first option
}

async function runEmailDrafter() {
  console.log('\n📧 Email Response Drafter (Work Gmail)\n');

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

  console.log('📬 Fetching unread emails...\n');

  try {
    const emails = await gmailService.getUnreadInbox(20);

    if (emails.length === 0) {
      console.log('✅ No unread emails! Inbox zero achieved.');
      return;
    }

    console.log(`Found ${emails.length} unread email(s)\n`);
    console.log('═'.repeat(80));

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];

      console.log(`\n📧 Email ${i + 1}/${emails.length}`);
      console.log(`FROM: ${email.from}`);
      console.log(`SUBJECT: ${email.subject}`);
      console.log(`DATE: ${email.date}`);
      console.log(`PREVIEW: ${email.snippet.substring(0, 100)}...`);

      console.log('\n🤖 Analyzing with Claude...');

      const analysis = await analyzeEmail(anthropic, email);
      analysis.messageId = email.id;
      analysis.threadId = email.threadId;

      console.log(`\n📊 ANALYSIS:`);
      console.log(`   Priority: ${analysis.priority.toUpperCase()}`);
      console.log(`   Sentiment: ${analysis.sentiment}`);

      if (analysis.keyQuestions.length > 0) {
        console.log(`\n   Key Questions:`);
        analysis.keyQuestions.forEach(q => console.log(`      • ${q}`));
      }

      console.log(`\n💭 REASONING:\n   ${analysis.reasoning}`);
      console.log(`\n✍️  SUGGESTED RESPONSE:\n`);
      console.log('─'.repeat(80));
      console.log(analysis.suggestedResponse);
      console.log('─'.repeat(80));

      const action = await getUserChoice(
        'What would you like to do?',
        ['Save as draft', 'Send now', 'Skip', 'Edit and save', 'Mark as read']
      );

      if (action === 'Save as draft') {
        await gmailService.createDraft(
          email.threadId,
          email.from,
          `Re: ${email.subject.replace(/^Re: /, '')}`,
          analysis.suggestedResponse
        );
        await gmailService.markAsRead(email.id);
        console.log('✅ Draft saved and email marked as read');
      } else if (action === 'Send now') {
        await gmailService.sendReply(
          email.threadId,
          email.from,
          `Re: ${email.subject.replace(/^Re: /, '')}`,
          analysis.suggestedResponse
        );
        await gmailService.markAsRead(email.id);
        console.log('✅ Reply sent and email marked as read');
      } else if (action === 'Mark as read') {
        await gmailService.markAsRead(email.id);
        console.log('✅ Email marked as read');
      } else if (action === 'Skip') {
        console.log('⏭️  Skipped');
      }

      // Save analysis to log
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logFile = path.join(logDir, `email-analysis-${new Date().toISOString()}.json`);
      const logData = {
        timestamp: new Date().toISOString(),
        email: {
          id: email.id,
          from: email.from,
          subject: email.subject,
          date: email.date
        },
        analysis: {
          priority: analysis.priority,
          sentiment: analysis.sentiment,
          keyQuestions: analysis.keyQuestions,
          reasoning: analysis.reasoning
        },
        action: action
      };

      fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));

      console.log('\n' + '═'.repeat(80));
    }

    console.log('\n✅ Email triage complete!\n');
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

runEmailDrafter().catch(console.error);
