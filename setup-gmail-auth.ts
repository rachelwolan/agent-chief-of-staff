import { GmailService } from './packages/core/src/services/gmail.js';
import 'dotenv/config';
import * as readline from 'readline';

/**
 * Setup script to authenticate Gmail using OAuth2
 *
 * This script will:
 * 1. Generate an authorization URL
 * 2. Open it in your browser
 * 3. Have you paste the authorization code
 * 4. Exchange the code for tokens and save them
 */

async function setupGmailAuth() {
  console.log('\n🔐 Work Gmail OAuth Setup\n');
  console.log('This will set up Gmail authentication for the email response drafter.');
  console.log('You will authenticate as your work Gmail account (rachel.wolan@webflow.com).\n');

  const gmailService = new GmailService('work');

  // Check if already authenticated
  if (gmailService.isAuthenticated()) {
    console.log('✅ Work Gmail is already authenticated!');
    console.log('Token found at: ~/.config/claude/work-gmail-token.json\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>(resolve => {
      rl.question('Do you want to re-authenticate? (y/n): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y') {
      console.log('Exiting...');
      return;
    }
  }

  // Generate auth URL
  const authUrl = gmailService.getAuthUrl();

  console.log('\n📋 Step 1: Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n📋 Step 2: Sign in with your work Gmail (rachel.wolan@webflow.com)');
  console.log('📋 Step 3: Grant the requested permissions');
  console.log('📋 Step 4: After granting permissions, your browser will redirect to:');
  console.log('           http://localhost:3000/oauth/callback?code=...');
  console.log('           The page will show an error (that\'s OK - we don\'t have a server running)');
  console.log('📋 Step 5: Copy the "code" parameter from the URL');
  console.log('           (everything after "code=" and before "&" if present)\n');

  // Get the authorization code from user
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const code = await new Promise<string>(resolve => {
    rl.question('Enter the authorization code: ', resolve);
  });
  rl.close();

  if (!code || code.trim() === '') {
    console.error('❌ No authorization code provided. Exiting...');
    process.exit(1);
  }

  try {
    // Exchange code for tokens
    await gmailService.handleAuthCallback(code.trim());

    console.log('\n✅ Work Gmail authentication successful!');
    console.log('✅ Token saved to: ~/.config/claude/work-gmail-token.json');
    console.log('\n🎉 You can now use the email response drafter!\n');
    console.log('Run: npm run email:draft');
  } catch (error) {
    console.error('\n❌ Authentication failed:', (error as Error).message);
    console.error('Please try again.');
    process.exit(1);
  }
}

setupGmailAuth().catch(console.error);
