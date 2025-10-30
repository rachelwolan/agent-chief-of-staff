#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GmailService } from './services/gmail.js';
import { ArticleFetcherService } from './services/article-fetcher.js';
import { DossierGeneratorService } from './services/dossier-generator.js';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('dossier')
  .description('Generate daily Learn-it-all dossier from Gmail newsletters')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate dossier from today\'s newsletter emails')
  .option('-d, --days <number>', 'Number of days back to fetch newsletters', '1')
  .option('-m, --max <number>', 'Maximum number of newsletters to process', '50')
  .option('-a, --account <type>', 'Gmail account to use: personal or work', 'personal')
  .action(async (options) => {
    const spinner = ora('Initializing...').start();

    try {
      // Check for required API keys
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY not found in .env file');
      }

      // Validate account type
      const accountType = options.account.toLowerCase();
      if (accountType !== 'personal' && accountType !== 'work') {
        throw new Error('Account type must be either "personal" or "work"');
      }

      // Initialize services
      const gmailService = new GmailService(accountType as 'personal' | 'work');
      const articleFetcher = new ArticleFetcherService();
      const dossierGenerator = new DossierGeneratorService(process.env.ANTHROPIC_API_KEY);

      // Check Gmail authentication
      if (!gmailService.isAuthenticated()) {
        spinner.fail('Gmail authentication required');
        console.log(chalk.yellow('\n⚠️  You need to authenticate with Gmail first.'));
        console.log(chalk.cyan('Run: npm run dossier:auth'));
        process.exit(1);
      }

      // Fetch newsletters from Gmail
      spinner.text = 'Fetching newsletters from Gmail...';
      let newsletters;
      try {
        newsletters = await gmailService.getNewsletters(parseInt(options.max));
      } catch (error) {
        if (error instanceof Error && error.message.includes('Label "Newsletter" not found')) {
          spinner.fail('Newsletter label not found');
          console.log(chalk.yellow('\n⚠️  The "Newsletter" label was not found in your Gmail.'));
          console.log(chalk.cyan('\nTo fix this:\n'));
          console.log(chalk.white('1. Go to Gmail in your browser'));
          console.log(chalk.white('2. Create a new label called "Newsletter"'));
          console.log(chalk.white('3. Apply this label to your newsletter emails'));
          console.log(chalk.white('4. Run this command again\n'));

          // Try to show available labels
          try {
            const labels = await gmailService.getLabels();
            const userLabels = labels.filter(l => !l.id.startsWith('Label_') && !['INBOX', 'SENT', 'DRAFT', 'TRASH', 'SPAM', 'UNREAD', 'STARRED', 'IMPORTANT'].includes(l.id));
            if (userLabels.length > 0) {
              console.log(chalk.gray('Available labels in your Gmail:'));
              userLabels.slice(0, 10).forEach(label => {
                console.log(chalk.gray(`  - ${label.name}`));
              });
              if (userLabels.length > 10) {
                console.log(chalk.gray(`  ... and ${userLabels.length - 10} more`));
              }
            }
          } catch (e) {
            // Ignore label listing errors
          }

          process.exit(1);
        }
        throw error;
      }

      if (newsletters.length === 0) {
        spinner.warn('No newsletters found with "Newsletter" label from today');
        console.log(chalk.yellow('\n⚠️  Make sure your newsletter emails are labeled with "Newsletter" in Gmail.'));
        process.exit(0);
      }

      spinner.succeed(`Found ${newsletters.length} newsletters`);
      console.log(chalk.gray(`  Subjects: ${newsletters.map(n => n.subject).join(', ')}\n`));

      // Extract all unique links from newsletters
      spinner.start('Extracting links from newsletters...');
      const allLinks = new Set<string>();
      newsletters.forEach(newsletter => {
        newsletter.links?.forEach(link => allLinks.add(link));
      });

      const links = Array.from(allLinks);
      spinner.succeed(`Extracted ${links.length} unique links`);
      
      if (links.length === 0) {
        spinner.warn('No links found in newsletters');
        process.exit(0);
      }

      console.log(chalk.gray('  Sample links:'));
      links.slice(0, 5).forEach(link => {
        console.log(chalk.gray(`    - ${link}`));
      });
      if (links.length > 5) {
        console.log(chalk.gray(`    ... and ${links.length - 5} more\n`));
      }

      // Fetch article content
      spinner.start('Fetching article content...');
      const articles = await articleFetcher.fetchMultipleArticles(links);

      if (articles.length === 0) {
        spinner.fail('Could not fetch any article content');
        console.log(chalk.yellow('\n⚠️  All links failed to fetch. This could be due to:'));
        console.log(chalk.gray('  - Paywalls or authentication requirements'));
        console.log(chalk.gray('  - Rate limiting'));
        console.log(chalk.gray('  - Invalid or broken links'));
        process.exit(1);
      }

      spinner.succeed(`Successfully fetched ${articles.length} articles`);
      console.log(chalk.gray(`  Articles: ${articles.map(a => a.title).join(', ')}\n`));

      // Generate dossier with Claude Sonnet 4.5
      spinner.start('Generating dossier with Claude Sonnet 4.5...');
      const dossier = await dossierGenerator.generateDossier(articles);
      
      // Add newsletter metadata
      (dossier as any).newsletters = newsletters.map(n => ({
        subject: n.subject,
        from: n.from,
        date: n.date,
        linkCount: n.links?.length || 0
      }));
      
      spinner.succeed('Dossier generated successfully!');

      // Save dossier (use local date, not UTC)
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const dossiersDir = path.join(process.cwd(), 'logs', 'dossiers');
      if (!fs.existsSync(dossiersDir)) {
        fs.mkdirSync(dossiersDir, { recursive: true });
      }

      const dossierPath = path.join(dossiersDir, `${date}.json`);
      fs.writeFileSync(dossierPath, JSON.stringify(dossier, null, 2));

      console.log(chalk.green(`\n✅ Dossier saved to: ${dossierPath}\n`));

      // Display summary
      console.log(chalk.cyan('📋 Executive Summary:'));
      console.log(chalk.white(dossier.summary));
      
      console.log(chalk.cyan('\n🎯 Key Insights:'));
      dossier.keyInsights.forEach((insight: string, i: number) => {
        console.log(chalk.white(`  ${i + 1}. ${insight}`));
      });

      console.log(chalk.cyan('\n💡 Strategic Implications:'));
      console.log(chalk.white(dossier.strategicImplications));

      console.log(chalk.cyan('\n📚 Articles Analyzed:'));
      dossier.articles.forEach((article: any, i: number) => {
        const star = article.shouldRead ? '⭐ ' : '   ';
        console.log(chalk.white(`${star}${i + 1}. ${article.title}`));
        console.log(chalk.gray(`     ${article.url}`));
        console.log(chalk.gray(`     Source: ${article.source}`));
        if (article.takeaways) {
          article.takeaways.forEach((takeaway: string) => {
            console.log(chalk.cyan(`       • ${takeaway}`));
          });
        }
        console.log('');
      });

      console.log(chalk.cyan('🔗 Full dossier available in the JSON file above.'));

    } catch (error) {
      spinner.fail('Failed to generate dossier');
      console.error(chalk.red('\n❌ Error:', error instanceof Error ? error.message : String(error)));
      if (error instanceof Error && error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

program
  .command('auth')
  .description('Authenticate with Gmail')
  .option('-a, --account <type>', 'Gmail account to use: personal or work', 'personal')
  .action(async (options) => {
    const spinner = ora('Initializing Gmail authentication...').start();

    try {
      // Validate account type
      const accountType = options.account.toLowerCase();
      if (accountType !== 'personal' && accountType !== 'work') {
        throw new Error('Account type must be either "personal" or "work"');
      }

      const gmailService = new GmailService(accountType as 'personal' | 'work');

      if (gmailService.isAuthenticated()) {
        spinner.succeed(`Already authenticated with ${accountType} Gmail`);
        console.log(chalk.green(`\n✅ You are already authenticated with ${accountType} Gmail.`));
        process.exit(0);
      }

      spinner.stop();

      const authUrl = gmailService.getAuthUrl();
      console.log(chalk.cyan(`\n🔐 ${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Gmail Authentication Required\n`));
      console.log(chalk.white('Please visit this URL to authorize access:\n'));
      console.log(chalk.blue(authUrl));
      console.log(chalk.gray('\nAfter authorizing, you will receive a code. Paste it here:'));

      // Wait for user input
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(chalk.yellow('Enter authorization code: '), async (code) => {
        rl.close();
        
        const authSpinner = ora('Exchanging code for tokens...').start();
        
        try {
          await gmailService.handleAuthCallback(code.trim());
          authSpinner.succeed(`${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Gmail authentication successful!`);
          console.log(chalk.green(`\n✅ You can now run: npm run dossier:generate${accountType === 'work' ? ' --account work' : ''}`));
        } catch (error) {
          authSpinner.fail('Authentication failed');
          console.error(chalk.red('\n❌ Error:', error instanceof Error ? error.message : String(error)));
          process.exit(1);
        }
      });

    } catch (error) {
      spinner.fail('Authentication setup failed');
      console.error(chalk.red('\n❌ Error:', error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program.parse();
