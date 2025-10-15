#!/usr/bin/env node

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import multer from 'multer';
import { createReadStream } from 'fs';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = dirname(dirname(__dirname));

// Load .env from project root
dotenv.config({ path: join(ROOT_DIR, '.env') });

const app = express();
const PORT = 3000;

// Helper function to format date in local timezone (not UTC)
function formatLocalDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Middleware
app.use(express.static(__dirname));
app.use(express.json());

// Configure multer for file uploads with custom filename
const storage = multer.diskStorage({
    destination: join(ROOT_DIR, 'transcripts', 'recordings'),
    filename: (req, file, cb) => {
        // Use the original filename from the client (already includes meeting context)
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Import Google Calendar Service (use compiled dist version)
import { GoogleCalendarService } from '../../dist/services/google-calendar.js';
const calendarService = new GoogleCalendarService();

// Import Gmail Service
import { GmailService } from '../../dist/services/gmail.js';
const gmailService = new GmailService();

// Import Article Fetcher and Dossier Generator
import { ArticleFetcherService } from '../../dist/services/article-fetcher.js';
import { DossierGeneratorService } from '../../dist/services/dossier-generator.js';
const articleFetcher = new ArticleFetcherService();
const dossierGenerator = new DossierGeneratorService(process.env.ANTHROPIC_API_KEY);

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Create or retrieve Calendar Analyzer Agent
let calendarAgent = null;
async function getCalendarAgent() {
    if (calendarAgent) return calendarAgent;

    // Create the assistant
    calendarAgent = await openai.beta.assistants.create({
        name: "Calendar Priority Analyzer",
        instructions: `You are a calendar analysis expert who identifies strategic priorities from meeting schedules.

Your job is to analyze calendar events and extract the top 3 most important insights about what someone is working on.

**Filter out noise:**
- Travel time, commute, transit
- Meals (lunch, breakfast, dinner, coffee breaks)
- Personal items (meds, appointments, errands)
- Blocked/focus time without specific purpose
- OOO, PTO, vacation
- Generic "holds" or placeholders

**Focus on strategic priorities:**
- Board/executive/leadership team meetings
- Strategic planning or roadmap sessions
- Crisis management or urgent escalations
- Customer/partner meetings (especially if exec-level)
- Cross-functional alignment on major initiatives
- Talent/succession planning
- Innovation or new product exploration
- Skip-level or organizational health conversations

**Output format:**
Return a JSON object with:
- "insights": array of 1-3 short strings (max 10 words each) describing what they're working on
- "status": "available" (0-2 important meetings), "tentative" (3-5), or "busy" (6+)

Be specific (e.g., "Q4 board prep with CFO" not "has meetings").`,
        model: "gpt-4o",
        response_format: { type: "json_object" }
    });

    console.log('✅ Created Calendar Analyzer Agent:', calendarAgent.id);
    return calendarAgent;
}

// API: Get all agents
app.get('/api/agents', async (req, res) => {
    try {
        const agentsDir = join(ROOT_DIR, 'agents');
        const files = await readdir(agentsDir);
        const agents = [];

        for (const file of files) {
            if (file.endsWith('.md')) {
                const content = await readFile(join(agentsDir, file), 'utf-8');
                const name = file.replace('.md', '');

                // Parse agent metadata from markdown
                const agent = {
                    id: name,
                    name: formatAgentName(name),
                    description: extractDescription(content),
                    status: checkAgentStatus(name),
                    capabilities: extractCapabilities(content),
                    requirements: extractRequirements(content),
                    inputExample: extractInputExample(content)
                };

                agents.push(agent);
            }
        }

        res.json(agents);
    } catch (error) {
        console.error('Error loading agents:', error);
        res.status(500).json({ error: 'Failed to load agents' });
    }
});

// API: Get recent outputs
app.get('/api/outputs', async (req, res) => {
    try {
        const outputs = [
            {
                agent: 'podcast-prep',
                name: 'Product Coalition Podcast Prep',
                timestamp: new Date().toISOString(),
                preview: 'Comprehensive preparation for Webflow AI strategy discussion...',
                file: 'product-coalition-podcast-prep.md'
            }
        ];

        // Check for logs directory
        try {
            const logsDir = join(ROOT_DIR, 'logs');
            const files = await readdir(logsDir);

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await readFile(join(logsDir, file), 'utf-8');
                    const log = JSON.parse(content);
                    outputs.push({
                        agent: log.agentFile?.replace('.md', '') || 'unknown',
                        name: log.agentFile || file,
                        timestamp: log.timestamp || new Date().toISOString(),
                        preview: JSON.stringify(log.result || {}).slice(0, 100) + '...',
                        file: file
                    });
                }
            }
        } catch (e) {
            // Logs directory might not exist
        }

        res.json(outputs);
    } catch (error) {
        console.error('Error loading outputs:', error);
        res.status(500).json({ error: 'Failed to load outputs' });
    }
});

// API: Get output file content
app.get('/api/output/:filename', async (req, res) => {
    try {
        const { filename } = req.params;

        // Try multiple locations where output files might be
        const possiblePaths = [
            join(ROOT_DIR, filename),
            join(ROOT_DIR, 'logs', filename),
            join(ROOT_DIR, 'outputs', filename)
        ];

        for (const path of possiblePaths) {
            try {
                const content = await readFile(path, 'utf-8');
                res.type('text/plain').send(content);
                return;
            } catch (e) {
                // Try next path
            }
        }

        res.status(404).json({ error: 'Output file not found' });
    } catch (error) {
        console.error('Error reading output file:', error);
        res.status(500).json({ error: 'Failed to read output file' });
    }
});

// API: Run agent
app.post('/api/run-agent', async (req, res) => {
    try {
        const { agentId, input } = req.body;
        const agentFile = `agents/${agentId}.md`;

        // Save input to temp file
        const tempInputFile = `/tmp/agent-input-${Date.now()}.json`;
        await writeFile(tempInputFile, JSON.stringify(input));

        // Run the agent
        const command = `cd .. && npm run dev && node dist/cli.js run ${agentFile} < ${tempInputFile}`;
        const { stdout, stderr } = await execAsync(command);

        res.json({
            success: true,
            output: stdout,
            error: stderr
        });
    } catch (error) {
        console.error('Error running agent:', error);
        res.status(500).json({ error: 'Failed to run agent' });
    }
});

// Helper functions
function formatAgentName(name) {
    return name.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function extractDescription(content) {
    const match = content.match(/## Job Statement\n(.+?)(?=\n##|\n\n)/s);
    if (match) {
        return match[1].trim().split('\n')[0];
    }
    return 'AI-powered agent for specialized tasks';
}

function extractCapabilities(content) {
    const match = content.match(/## Capabilities\n([\s\S]+?)(?=\n##)/);
    if (match) {
        return match[1].trim().split('\n')
            .filter(line => line.startsWith('-'))
            .map(line => line.substring(2).trim());
    }
    return [];
}

function extractRequirements(content) {
    if (content.includes('Google Calendar')) return ['Google Calendar API configured'];
    if (content.includes('Slack')) return ['Slack MCP server configured', 'Slack OAuth tokens'];
    return ['None'];
}

function extractInputExample(content) {
    const match = content.match(/### Input\n```json\n([\s\S]+?)\n```/);
    if (match) {
        try {
            return JSON.parse(match[1]);
        } catch (e) {
            // Return default example
        }
    }
    return { input: "example" };
}

function checkAgentStatus(name) {
    // Calendar is configured and working
    if (name.includes('calendar')) {
        return 'ready';
    }
    // Slack would need config
    if (name.includes('slack')) {
        return 'needs-config';
    }
    return 'ready';
}

// Calendar API endpoints
app.get('/api/calendar/today', async (req, res) => {
    try {
        const events = await calendarService.getTodayEvents();
        res.json(events);
    } catch (error) {
        console.error('Error fetching today\'s events:', error);
        res.status(500).json({ error: 'Failed to fetch calendar events', message: error.message });
    }
});

app.get('/api/calendar/week', async (req, res) => {
    try {
        const events = await calendarService.getWeekEvents();
        res.json(events);
    } catch (error) {
        console.error('Error fetching week events:', error);
        res.status(500).json({ error: 'Failed to fetch calendar events', message: error.message });
    }
});

app.get('/api/calendar/upcoming', async (req, res) => {
    try {
        const count = parseInt(req.query.count) || 10;
        const events = await calendarService.getUpcomingEvents(count);
        res.json(events);
    } catch (error) {
        console.error('Error fetching upcoming events:', error);
        res.status(500).json({ error: 'Failed to fetch calendar events', message: error.message });
    }
});

app.get('/api/calendar/day', async (req, res) => {
    try {
        const dateStr = req.query.date; // YYYY-MM-DD format
        if (!dateStr) {
            return res.status(400).json({ error: 'Date parameter required (YYYY-MM-DD)' });
        }

        const date = new Date(dateStr + 'T00:00:00');
        const events = await calendarService.getEventsForDate(date);
        res.json(events);
    } catch (error) {
        console.error('Error fetching events for date:', error);
        res.status(500).json({ error: 'Failed to fetch calendar events', message: error.message });
    }
});

app.get('/api/calendar/team-calendars', async (req, res) => {
    try {
        const dateStr = req.query.date;
        const emails = req.query.emails ? req.query.emails.split(',') : [];

        if (!dateStr || emails.length === 0) {
            return res.status(400).json({ error: 'Date and emails parameters required' });
        }

        const date = new Date(dateStr + 'T00:00:00');
        const teamCalendars = await calendarService.getTeamCalendars(emails, date);
        res.json(teamCalendars);
    } catch (error) {
        console.error('Error fetching team calendars:', error);
        res.status(500).json({ error: 'Failed to fetch team calendars', message: error.message });
    }
});

// API: Get team calendar insights using Calendar Analyzer agent
app.get('/api/calendar/team-summary', async (req, res) => {
    try {
        const dateStr = req.query.date;
        const emails = req.query.emails ? req.query.emails.split(',') : [];

        if (!dateStr || emails.length === 0) {
            return res.status(400).json({ error: 'Date and emails parameters required' });
        }

        const date = new Date(dateStr + 'T00:00:00');
        const teamCalendars = await calendarService.getTeamCalendars(emails, date);

        // For each person, analyze their calendar with the agent
        const summaries = {};

        for (const email of emails) {
            const events = teamCalendars[email] || [];
            const personName = email.split('@')[0].replace('.', ' ');

            if (events.length === 0) {
                summaries[email] = {
                    insights: ['No meetings scheduled'],
                    status: 'available'
                };
                continue;
            }

            // Format events for the agent
            const eventsList = events.map(e =>
                `- ${e.summary} (${new Date(e.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${new Date(e.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })})`
            ).join('\n');

            // Build the agent prompt
            const prompt = `You are analyzing ${personName}'s calendar to identify their true strategic priorities.

**Calendar Events:**
${eventsList}

**Analysis Instructions:**

1. **Filter Noise** - Ignore these categories:
   - Travel time, commute, transit
   - Meals (lunch, breakfast, dinner, coffee breaks)
   - Personal items (meds, appointments, errands)
   - Blocked/focus time without specific purpose
   - OOO, PTO, vacation
   - Generic "holds" or placeholders

2. **Identify Strategic Priorities** - Look for:
   - Board/executive/leadership team meetings
   - Strategic planning or roadmap sessions
   - Crisis management or urgent escalations
   - Customer/partner meetings (especially if exec-level)
   - Cross-functional alignment on major initiatives
   - Talent/succession planning
   - Innovation or new product exploration
   - Skip-level or organizational health conversations

3. **Extract Top 3 Insights** - For each priority:
   - Be specific (not "has meetings" but "preparing Q4 board presentation")
   - Focus on WHAT they're working on, not HOW MANY meetings
   - Keep it scannable (max 10 words per insight)
   - Prioritize by time investment + strategic importance

4. **Determine Status:**
   - "available" if 0-2 important meetings
   - "tentative" if 3-5 important meetings
   - "busy" if 6+ important meetings

**Output Format:**
Return ONLY valid JSON matching this schema:
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "status": "available|tentative|busy"
}`;

            try {
                // Get the calendar analyzer agent
                const agent = await getCalendarAgent();

                // Create a thread for this analysis
                const thread = await openai.beta.threads.create();

                // Add the calendar data as a message
                await openai.beta.threads.messages.create(thread.id, {
                    role: "user",
                    content: `Analyze ${personName}'s calendar and provide insights.\n\nCalendar events:\n${eventsList}`
                });

                // Run the agent
                const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
                    assistant_id: agent.id
                });

                if (run.status === 'completed') {
                    const messages = await openai.beta.threads.messages.list(thread.id);
                    const responseText = messages.data[0].content[0].text.value;
                    const analysis = JSON.parse(responseText);
                    summaries[email] = analysis;
                } else {
                    // Log full run object for debugging
                    console.error(`Agent run failed for ${email}. Status: ${run.status}`);
                    console.error('Full run object:', JSON.stringify(run, null, 2));
                    throw new Error(`Agent run failed with status: ${run.status}`);
                }
            } catch (error) {
                console.error(`Error analyzing calendar for ${email}:`, error.message);

                // Fallback to smart filtering if API fails
                // Filter out travel, lodging, meals, personal items, holds, blocked time
                const noisePatterns = [
                    /travel|commute|transit|airport|flight/i,
                    /stay:|hotel|lodging|confirmation/i,
                    /lunch|breakfast|dinner|coffee break/i,
                    /^(take|pick up|drop off|get)/i,  // personal tasks
                    /meds|medication|doctor|dentist|personal/i,
                    /^(blocked?|focus|hold|placeholder)/i,
                    /^(pto|ooo|out of office|vacation|off)/i,
                    /^home$/i,  // just "home" as event
                ];

                const importantEvents = events.filter(e => {
                    const summary = e.summary.trim();
                    return !noisePatterns.some(pattern => pattern.test(summary));
                });

                // If we filtered everything, show message about light schedule
                const insights = importantEvents.length > 0
                    ? importantEvents.slice(0, 3).map(e => e.summary)
                    : ['Light schedule - mostly personal/travel items'];

                summaries[email] = {
                    insights: insights,
                    status: importantEvents.length >= 6 ? 'busy' : importantEvents.length >= 3 ? 'tentative' : 'available'
                };
            }
        }

        res.json(summaries);
    } catch (error) {
        console.error('Error generating team summary:', error);
        res.status(500).json({ error: 'Failed to generate team summary', message: error.message });
    }
});

// Gmail OAuth endpoints
// Step 1: Start OAuth flow
app.get('/oauth/gmail/start', (req, res) => {
    try {
        const authUrl = gmailService.getAuthUrl();
        res.redirect(authUrl);
    } catch (error) {
        console.error('Error starting Gmail OAuth:', error);
        res.status(500).json({ error: 'Failed to start Gmail OAuth' });
    }
});

// Step 2: OAuth callback
app.get('/oauth/gmail/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).send('No authorization code provided');
        }

        await gmailService.handleAuthCallback(code);
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Gmail Connected</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }
                    .container {
                        text-align: center;
                        background: rgba(255, 255, 255, 0.1);
                        padding: 3rem;
                        border-radius: 1rem;
                        backdrop-filter: blur(10px);
                    }
                    h1 { margin: 0 0 1rem 0; font-size: 2.5rem; }
                    p { margin: 0 0 2rem 0; font-size: 1.2rem; opacity: 0.9; }
                    a {
                        display: inline-block;
                        background: white;
                        color: #667eea;
                        padding: 0.75rem 2rem;
                        border-radius: 0.5rem;
                        text-decoration: none;
                        font-weight: 600;
                        transition: transform 0.2s;
                    }
                    a:hover { transform: translateY(-2px); }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>✅ Gmail Connected!</h1>
                    <p>Your Gmail account has been successfully connected.</p>
                    <a href="/">Return to Dashboard</a>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Error in Gmail OAuth callback:', error);
        res.status(500).send('Failed to complete Gmail authentication');
    }
});

