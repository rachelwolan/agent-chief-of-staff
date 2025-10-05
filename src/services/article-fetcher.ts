import fetch from 'node-fetch';
// @ts-ignore
import { JSDOM } from 'jsdom';
// @ts-ignore
import { Readability } from '@mozilla/readability';

export interface Article {
  url: string;
  title: string;
  author?: string;
  content: string;
  excerpt?: string;
  publishedDate?: string;
  siteName?: string;
}

export class ArticleFetcherService {
  private async fetchWithTimeout(url: string, timeout: number = 10000): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Build headers with optional Substack authentication
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      };

      // Add Substack authentication if URL is from Substack
      if (url.includes('substack.com') && process.env.SUBSTACK_SESSION_COOKIE) {
        headers['Cookie'] = `substack.sid=${process.env.SUBSTACK_SESSION_COOKIE}`;
      }

      const response = await fetch(url, {
        signal: controller.signal as any,
        headers
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async fetchArticle(url: string): Promise<Article | null> {
    try {
      console.log(`📰 Fetching article: ${url}`);

      const html = await this.fetchWithTimeout(url);
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article) {
        console.log(`❌ Could not parse article: ${url}`);
        return null;
      }

      // Clean up the content
      const cleanContent = this.cleanContent(article.textContent || '');

      return {
        url,
        title: article.title,
        author: article.byline || undefined,
        content: cleanContent,
        excerpt: article.excerpt || cleanContent.slice(0, 300) + '...',
        siteName: article.siteName || new URL(url).hostname
      };
    } catch (error) {
      console.error(`❌ Error fetching article ${url}:`, (error as Error).message);
      return null;
    }
  }

  async fetchMultipleArticles(urls: string[], maxConcurrent: number = 5): Promise<Article[]> {
    const articles: Article[] = [];

    // Process in batches to avoid overwhelming servers
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      const batch = urls.slice(i, i + maxConcurrent);
      const results = await Promise.all(
        batch.map(url => this.fetchArticle(url))
      );

      articles.push(...results.filter((a): a is Article => a !== null));

      // Small delay between batches
      if (i + maxConcurrent < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return articles;
  }

  private cleanContent(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove common footer/header junk
      .replace(/\[.*?\]/g, '')
      // Remove multiple consecutive periods
      .replace(/\.{3,}/g, '...')
      // Trim
      .trim()
      // Limit length to avoid token overload (keep first 3000 chars per article)
      .slice(0, 3000);
  }
}
