#!/usr/bin/env node

import { WebClient } from '@slack/web-api';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleDocsService } from './services/google-docs.js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

interface PRDData {
  title: string;
  content: string;
  url: string;
  date?: string;
  slackMessageUrl?: string;
}

class ProductPrinciplesAnalyzer {
  private slackClient: WebClient;
  private anthropic: Anthropic;
  private docsService: GoogleDocsService;

  constructor() {
    const slackToken = process.env.SLACK_USER_TOKEN || process.env.SLACK_BOT_TOKEN;
    if (!slackToken) {
      throw new Error('SLACK_USER_TOKEN or SLACK_BOT_TOKEN not found in environment');
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY not found in environment');
    }

    this.slackClient = new WebClient(slackToken);
    this.anthropic = new Anthropic({ apiKey: anthropicKey });
    this.docsService = new GoogleDocsService();
  }

  /**
   * Find channel ID by name
   */
  async findChannelId(channelName: string): Promise<string | null> {
    try {
      // Remove # if present
      const cleanName = channelName.replace(/^#/, '');

      const result = await this.slackClient.conversations.list({
        types: 'public_channel,private_channel',
        limit: 1000
      });

      const channel = result.channels?.find(
        (ch: any) => ch.name === cleanName
      );

      return channel?.id || null;
    } catch (error: any) {
      console.error('Error finding channel:', error.message);
      return null;
    }
  }

  /**
   * Fetch messages from a Slack channel
   */
  async fetchChannelMessages(
    channelId: string,
    daysBack: number = 365
  ): Promise<any[]> {
    console.log(`\n📥 Fetching messages from past ${daysBack} days...\n`);

    const now = Date.now() / 1000;
    const oldest = now - (daysBack * 24 * 60 * 60);

    const messages: any[] = [];
    let cursor: string | undefined;

    try {
      do {
        const result = await this.slackClient.conversations.history({
          channel: channelId,
          oldest: oldest.toString(),
          limit: 200,
          cursor
        });

        if (result.messages) {
          messages.push(...result.messages);
        }

        cursor = result.response_metadata?.next_cursor;

        console.log(`   Fetched ${messages.length} messages so far...`);

        // Rate limiting
        if (cursor) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } while (cursor);

      console.log(`   ✅ Total messages fetched: ${messages.length}\n`);
      return messages;
    } catch (error: any) {
      console.error('Error fetching messages:', error.message);
      throw error;
    }
  }

  /**
   * Extract Google Docs URLs from Slack messages
   */
  extractGoogleDocsUrls(messages: any[]): Array<{ url: string; messageTs: string; text: string }> {
    const googleDocsPattern = /https:\/\/docs\.google\.com\/[^\s>]*/g;
    const docsUrls: Array<{ url: string; messageTs: string; text: string }> = [];

    for (const msg of messages) {
      const text = msg.text || '';
      const matches = text.match(googleDocsPattern);

      if (matches) {
        for (let url of matches) {
          // Clean up URL (remove trailing > or other characters)
          url = url.replace(/[>|].*$/, '');

          // Only include document URLs (not folders or other Google Drive items)
          if (url.includes('/document/d/') || url.includes('/doc/d/')) {
            docsUrls.push({
              url,
              messageTs: msg.ts,
              text: text.substring(0, 100)
            });
          }
        }
      }
    }

    // Deduplicate URLs
    const uniqueUrls = new Map<string, { url: string; messageTs: string; text: string }>();
    for (const doc of docsUrls) {
      const docId = this.docsService.extractDocId(doc.url);
      if (docId && !uniqueUrls.has(docId)) {
        uniqueUrls.set(docId, doc);
      }
    }

    return Array.from(uniqueUrls.values());
  }

  /**
   * Fetch all Google Docs content
   */
  async fetchPRDs(
    docsUrls: Array<{ url: string; messageTs: string; text: string }>
  ): Promise<PRDData[]> {
    console.log(`\n📄 Fetching ${docsUrls.length} Google Docs...\n`);

    const prds: PRDData[] = [];
    const errors: string[] = [];

    for (const { url, messageTs } of docsUrls) {
      const docId = this.docsService.extractDocId(url);
      if (!docId) {
        console.log(`   ⚠️  Could not extract doc ID from: ${url}`);
        continue;
      }

      try {
        const doc = await this.docsService.fetchDocument(docId);

        // Convert timestamp to date
        const date = new Date(parseFloat(messageTs) * 1000).toISOString().split('T')[0];

        prds.push({
          title: doc.title,
          content: doc.content,
          url: doc.url,
          date: doc.modifiedTime || date,
          slackMessageUrl: `slack://channel?team=T123&id=C123&message=${messageTs}`
        });

        console.log(`   ✅ ${doc.title} (${doc.content.length} chars)`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`   ❌ Failed to fetch ${url}: ${error.message}`);
        errors.push(`${url}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.warn(`\n⚠️  Failed to fetch ${errors.length} document(s)\n`);
    }

    console.log(`\n✅ Successfully fetched ${prds.length} PRDs\n`);
    return prds;
  }

  /**
   * Analyze PRDs and extract product principles
   */
  async analyzeProductPrinciples(prds: PRDData[]): Promise<any> {
    console.log(`\n🤖 Analyzing ${prds.length} PRDs with Claude Sonnet 4.5...\n`);

    // Format PRDs for analysis
    const prdsContent = prds.map((prd, idx) => {
      return `
# PRD ${idx + 1}: ${prd.title}

**URL**: ${prd.url}
**Date**: ${prd.date || 'Unknown'}

## Content:

${prd.content}

---
`;
    }).join('\n\n');

    // Build the prompt
    const prompt = `You are analyzing a collection of Product Requirement Documents (PRDs) from Webflow to retroactively identify the product principles that guide their decision-making.

CONTEXT:
- Company: Webflow (visual web design and development platform)
- Role: CPO (Chief Product Officer)
- Goal: Extract implicit product principles from past PRDs

TASK:
Analyze the provided PRDs and identify 8-12 product principles that consistently appear across them. Look for:

1. **User-Centric Patterns**: How do they think about users? What user needs are prioritized?
2. **Decision-Making Criteria**: What factors drive "yes" vs "no" decisions?
3. **Quality Standards**: What level of polish, performance, or completeness is required?
4. **Technical Philosophy**: How do they balance innovation vs stability, flexibility vs simplicity?
5. **Business Alignment**: How do they balance user value vs business value?
6. **Design Philosophy**: What design values consistently appear (simplicity, power, flexibility)?
7. **Prioritization Framework**: What gets prioritized and why?
8. **Scope Approach**: How do they scope features (MVP vs complete, iterative vs big bang)?

For each principle:
- Give it a clear, memorable name (2-5 words)
- Describe what it means in practice (2-3 sentences)
- Explain the evidence from PRDs that led you to identify this principle
- Provide 2-3 specific examples from the PRDs
- Rate how frequently this principle appeared (high/medium/low)

Group principles into themes (e.g., "User Experience", "Technical Excellence", "Business Strategy").

Provide an executive summary (3-4 sentences) that captures the overall product philosophy.

Rate your confidence level:
- HIGH: Principle appeared explicitly or implicitly in 50%+ of PRDs
- MEDIUM: Principle appeared in 25-50% of PRDs
- LOW: Principle appeared in <25% of PRDs but seems significant

IMPORTANT:
- Focus on IMPLICIT principles (what they do) not just explicit statements
- Look for patterns across multiple PRDs, not one-offs
- Distinguish between aspirational statements and actual practice
- Be specific - cite actual examples from PRDs
- Prioritize principles that are distinctive or non-obvious

PRDs TO ANALYZE:
${prdsContent}

Format your response as JSON with this structure:
{
  "principles": [
    {
      "title": "string - principle name",
      "description": "string - what this principle means",
      "rationale": "string - why this principle emerged from the PRDs",
      "examples": ["array of specific examples from PRDs"],
      "frequency": "string - how often this principle appeared (high/medium/low)"
    }
  ],
  "themes": [
    {
      "theme": "string - overarching theme",
      "principles": ["array of principle titles related to this theme"]
    }
  ],
  "summary": "string - executive summary of the product philosophy",
  "metadata": {
    "totalPRDs": ${prds.length},
    "dateRange": "${prds[0]?.date || 'Unknown'} to ${prds[prds.length - 1]?.date || 'Unknown'}",
    "confidenceLevel": "string (high/medium/low)"
  }
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const replyText = response.content[0].type === 'text'
        ? response.content[0].text
        : '{}';

      // Extract JSON from response
      let jsonText = replyText;
      const jsonMatch = replyText.match(/```json\n([\s\S]+?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const result = JSON.parse(jsonText);
      console.log(`✅ Analysis complete!\n`);

      return result;
    } catch (error: any) {
      console.error('Error analyzing PRDs:', error.message);
      throw error;
    }
  }

  /**
   * Save results to file
   */
  saveResults(result: any, prds: PRDData[]): string {
    const timestamp = new Date().toISOString();
    const outputDir = path.join(process.cwd(), 'docs', 'personal');
    fs.mkdirSync(outputDir, { recursive: true });

    // Save JSON
    const jsonPath = path.join(outputDir, 'product-principles-analysis.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      timestamp,
      prdCount: prds.length,
      result
    }, null, 2));

    // Save Markdown
    const mdPath = path.join(outputDir, 'product-principles.md');
    const markdown = this.formatAsMarkdown(result, prds);
    fs.writeFileSync(mdPath, markdown);

    console.log(`\n📝 Results saved to:`);
    console.log(`   - ${mdPath}`);
    console.log(`   - ${jsonPath}\n`);

    return mdPath;
  }

  /**
   * Format results as markdown
   */
  private formatAsMarkdown(result: any, prds: PRDData[]): string {
    let md = `# Webflow Product Principles\n\n`;
    md += `*Generated on ${new Date().toLocaleDateString()} from ${prds.length} PRDs*\n\n`;
    md += `---\n\n`;

    // Executive Summary
    md += `## Executive Summary\n\n`;
    md += `${result.summary}\n\n`;
    md += `**Confidence Level**: ${result.metadata?.confidenceLevel || 'N/A'}\n\n`;
    md += `---\n\n`;

    // Principles by Theme
    md += `## Product Principles\n\n`;

    if (result.themes && result.themes.length > 0) {
      for (const theme of result.themes) {
        md += `### ${theme.theme}\n\n`;

        const themePrinciples = result.principles.filter((p: any) =>
          theme.principles.includes(p.title)
        );

        for (const principle of themePrinciples) {
          md += `#### ${principle.title}\n\n`;
          md += `**Frequency**: ${principle.frequency}\n\n`;
          md += `${principle.description}\n\n`;
          md += `**Rationale**: ${principle.rationale}\n\n`;

          if (principle.examples && principle.examples.length > 0) {
            md += `**Examples**:\n`;
            for (const example of principle.examples) {
              md += `- ${example}\n`;
            }
            md += `\n`;
          }
        }
      }
    } else {
      // If no themes, just list all principles
      for (const principle of result.principles) {
        md += `### ${principle.title}\n\n`;
        md += `**Frequency**: ${principle.frequency}\n\n`;
        md += `${principle.description}\n\n`;
        md += `**Rationale**: ${principle.rationale}\n\n`;

        if (principle.examples && principle.examples.length > 0) {
          md += `**Examples**:\n`;
          for (const example of principle.examples) {
            md += `- ${example}\n`;
          }
          md += `\n`;
        }
      }
    }

    // Appendix: PRD List
    md += `---\n\n`;
    md += `## Appendix: Analyzed PRDs\n\n`;
    md += `Total PRDs analyzed: ${prds.length}\n\n`;

    for (let i = 0; i < prds.length; i++) {
      const prd = prds[i];
      md += `${i + 1}. **${prd.title}** - [View Doc](${prd.url}) - ${prd.date}\n`;
    }

    return md;
  }

  /**
   * Main execution
   */
  async run(channelName: string = 'ok2-build', daysBack: number = 365) {
    console.log(`\n🚀 Product Principles Generator\n`);
    console.log(`Channel: #${channelName}`);
    console.log(`Time range: Past ${daysBack} days\n`);
    console.log(`=`.repeat(50));

    try {
      // 1. Find channel
      console.log(`\n🔍 Finding channel #${channelName}...`);
      const channelId = await this.findChannelId(channelName);

      if (!channelId) {
        throw new Error(`Channel #${channelName} not found`);
      }
      console.log(`   ✅ Found channel: ${channelId}\n`);

      // 2. Fetch messages
      const messages = await this.fetchChannelMessages(channelId, daysBack);

      // 3. Extract Google Docs URLs
      console.log(`\n🔗 Extracting Google Docs URLs...`);
      const docsUrls = this.extractGoogleDocsUrls(messages);
      console.log(`   ✅ Found ${docsUrls.length} unique Google Docs\n`);

      if (docsUrls.length === 0) {
        throw new Error('No Google Docs found in channel messages');
      }

      // 4. Fetch PRDs
      const prds = await this.fetchPRDs(docsUrls);

      if (prds.length === 0) {
        throw new Error('No PRDs could be fetched');
      }

      // 5. Analyze with Claude
      const result = await this.analyzeProductPrinciples(prds);

      // 6. Save results
      const outputPath = this.saveResults(result, prds);

      console.log(`\n✨ Done! Product principles extracted from ${prds.length} PRDs.\n`);
      console.log(`📖 View results: ${outputPath}\n`);

    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}\n`);
      process.exit(1);
    }
  }
}

// CLI
const channelName = process.argv[2] || 'ok2-build';
const daysBack = process.argv[3] ? parseInt(process.argv[3]) : 365;

const analyzer = new ProductPrinciplesAnalyzer();
analyzer.run(channelName, daysBack);
