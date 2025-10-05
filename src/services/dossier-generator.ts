import Anthropic from '@anthropic-ai/sdk';
import { Article } from './article-fetcher.js';

export interface DossierShare {
  audience: 'product-org' | 'e-staff';
  link: string;
  title: string;
  slackMessage: string;
  mentions?: string[];
}

export interface Dossier {
  date: string;
  summary: string; // Executive summary
  themes: string[]; // 3-5 key themes
  trendSignals: string[]; // Emerging patterns
  strategicImplications: string; // What this means for Webflow
  productOrgShare: DossierShare;
  eStaffShare: DossierShare;
  fullDossier: string; // The complete 1000-word synthesis
  articles: Array<{ url: string; title: string; source: string }>; // Article references
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

    const prompt = `You are Rachel's AI Chief of Staff. Rachel is the CPO at Webflow, an Enneagram 7w6 (Enthusiast + Loyalist) who values: learn-it-all > know-it-all, speed as a habit, and being AI-native not AI-enabled.

Today's newsletters contained these articles:

${articlesContext}

**Your task:** Create Rachel's daily "Learn-it-all" dossier.

## Requirements:

1. **Executive Summary** (100 words): What Rachel needs to know right now

2. **Key Themes** (3-5 bullet points): Major patterns across articles
   - Be specific and actionable
   - Connect to product/tech strategy

3. **Trend Signals** (3-5 bullet points): What's emerging
   - Early indicators worth watching
   - Competitive intelligence
   - Market shifts

4. **Strategic Implications** (200 words): What this means for Webflow
   - Product opportunities
   - Competitive threats
   - Strategic bets to consider
   - Frame as possibilities, not prescriptions

5. **Product Org Share**: Pick ONE article to share with the Product org
   - Choose something tactical, actionable, or inspiring
   - Write a casual Slack message (2-3 sentences max)
   - Make it feel personal to Rachel's voice
   - Include the article link and title

6. **E-Staff Share**: Pick ONE article for the executive team
   - Choose something strategic or cross-functional
   - Write a brief Slack message (2-3 sentences) @mentioning relevant people:
     * Linda (CEO) - strategy, growth, board-level thinking
     * Allan (CTO) - infrastructure, technical excellence, platform scale
     * Craig (CFO) - ROI, efficiency, business impact
     * Adrian (CRO) - GTM, premium experiences, market positioning
     * Mike (SVP People) - talent, culture, org effectiveness
   - Apply Decker Cornerstones:
     * Listeners: Who should care (mention them)
     * POV: One clear takeaway
     * Benefits: What's in it for THEM
   - Include the article link and title

7. **Full Dossier** (1000 words): Complete synthesis
   - Conversational but sharp
   - Connect dots across articles
   - Highlight non-obvious insights
   - Include contrarian takes when warranted
   - Cite specific articles with their URLs inline (use markdown links)
   - End with 2-3 provocative questions for Rachel to consider

Return ONLY valid JSON matching this structure:
{
  "summary": "executive summary here",
  "themes": ["theme 1", "theme 2", ...],
  "trendSignals": ["signal 1", "signal 2", ...],
  "strategicImplications": "implications here",
  "productOrgShare": {
    "link": "article url",
    "title": "article title",
    "slackMessage": "casual message here"
  },
  "eStaffShare": {
    "link": "article url",
    "title": "article title",
    "slackMessage": "strategic message with @mentions",
    "mentions": ["Linda", "Allan", "Craig"]
  },
  "fullDossier": "complete 1000-word synthesis with inline article citations as markdown links"
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
      themes: result.themes || [],
      trendSignals: result.trendSignals || [],
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
      fullDossier: result.fullDossier || '',
      articles: articles.map(a => ({
        url: a.url,
        title: a.title,
        source: a.siteName || new URL(a.url).hostname
      }))
    };

    console.log('✅ Dossier generated successfully with Claude Sonnet 4.5');
    return dossier;
  }
}