// Check Gmail auth status
app.get('/api/gmail/status', (req, res) => {
    res.json({ authenticated: gmailService.isAuthenticated() });
});

// Get newsletters
app.get('/api/gmail/newsletters', async (req, res) => {
    try {
        const maxResults = parseInt(req.query.maxResults) || 50;
        const newsletters = await gmailService.getNewsletters(maxResults);
        res.json(newsletters);
    } catch (error) {
        console.error('Error fetching newsletters:', error);
        res.status(500).json({ error: 'Failed to fetch newsletters', message: error.message });
    }
});

// Daily Dossier Generation
app.post('/api/dossier/generate', async (req, res) => {
    try {
        console.log('🔄 Starting dossier generation...');

        // Step 1: Fetch newsletters from Gmail (today only)
        const newsletters = await gmailService.getNewsletters(50); // Today's newsletters
        console.log(`📧 Found ${newsletters.length} newsletters from today`);

        // Step 2: Extract all article links from newsletters
        let allLinks = [];
        for (const newsletter of newsletters) {
            if (newsletter.links && Array.isArray(newsletter.links)) {
                allLinks.push(...newsletter.links);
            }
        }

        // Deduplicate links (process all of them, not just 10)
        const uniqueLinks = [...new Set(allLinks)];
        console.log(`🔗 Extracted ${uniqueLinks.length} unique article links`);

        if (uniqueLinks.length === 0) {
            return res.json({
                error: 'No articles found',
                message: 'No article links were found in recent newsletters'
            });
        }

        // Step 3: Fetch article content
        const articles = await articleFetcher.fetchMultipleArticles(uniqueLinks);
        console.log(`📰 Successfully fetched ${articles.length} articles`);

        if (articles.length === 0) {
            return res.json({
                error: 'Failed to fetch articles',
                message: 'Could not retrieve content from any of the article links'
            });
        }

        // Step 4: Generate dossier
        const dossier = await dossierGenerator.generateDossier(articles);
        console.log('✅ Dossier generated successfully');

        // Add newsletter metadata to dossier
        dossier.newsletters = newsletters.map(n => ({
            subject: n.subject,
            from: n.from,
            date: n.date,
            linkCount: n.links?.length || 0
        }));

        // Step 5: Save dossier to logs
        const dossiersDir = join(ROOT_DIR, 'logs', 'dossiers');
        if (!existsSync(dossiersDir)) {
            await mkdir(dossiersDir, { recursive: true });
        }

        const dateStr = formatLocalDate();
        const dossierPath = join(dossiersDir, `${dateStr}.json`);
        await writeFile(dossierPath, JSON.stringify(dossier, null, 2));
        console.log(`💾 Dossier saved to ${dossierPath}`);

        // Archive newsletters after successful processing
        const newsletterIds = newsletters.map(n => n.id);
        if (newsletterIds.length > 0) {
            console.log(`📥 Archiving ${newsletterIds.length} newsletters...`);
            await gmailService.archiveMessages(newsletterIds);
        }

        res.json(dossier);
    } catch (error) {
        console.error('❌ Error generating dossier:', error);
        res.status(500).json({
            error: 'Failed to generate dossier',
            message: error.message
        });
    }
});

