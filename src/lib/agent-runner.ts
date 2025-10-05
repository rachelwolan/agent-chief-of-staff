import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import chalk from 'chalk';

export interface AgentSpec {
  name: string;
  jobStatement: string;
  promptTemplate: string;
  capabilities: string[];
}

export interface TaskResult {
  agentName: string;
  input: any;
  output: any;
  timestamp: string;
  duration: number;
  success: boolean;
  error?: string;
}

export class AgentRunner {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
  }

  async loadAgent(agentName: string): Promise<AgentSpec> {
    const agentPath = join(process.cwd(), 'agents', `${agentName}.md`);
    const content = readFileSync(agentPath, 'utf-8');
    const { content: markdown } = matter(content);

    const sections = this.parseMarkdownSections(markdown);

    return {
      name: agentName,
      jobStatement: sections['Job Statement'] || '',
      promptTemplate: sections['Prompt Template'] || '',
      capabilities: this.parseList(sections['Capabilities'] || '')
    };
  }

  private parseMarkdownSections(markdown: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = markdown.split('\n');
    let currentSection = '';
    let sectionContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentSection) {
          sections[currentSection] = sectionContent.join('\n').trim();
        }
        currentSection = line.replace('## ', '');
        sectionContent = [];
      } else if (currentSection) {
        sectionContent.push(line);
      }
    }

    if (currentSection) {
      sections[currentSection] = sectionContent.join('\n').trim();
    }

    return sections;
  }

  private parseList(text: string): string[] {
    return text
      .split('\n')
      .filter(line => line.startsWith('- '))
      .map(line => line.replace('- ', '').trim());
  }

  async runTask(agentName: string, input: any): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      const agent = await this.loadAgent(agentName);

      const prompt = agent.promptTemplate.replace('{{meeting}}', JSON.stringify(input, null, 2));

      console.log(chalk.cyan(`🤖 Running ${agent.name} agent...`));

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const output = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      const result: TaskResult = {
        agentName,
        input,
        output,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: true
      };

      this.saveResult(result);

      return result;

    } catch (error) {
      const result: TaskResult = {
        agentName,
        input,
        output: null,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };

      this.saveResult(result);

      throw error;
    }
  }

  private saveResult(result: TaskResult) {
    const filename = `${result.agentName}-${Date.now()}.json`;
    const filepath = join(process.cwd(), 'logs', filename);
    writeFileSync(filepath, JSON.stringify(result, null, 2));

    console.log(chalk.green(`✅ Result saved to logs/${filename}`));
  }
}