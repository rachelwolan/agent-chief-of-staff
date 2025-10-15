#!/usr/bin/env node
import { config } from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { createSlackClient } from './services/slack.js';
import { createTranscriptionService, TranscriptionService } from './services/transcription.js';
import matter from 'gray-matter';
import { join, basename, extname } from 'path';

config();

interface MeetingActionItem {
  task: string;
  owner: string;
  dueDate?: string;
  priority?: string;
}

interface MeetingSummary {
  summary: string;
  keyDecisions?: string[];
  actionItems?: MeetingActionItem[];
  openQuestions?: string[];
  nextSteps?: string[];
}

async function processMeeting(filePath: string) {
  const spinner = ora('Processing meeting...').start();

  try {
    // Check for required API keys
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in environment');
    }

    if (!process.env.SLACK_BOT_TOKEN) {
      throw new Error('SLACK_BOT_TOKEN not found in environment');
    }

    let transcript: string;

    // Check if this is an audio file that needs transcription
    const audioExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
    const isAudio = audioExtensions.some(ext => filePath.toLowerCase().endsWith(ext));

    if (isAudio) {
      // Transcribe audio file first
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not found in environment. Required for audio transcription.');
      }

      spinner.text = 'Transcribing audio with Whisper API...';
      const transcriptionService = createTranscriptionService();
      transcript = await transcriptionService.transcribeAudio(filePath);

      // Save the transcript for future reference
      const transcriptFileName = basename(filePath, extname(filePath)) + '.txt';
      const transcriptPath = join(process.cwd(), 'transcripts', transcriptFileName);
      writeFileSync(transcriptPath, transcript, 'utf-8');
      spinner.succeed(`Audio transcribed! Saved to ${transcriptFileName}`);

      spinner.start('Processing meeting transcript...');
    } else {
      // Read existing text transcript
      spinner.text = 'Reading transcript...';
      transcript = readFileSync(filePath, 'utf-8');
    }

    // Load the meeting-processor agent prompt
    spinner.text = 'Loading meeting processor agent...';
    const agentPath = join(process.cwd(), 'agents', 'meeting-processor.md');
    const agentContent = readFileSync(agentPath, 'utf-8');
    const { content: agentPrompt } = matter(agentContent);

    // Call Claude to process the meeting
    spinner.text = 'Analyzing meeting with Claude...';
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `${agentPrompt}\n\n---\n\nPlease analyze the following meeting transcript:\n\n${transcript}`
      }]
    });

    const output = message.content[0].type === 'text' ? message.content[0].text : '';

    spinner.succeed('Meeting processed successfully!');

    // Display the output
    console.log(chalk.cyan('\n📋 Meeting Summary:\n'));
    console.log(output);

    // Parse the output to extract structured data for Slack
    const summary = parseOutput(output);

    // Post to Slack
    spinner.start('Posting to Slack channel #rachels-mcp...');
    const slackClient = createSlackClient();

    const result = await slackClient.postMeetingSummary('rachels-mcp', summary);

    if (result.ok) {
      spinner.succeed('Posted to #rachels-mcp on Slack!');
      console.log(chalk.green(`\n✅ Message posted successfully`));
    } else {
      spinner.fail('Failed to post to Slack');
      console.error(chalk.red(`Error: ${result.error}`));
    }

  } catch (error) {
    spinner.fail('Failed to process meeting');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

function parseOutput(output: string): MeetingSummary {
  const lines = output.split('\n');
  const summary: MeetingSummary = {
    summary: '',
    keyDecisions: [],
    actionItems: [],
    openQuestions: [],
    nextSteps: []
  };

  let currentSection = '';
  let summaryLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('### Meeting Summary') || trimmed.startsWith('## Meeting Summary')) {
      currentSection = 'summary';
      continue;
    } else if (trimmed.startsWith('### Key Decisions') || trimmed.startsWith('## Key Decisions')) {
      currentSection = 'decisions';
      continue;
    } else if (trimmed.startsWith('### Action Items') || trimmed.startsWith('## Action Items')) {
      currentSection = 'actions';
      continue;
    } else if (trimmed.startsWith('### Open Questions') || trimmed.startsWith('## Open Questions')) {
      currentSection = 'questions';
      continue;
    } else if (trimmed.startsWith('### Next Steps') || trimmed.startsWith('## Next Steps')) {
      currentSection = 'nextSteps';
      continue;
    }

    if (!trimmed || trimmed.startsWith('#')) continue;

    switch (currentSection) {
      case 'summary':
        if (trimmed) summaryLines.push(trimmed);
        break;
      case 'decisions':
        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
          summary.keyDecisions?.push(trimmed.replace(/^[-•]\s*/, ''));
        }
        break;
      case 'actions':
        if (trimmed.match(/^\d+\./)) {
          const actionItem = parseActionItem(trimmed);
          if (actionItem) summary.actionItems?.push(actionItem);
        }
        break;
      case 'questions':
        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
          summary.openQuestions?.push(trimmed.replace(/^[-•]\s*/, ''));
        }
        break;
      case 'nextSteps':
        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
          summary.nextSteps?.push(trimmed.replace(/^[-•]\s*/, ''));
        }
        break;
    }
  }

  summary.summary = summaryLines.join(' ');

  return summary;
}

function parseActionItem(line: string): MeetingActionItem | null {
  // Format: 1. **Task** - Owner: @name | Due: date | Priority: level
  const match = line.match(/^\d+\.\s*\*\*(.+?)\*\*\s*-\s*Owner:\s*(@?\w+)(?:\s*\|\s*Due:\s*([^|]+))?(?:\s*\|\s*Priority:\s*(\w+))?/);

  if (match) {
    return {
      task: match[1].trim(),
      owner: match[2].trim(),
      dueDate: match[3]?.trim(),
      priority: match[4]?.trim()
    };
  }

  // Fallback: Try to extract at least task and owner
  const simpleMatch = line.match(/^\d+\.\s*(.+?)\s*-\s*(?:Owner:?\s*)?(@?\w+)/);
  if (simpleMatch) {
    return {
      task: simpleMatch[1].replace(/\*\*/g, '').trim(),
      owner: simpleMatch[2].trim()
    };
  }

  return null;
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(chalk.red('Usage: npm run meeting:process <file-path>'));
  console.log(chalk.cyan('\nExamples:'));
  console.log(chalk.cyan('  npm run meeting:process transcripts/team-sync.txt'));
  console.log(chalk.cyan('  npm run meeting:process transcripts/recordings/meeting.m4a'));
  console.log(chalk.cyan('\nSupported audio formats: mp3, mp4, mpeg, mpga, m4a, wav, webm'));
  process.exit(1);
}

processMeeting(args[0]);