// Get today's dossier (if exists)
app.get('/api/dossier/today', async (req, res) => {
    try {
        const dateStr = new Date().toISOString().split('T')[0];
        const dossierPath = join(ROOT_DIR, 'logs', 'dossiers', `${dateStr}.json`);

        if (!existsSync(dossierPath)) {
            return res.json(null);
        }

        const dossierData = await readFile(dossierPath, 'utf-8');
        res.json(JSON.parse(dossierData));
    } catch (error) {
        console.error('Error loading today\'s dossier:', error);
        res.status(500).json({ error: 'Failed to load dossier' });
    }
});

// Index Card API endpoints
// Get index card for a specific date
app.get('/api/index-card/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const cardPath = join(ROOT_DIR, 'logs', 'index-cards', `${date}.json`);

        if (!existsSync(cardPath)) {
            return res.json(null);
        }

        const cardData = await readFile(cardPath, 'utf-8');
        res.json(JSON.parse(cardData));
    } catch (error) {
        console.error('Error loading index card:', error);
        res.status(500).json({ error: 'Failed to load index card' });
    }
});

// Save index card
app.post('/api/index-card', async (req, res) => {
    try {
        const card = req.body;
        const cardsDir = join(ROOT_DIR, 'logs', 'index-cards');

        // Create directory if it doesn't exist
        if (!existsSync(cardsDir)) {
            await mkdir(cardsDir, { recursive: true });
        }

        const cardPath = join(cardsDir, `${card.date}.json`);
        await writeFile(cardPath, JSON.stringify(card, null, 2));

        res.json({ success: true, card });
    } catch (error) {
        console.error('Error saving index card:', error);
        res.status(500).json({ error: 'Failed to save index card' });
    }
});

