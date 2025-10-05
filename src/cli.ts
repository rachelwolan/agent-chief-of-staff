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

program
  .command('run <agent>')
  .description('Run a specific agent with input')
  .option('-i, --input <json>', 'JSON input for the agent')
  .option('-f, --file <path>', 'Path to JSON input file')
  .action(async (agent, options) => {
    const spinner = ora('Loading agent...').start();

    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY not found in environment');
      }

      const runner = new AgentRunner(process.env.ANTHROPIC_API_KEY);

      let input = {};
      if (options.file) {
        input = JSON.parse(readFileSync(options.file, 'utf-8'));
      } else if (options.input) {
        input = JSON.parse(options.input);
      }

      spinner.text = `Running ${agent} agent...`;

      const result = await runner.runTask(agent, input);

      spinner.succeed(`Agent completed in ${result.duration}ms`);

      console.log(chalk.cyan('\n📋 Output:'));
      console.log(result.output);

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
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY not found in environment');
      }

      const runner = new AgentRunner(process.env.ANTHROPIC_API_KEY);

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

      console.log(chalk.cyan('\n📋 Output:'));
      console.log(result.output);

    } catch (error) {
      spinner.fail('Quick test failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

program.parse();