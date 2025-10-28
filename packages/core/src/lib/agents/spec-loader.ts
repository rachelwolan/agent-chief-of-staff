import { readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import YAML from 'yaml';
import { AgentSpec, SchemaSource } from './types.js';

const SECTION_HEADING_REGEX = /^##\s+(.*)$/;
const FENCED_CODE_REGEX = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/;

export class AgentSpecLoader {
  constructor(
    private readonly agentsDir: string = join(process.cwd(), 'agents')
  ) {}

  async load(agentName: string): Promise<AgentSpec> {
    const sourcePath = join(this.agentsDir, `${agentName}.md`);
    const raw = await readFile(sourcePath, 'utf-8');

    const parsed = matter(raw);
    const sections = this.parseSections(parsed.content);

    const metadata = this.buildMetadata(parsed.data, sections['Agent Metadata']);
    const promptTemplate = (sections['Prompt Template'] || '').trim();

    return {
      name: agentName,
      sourcePath,
      frontMatter: parsed.data as Record<string, unknown>,
      metadata,
      sections,
      promptTemplate,
      jobStatement: (sections['Job Statement'] || sections['Job-To-Be-Done'] || '').trim() || undefined,
      overview: (sections['Overview'] || '').trim() || undefined,
      capabilities: this.extractCapabilities(sections['Capabilities']),
      inputSchema: this.extractSchema(sections['Input Schema']),
      outputSchema: this.extractSchema(sections['Output Schema'])
    };
  }

  private parseSections(markdown: string): Record<string, string> {
    const lines = markdown.split(/\r?\n/);
    const sections: Record<string, string> = {};

    let currentHeading: string | null = null;
    let buffer: string[] = [];

    const flush = () => {
      if (currentHeading) {
        sections[currentHeading] = buffer.join('\n').trim();
      }
      buffer = [];
    };

    for (const line of lines) {
      const headingMatch = line.match(SECTION_HEADING_REGEX);
      if (headingMatch) {
        flush();
        currentHeading = headingMatch[1].trim();
      } else if (currentHeading) {
        buffer.push(line);
      }
    }

    flush();

    return sections;
  }

  private buildMetadata(frontMatter: object, metadataSection?: string): Record<string, unknown> {
    const metadata: Record<string, unknown> = { ...(frontMatter as Record<string, unknown>) };

    if (!metadataSection) {
      return metadata;
    }

    const block = this.extractFirstCodeBlock(metadataSection);
    if (!block) {
      return metadata;
    }

    if (block.language && !['yaml', 'yml', 'json'].includes(block.language)) {
      return metadata;
    }

    try {
      const parsedMetadata = block.language === 'json'
        ? JSON.parse(block.code)
        : YAML.parse(block.code);

      if (parsedMetadata && typeof parsedMetadata === 'object') {
        Object.assign(metadata, parsedMetadata);
      }
    } catch (error) {
      console.warn('⚠️  Failed to parse agent metadata section:', (error as Error).message);
    }

    return metadata;
  }

  private extractCapabilities(section?: string): string[] | undefined {
    if (!section) return undefined;

    const capabilities: string[] = [];
    const lines = section.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[-*]\s+/.test(trimmed)) {
        capabilities.push(trimmed.replace(/^[-*]\s+/, '').trim());
      } else if (/^\d+\.\s+/.test(trimmed)) {
        capabilities.push(trimmed.replace(/^\d+\.\s+/, '').trim());
      }
    }

    return capabilities.length ? capabilities : undefined;
  }

  private extractSchema(section?: string): SchemaSource | undefined {
    if (!section) return undefined;
    const block = this.extractFirstCodeBlock(section);
    if (!block) return undefined;

    return {
      language: block.language,
      code: block.code
    };
  }

  private extractFirstCodeBlock(section: string): { language?: string; code: string } | null {
    const match = section.match(FENCED_CODE_REGEX);
    if (!match) return null;

    return {
      language: match[1]?.trim(),
      code: match[2]
    };
  }
}
