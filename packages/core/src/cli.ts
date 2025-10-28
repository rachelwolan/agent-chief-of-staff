#!/usr/bin/env node
import { Command } from 'commander';
import { config } from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';
import { AgentRunner } from './lib/agent-runner.js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

config();

const program = new Command();

program
  .name('chief')
  .description('AI Chief of Staff - Run JTBD agents')
  .version('0.1.0');

function buildAgentRunner(): AgentRunner {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not found in environment');
  }

  const maxTokens = process.env.ANTHROPIC_MAX_TOKENS
    ? Number.parseInt(process.env.ANTHROPIC_MAX_TOKENS, 10)
    : undefined;

  const temperature = process.env.ANTHROPIC_TEMPERATURE
    ? Number.parseFloat(process.env.ANTHROPIC_TEMPERATURE)
    : undefined;

  return new AgentRunner({
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL,
    maxTokens: Number.isFinite(maxTokens) ? maxTokens : undefined,
    temperature: Number.isFinite(temperature) ? temperature : undefined,
    systemPrompt: process.env.ANTHROPIC_SYSTEM_PROMPT
  });
}

function printResultOutput(result: Awaited<ReturnType<AgentRunner['runTask']>>) {
  console.log(chalk.cyan('\n📋 Output:'));
  if (typeof result.output === 'string') {
    console.log(result.output);
  } else {
    console.log(JSON.stringify(result.output, null, 2));
  }

  if (!result.validatedOutput && result.rawOutput && typeof result.output !== 'string') {
    console.log(chalk.yellow('\n⚠️  Output validation unavailable. Showing raw model response below:\n'));
    console.log(result.rawOutput);
  }
}

program
  .command('run <agent>')
  .description('Run a specific agent with input')
  .option('-i, --input <json>', 'JSON input for the agent')
  .option('-f, --file <path>', 'Path to JSON input file')
  .action(async (agent, options) => {
    const spinner = ora('Loading agent...').start();

    try {
      const runner = buildAgentRunner();

      let input = {};
      if (options.file) {
        input = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.input) {
        input = JSON.parse(options.input);
      }

      spinner.text = `Running ${agent} agent...`;

      const result = await runner.runTask(agent, input);

      spinner.succeed(`Agent completed in ${result.duration}ms`);

      printResultOutput(result);

    } catch (error) {
      spinner.fail('Agent failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all available agents')
  .action(() => {
    const agentsDir = join(process.cwd(), 'agents');
    const agents = readdirSync(agentsDir)
      .filter(f => f.endsWith('.md') && f !== 'README.md')
      .map(f => f.replace('.md', ''));

    console.log(chalk.cyan('Available agents:'));
    agents.forEach(agent => {
      console.log(`  • ${agent}`);
    });
  });

program
  .command('quick <agent>')
  .description('Quick test an agent with sample data')
  .action(async (agent) => {
    const spinner = ora('Running quick test...').start();

    try {
      const runner = buildAgentRunner();

      const sampleInput = {
        meeting: {
          title: 'Weekly Product Sync',
          date: 'Tomorrow 2pm',
          attendees: ['Engineering Manager', 'Design Lead'],
          agenda: 'Review sprint progress, discuss blockers'
        }
      };

      const result = await runner.runTask(agent, sampleInput);

      spinner.succeed(`Quick test completed in ${result.duration}ms`);

      printResultOutput(result);

    } catch (error) {
      spinner.fail('Quick test failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

program.parse();
