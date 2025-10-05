import Anthropic from '@anthropic-ai/sdk';
import { Article } from './article-fetcher.js';

export interface DossierShare {
  audience: 'product-org' | 'e-staff';
  link: string;
  title: string;
  slackMessage: string;
  mentions?: string[];
}

export interface ArticleAnalysis {
  url: string;
  title: string;
  source: string;
  takeaways: [string, string]; // Exactly 2 bullet points
  shouldRead: boolean; // Star priority articles
}

export interface Dossier {
  date: string;
  summary: string; // Executive summary
  keyInsights: string[]; // 3-5 consolidated insights (replaces themes + signals)
  strategicImplications: string; // Tailored to Rachel's style
  productOrgShare: DossierShare;
  eStaffShare: DossierShare;
  fullAnalysis: string; // Markdown-formatted synthesis
  articles: ArticleAnalysis[]; // Articles with takeaways and priority
}

export class DossierGeneratorService {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
  }

  async generateDossier(articles: Article[]): Promise<Dossier> {
    console.log(`🤖 Generating dossier from ${articles.length} articles...`);

    // Build the context with article references
    const articlesContext = articles
      .map((article, i) => `
## Article ${i + 1}: ${article.title}
URL: ${article.url}
Source: ${article.siteName || new URL(article.url).hostname}
${article.author ? `Author: ${article.author}` : ''}

${article.content}

---
      `).join('\n');

    const prompt = `You are Rachel's AI Chief of Staff. 

## Rachel's Context:
- **Role**: CPO at Webflow (no-code website builder)
- **Background**: 20+ years SaaS, GM of Dropbox Core ($2B P&L), 8+ years building AI products
- **Philosophy**: Learn-it-all > know-it-all, speed as habit, AI-native not AI-enabled
- **Communication Style**: Direct, actionable, grounded in first principles
- **Strategic Focus**: Answer Engine Optimization (AEO), AI-native transformation, distribution-first thinking
- **Personality**: Enneagram 7w6 (Enthusiast + Loyalist) - optimistic but grounded, curious but loyal

Today's newsletters contained these articles:

${articlesContext}

**Your task:** Create Rachel's daily "Learn-it-all" dossier.

## Requirements:

1. **Executive Summary** (100 words): What Rachel needs to know right now
   - Direct and punchy
   - Connect to her strategic priorities (AI-native, AEO, speed)

2. **Key Insights** (3-5 bullet points): Consolidated patterns and signals
   - Merge themes AND emerging trends into ONE list
   - Be specific and actionable
   - Connect to Webflow's opportunities

3. **Strategic Implications** (200 words): What this means for Webflow
   - Write in Rachel's voice: learn-it-all mindset, first principles thinking
   - Focus on: AI-native opportunities, distribution advantages, speed as competitive edge
   - Frame as "here's what's interesting" not prescriptive
   - Ground in measurable impact when possible
   - Include 2-3 provocative questions at the end

4. **Product Org Share**: Pick ONE article to share
   - Tactical, actionable, or inspiring
   - Casual Slack message (2-3 sentences max)
   - Rachel's voice: enthusiastic but grounded
   - Include article link and title

5. **E-Staff Share**: Pick ONE article for executives
   - Strategic or cross-functional
   - Brief Slack message with @mentions:
     * Linda (CEO) - strategy, growth, board
     * Allan (CTO) - infrastructure, technical excellence
     * Craig (CFO) - ROI, efficiency
     * Adrian (CRO) - GTM, premium experiences
     * Mike (SVP People) - talent, culture
   - Apply Decker: Listeners + POV + Benefits
   - Include article link and title

6. **Full Analysis** (1000 words): Complete synthesis in MARKDOWN format
   - Use markdown formatting (## headers, **bold**, [links](url))
   - Conversational but sharp
   - Connect dots across articles with inline citations
   - Highlight non-obvious insights
   - Include contrarian takes when warranted
   - Ground in Rachel's strategic priorities

7. **Article Takeaways**: For EACH article, provide:
   - 2 bullet points summarizing key takeaways (actionable and specific)
   - Boolean flag indicating if Rachel should prioritize reading this (star it)
   - Prioritize articles about: AI-native products, distribution strategies, measurable impact, product-led growth, technical leadership

Return ONLY valid JSON matching this structure:
{
  "summary": "executive summary here",
  "keyInsights": ["insight 1", "insight 2", ...],
  "strategicImplications": "implications in Rachel's voice with 2-3 questions at end",
  "productOrgShare": {
    "link": "article url",
    "title": "article title",
    "slackMessage": "casual message here"
  },
  "eStaffShare": {
    "link": "article url",
    "title": "article title",
    "slackMessage": "strategic message with @mentions",
    "mentions": ["Linda", "Allan"]
  },
  "fullAnalysis": "1000-word synthesis in MARKDOWN format with ## headers, **bold**, [links](url)",
  "articles": [
    {
      "url": "article url",
      "title": "article title",
      "source": "publication",
      "takeaways": ["takeaway 1", "takeaway 2"],
      "shouldRead": true
    }
  ]
}`;

    console.log('🤖 Using Claude Sonnet 4.5 for analysis...');
    
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.7,
      system: 'You are an expert executive assistant and strategic analyst. You synthesize information into actionable insights with personality and precision. Always cite sources with specific URLs.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract JSON from Claude's response
    const contentBlock = response.content[0];
    let jsonText = '';
    
    if (contentBlock.type === 'text') {
      jsonText = contentBlock.text;
      // Claude might wrap JSON in markdown code blocks, so extract it
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
    }

    const result = JSON.parse(jsonText);

    const dossier: Dossier = {
      date: new Date().toISOString(),
      summary: result.summary || '',
      keyInsights: result.keyInsights || [],
      strategicImplications: result.strategicImplications || '',
      productOrgShare: {
        audience: 'product-org',
        link: result.productOrgShare?.link || '',
        title: result.productOrgShare?.title || '',
        slackMessage: result.productOrgShare?.slackMessage || ''
      },
      eStaffShare: {
        audience: 'e-staff',
        link: result.eStaffShare?.link || '',
        title: result.eStaffShare?.title || '',
        slackMessage: result.eStaffShare?.slackMessage || '',
        mentions: result.eStaffShare?.mentions || []
      },
      fullAnalysis: result.fullAnalysis || '',
      articles: result.articles || articles.map(a => ({
        url: a.url,
        title: a.title,
        source: a.siteName || new URL(a.url).hostname,
        takeaways: ['', ''] as [string, string],
        shouldRead: false
      }))
    };

    console.log('✅ Dossier generated successfully with Claude Sonnet 4.5');
    return dossier;
  }
}