// Process meeting recording - Upload, Transcribe with Whisper, Process with Claude, Post to Slack
app.post('/api/meeting/process-recording', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        console.log('📁 Received audio file:', req.file.originalname);
        console.log('📝 Meeting context:', {
            title: req.body.meetingTitle || '(none)',
            attendees: req.body.meetingAttendees || '(none)'
        });

        // File is already saved with correct name in recordings directory
        const audioPath = req.file.path;

        // Process the audio file using the meeting processor script
        // This will: transcribe (with auto-splitting if needed), analyze, and post to Slack
        console.log('🚀 Starting meeting processor...');
        const { exec } = await import('child_process');
        const util = await import('util');
        const execPromise = util.promisify(exec);

        const { stdout, stderr } = await execPromise(
            `npm run meeting:process "${audioPath}"`,
            { cwd: ROOT_DIR }
        );

        console.log('✅ Meeting processed and posted to Slack');

        res.json({
            success: true,
            message: 'Recording processed and posted to Slack',
            filename: req.file.originalname
        });

    } catch (error) {
        console.error('Error processing recording:', error);
        res.status(500).json({
            error: 'Failed to process recording',
            details: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║     Chief of Staff Agent Manager          ║
║                                            ║
║     Running at: http://localhost:${PORT}     ║
║                                            ║
║     Press Ctrl+C to stop                  ║
╚════════════════════════════════════════════╝
    `);
});
