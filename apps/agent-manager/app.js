// Agent Manager Application
let agents = [];
let selectedAgent = null;
let outputs = [];
let calendarEvents = [];
let currentView = 'calendar';
let currentDate = new Date(); // Track which day we're viewing

// Team member definitions - only Linda and my team
const LINDA = [
    { name: 'Linda Tong', email: 'linda.tong@webflow.com' }
];

const MY_TEAM = [
    { name: 'Jessica Fain', email: 'jessica.fain@webflow.com' },
    { name: 'Ben Haefele', email: 'ben.haefele@webflow.com' },
    { name: 'Kevin Wong', email: 'kevin.wong@webflow.com' },
    { name: 'Kirat Chhina', email: 'kirat.chhina@webflow.com' },
    { name: 'Anthony Morelli', email: 'anthony.morelli@webflow.com' },
    { name: 'Ashwini Chaube', email: 'ashwini.chaube@webflow.com' }
];

// Helper function to format date in local timezone (not UTC)
function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadCalendar();
    loadIndexCard(); // Load the notecard for today
    loadAgents();
    loadOutputs();
    setInterval(() => {
        if (isToday(currentDate)) {
            loadCalendar(); // Only auto-refresh if viewing today
        }
    }, 5 * 60 * 1000); // Refresh every 5 minutes
});

// View switching
function showView(viewName) {
    // Hide all views
    document.getElementById('calendar-view').style.display = 'none';
    document.getElementById('agents-view').style.display = 'none';
    document.getElementById('outputs-view').style.display = 'none';
    document.getElementById('dossier-view').style.display = 'none';

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected view
    document.getElementById(`${viewName}-view`).style.display = 'block';
    currentView = viewName;

    // Load data if needed
    if (viewName === 'calendar') {
        loadCalendar();
        loadIndexCard(); // Load index card in calendar view
    } else if (viewName === 'agents') {
        loadAgents();
    } else if (viewName === 'outputs') {
        loadOutputs();
    } else if (viewName === 'dossier') {
        loadDailyDossier();
    }
}

// Calendar functions
async function loadCalendar() {
    try {
        // Format date as YYYY-MM-DD for API (use local timezone)
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const response = await fetch(`/api/calendar/day?date=${dateStr}`);
        calendarEvents = await response.json();
        renderCalendar();
    } catch (error) {
        console.error('Error loading calendar:', error);
        document.getElementById('calendar-content').innerHTML = `
            <div class="error-state">
                <p>⚠️ Unable to load calendar. Make sure you've authenticated with Google Calendar.</p>
                <button class="btn-primary" onclick="window.location.href='/auth-server'">Authenticate</button>
            </div>
        `;
    }
}

// Navigation functions
function changeDay(offset) {
    currentDate.setDate(currentDate.getDate() + offset);
    loadCalendar();
    loadIndexCard();
}

function goToToday() {
    currentDate = new Date();
    loadCalendar();
    loadIndexCard();
}

function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function renderCalendar() {
    const dateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const isTodayView = isToday(currentDate);

    // Calculate days from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const viewDate = new Date(currentDate);
    viewDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.round((viewDate - today) / (1000 * 60 * 60 * 24));

    let dateLabel = dateStr;
    if (daysDiff === 0) dateLabel = `Today - ${dateStr}`;
    else if (daysDiff === 1) dateLabel = `Tomorrow - ${dateStr}`;
    else if (daysDiff === -1) dateLabel = `Yesterday - ${dateStr}`;
    else if (daysDiff > 0) dateLabel = `${dateStr} (${daysDiff} days ahead)`;
    else dateLabel = `${dateStr} (${Math.abs(daysDiff)} days ago)`;

    document.getElementById('dashboard-date').innerHTML = `
        <div class="date-navigation">
            <h1 class="page-title">Today's Briefing</h1>
            <div class="nav-controls">
                <button class="nav-btn" onclick="changeDay(-7)" title="Previous week">« Week</button>
                <button class="nav-btn" onclick="changeDay(-1)" title="Previous day">‹ Day</button>
                <span class="date-label">${dateLabel}</span>
                <button class="nav-btn" onclick="changeDay(1)" title="Next day">Day ›</button>
                <button class="nav-btn" onclick="changeDay(7)" title="Next week">Week »</button>
                ${!isTodayView ? '<button class="nav-btn today-btn" onclick="goToToday()">Today</button>' : ''}
            </div>
        </div>
    `;
    document.getElementById('meeting-count').textContent = `${calendarEvents.length} meetings`;

    // Render Next Up only for today
    if (isTodayView) {
        const hasUpcoming = renderNextUp();
        document.getElementById('next-up-section').style.display = hasUpcoming ? 'block' : 'none';
    } else {
        document.getElementById('next-up-section').style.display = 'none';
    }

    // Render calendar events with color legend
    const content = calendarEvents.length > 0
        ? `
            <div class="color-legend">
                <div class="legend-item"><span class="legend-dot" style="background: #DBADFF;"></span> Free/Focus</div>
                <div class="legend-item"><span class="legend-dot" style="background: #FBD75B;"></span> 1:1s/Team</div>
                <div class="legend-item"><span class="legend-dot" style="background: #46D6DB;"></span> 1:1s/eStaff</div>
                <div class="legend-item"><span class="legend-dot" style="background: #51B749;"></span> External/Interviews</div>
                <div class="legend-item"><span class="legend-dot" style="background: #FFB878;"></span> Agenda/Reminder</div>
                <div class="legend-item"><span class="legend-dot" style="background: #DC2127;"></span> Important</div>
                <div class="legend-item"><span class="legend-dot" style="background: #E1E1E1;"></span> Break/Food/Travel</div>
            </div>
            ${renderMeetings(calendarEvents)}
        `
        : '<div class="empty-state"><p>No meetings scheduled! Free day ahead.</p></div>';

    document.getElementById('calendar-content').innerHTML = content;
}

function renderNextUp() {
    const now = new Date();
    const upcoming = calendarEvents.filter(e => new Date(e.start) > now);

    if (upcoming.length === 0) {
        document.getElementById('next-up-content').innerHTML = '';
        return false;
    }

    const next = upcoming[0];
    const timeUntil = Math.round((new Date(next.start) - now) / (1000 * 60));
    const startTime = new Date(next.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Check if this is a task from Kelly
    const isKellyTask = isFocusBlock(next);
    const urgentClass = timeUntil < 15 ? 'urgent' : timeUntil < 60 ? 'soon' : '';

    // Format attendees (first name only for cleaner display)
    const attendeeNames = next.attendees && next.attendees.length > 0
        ? next.attendees.map(email => {
            const name = email.split('@')[0].replace(/\./g, ' ');
            return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          }).join(', ')
        : '';

    // Find meeting link from location or description
    let meetingUrl = null;
    if (next.location && (next.location.includes('http') || next.location.includes('zoom.us'))) {
        meetingUrl = next.location;
    } else if (next.description) {
        const zoomMatch = next.description.match(/https?:\/\/[^\s]*zoom\.us\/[^\s]*/i);
        const meetMatch = next.description.match(/https?:\/\/meet\.google\.com\/[^\s]*/i);
        const teamsMatch = next.description.match(/https?:\/\/teams\.microsoft\.com\/[^\s]*/i);
        meetingUrl = zoomMatch?.[0] || meetMatch?.[0] || teamsMatch?.[0];
    }

    document.getElementById('next-up-content').innerHTML = `
        <div class="next-up-card ${urgentClass}">
            <div class="next-up-header">
                <h3>${isKellyTask ? '✅ Next Task' : '🎯 Next Up'}</h3>
                <span class="time-badge">${timeUntil < 60 ? `In ${timeUntil} min` : startTime}</span>
            </div>
            <h2>${next.summary}</h2>
            <div class="next-up-details">
                ${isKellyTask ? `
                    <div class="detail-item">
                        <strong>📋 Task:</strong> Complete and accept when done
                    </div>
                ` : attendeeNames ? `
                    <div class="detail-item">
                        <strong>👥 With:</strong> ${attendeeNames}
                    </div>
                ` : ''}
                ${meetingUrl ? `
                    <div class="detail-item">
                        <strong>📍 Link:</strong> <a href="${meetingUrl}" target="_blank">Join Meeting</a>
                    </div>
                ` : next.location ? `
                    <div class="detail-item">
                        <strong>📍 Location:</strong> ${next.location}
                    </div>
                ` : ''}
            </div>
            <div class="next-up-actions">
                ${meetingUrl ?
                    `<button class="btn-primary" onclick="window.open('${meetingUrl}', '_blank')">Join Now</button>` : ''}
                ${isKellyTask ?
                    `<button class="btn-primary" onclick="markTaskDone('${next.id}')">Mark Complete</button>` :
                    `<button class="btn-secondary" onclick="generatePrep('${next.id}')">Quick Prep</button>`}
            </div>
        </div>
    `;
    return true;
}

function renderMeetings(events) {
    const grouped = groupByTimeOfDay(events);
    let html = '';

    if (grouped.morning.length > 0) {
        html += `<div class="time-group"><h3 class="time-group-title">☀️ Morning</h3>`;
        html += grouped.morning.map(e => renderMeetingCard(e)).join('');
        html += `</div>`;
    }

    if (grouped.afternoon.length > 0) {
        html += `<div class="time-group"><h3 class="time-group-title">🌤️ Afternoon</h3>`;
        html += grouped.afternoon.map(e => renderMeetingCard(e)).join('');
        html += `</div>`;
    }

    if (grouped.evening.length > 0) {
        html += `<div class="time-group"><h3 class="time-group-title">🌙 Evening</h3>`;
        html += grouped.evening.map(e => renderMeetingCard(e)).join('');
        html += `</div>`;
    }

    return html;
}

// Google Calendar color mapping
const CALENDAR_COLORS = {
    '1': { color: '#A4BDFC', name: 'Lavender' },
    '2': { color: '#7AE7BF', name: 'Sage' },
    '3': { color: '#DBADFF', name: 'Grape' },      // Free/Focus (purple)
    '4': { color: '#FF887C', name: 'Flamingo' },
    '5': { color: '#FBD75B', name: 'Banana' },     // 1:1s/Team (yellow)
    '6': { color: '#FFB878', name: 'Tangerine' },  // Agenda/Reminder (orange)
    '7': { color: '#46D6DB', name: 'Peacock' },    // 1:1s/eStaff (blue)
    '8': { color: '#E1E1E1', name: 'Graphite' },   // Break/Food/Travel (gray)
    '9': { color: '#5484ED', name: 'Blueberry' },
    '10': { color: '#51B749', name: 'Basil' },     // External/Interviews (green)
    '11': { color: '#DC2127', name: 'Tomato' },    // Important (red)
};

function getEventColor(event) {
    return event.colorId ? CALENDAR_COLORS[event.colorId]?.color : '#039BE5';
}

function getMeetingLink(event, eventColor, isTask) {
    // Check for links in multiple places: location, description, notes
    let meetingUrl = null;
    let linkLabel = 'Join';

    // 1. Check location field
    if (event.location && (event.location.includes('http') || event.location.includes('zoom.us'))) {
        meetingUrl = event.location;
    }

    // 2. Check description/notes for video conferencing links
    // Decode HTML entities first
    const decodeHtml = (html) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };

    const textToSearch = decodeHtml((event.description || '') + ' ' + (event.notes || ''));
    if (!meetingUrl && textToSearch) {
        const zoomMatch = textToSearch.match(/https?:\/\/[^\s<]*zoom\.us\/[^\s<)]*/i);
        const meetMatch = textToSearch.match(/https?:\/\/meet\.google\.com\/[^\s<)]*/i);
        const teamsMatch = textToSearch.match(/https?:\/\/teams\.microsoft\.com\/[^\s<)]*/i);
        const docMatch = textToSearch.match(/https?:\/\/docs\.google\.com\/[^\s<)]*/i);
        const notionMatch = textToSearch.match(/https?:\/\/[^\s]*notion\.(so|site)\/[^\s<)]*/i);
        const figmaMatch = textToSearch.match(/https?:\/\/[^\s]*figma\.com\/[^\s<)]*/i);
        const githubMatch = textToSearch.match(/https?:\/\/github\.com\/[^\s<)]*/i);
        const slackMatch = textToSearch.match(/https?:\/\/[^\s]*slack\.com\/[^\s<)]*/i);
        const linearMatch = textToSearch.match(/https?:\/\/linear\.app\/[^\s<)]*/i);

        if (zoomMatch) {
            meetingUrl = zoomMatch[0];
            linkLabel = 'Zoom';
        } else if (meetMatch) {
            meetingUrl = meetMatch[0];
            linkLabel = 'Meet';
        } else if (teamsMatch) {
            meetingUrl = teamsMatch[0];
            linkLabel = 'Teams';
        } else if (docMatch) {
            meetingUrl = docMatch[0];
            linkLabel = 'Doc';
        } else if (notionMatch) {
            meetingUrl = notionMatch[0];
            linkLabel = 'Notion';
        } else if (figmaMatch) {
            meetingUrl = figmaMatch[0];
            linkLabel = 'Figma';
        } else if (githubMatch) {
            meetingUrl = githubMatch[0];
            linkLabel = 'GitHub';
        } else if (slackMatch) {
            meetingUrl = slackMatch[0];
            linkLabel = 'Slack';
        } else if (linearMatch) {
            meetingUrl = linearMatch[0];
            linkLabel = 'Linear';
        }
    }

    if (meetingUrl) {
        // Clean up URL (remove trailing punctuation)
        meetingUrl = meetingUrl.replace(/[,;.)\]]+$/, '');
        // Use consistent teal color for all meeting links
        return `<a href='${meetingUrl}' target='_blank' class='meeting-link' style='background: #46D6DB;'>${linkLabel}</a>`;
    } else if (isTask) {
        return `<button class='meeting-link' onclick="markTaskDone('${event.id}'); return false;">Done</button>`;
    }

    return '';
}

function renderMeetingCard(event) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const duration = (end - start) / (1000 * 60);
    const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const endTime = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const isPast = end < new Date();
    const isCurrent = start < new Date() && end > new Date();
    const isTask = isFocusBlock(event);
    const eventColor = getEventColor(event);

    // Format attendees (first names only, max 2)
    const attendeeNames = event.attendees && event.attendees.length > 0
        ? event.attendees.slice(0, 2).map(email => {
            const name = email.split('@')[0].replace(/\./g, ' ');
            return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          }).join(', ') + (event.attendees.length > 2 ? ` +${event.attendees.length - 2}` : '')
        : '';

    return `
        <div class="meeting-card-compact ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}" style="border-left-color: ${eventColor};">
            <div class="meeting-time-compact">${startTime}</div>
            <div class="meeting-content-compact">
                <div class="meeting-title-compact">${event.summary}</div>
                ${attendeeNames && !isTask ? `<span class="meeting-attendees-compact">${attendeeNames}</span>` : ''}
            </div>
            ${getMeetingLink(event, eventColor, isTask) ? `<div class="meeting-link-compact">${getMeetingLink(event, eventColor, isTask)}</div>` : ''}
        </div>
    `;
}

function groupByTimeOfDay(events) {
    return events.reduce((acc, event) => {
        const hour = new Date(event.start).getHours();
        if (hour < 12) acc.morning.push(event);
        else if (hour < 17) acc.afternoon.push(event);
        else acc.evening.push(event);
        return acc;
    }, { morning: [], afternoon: [], evening: [] });
}

// Check if event is a focus block task from Kelly
function isFocusBlock(event) {
    const summary = event.summary.toLowerCase();
    return (summary.includes('free') || summary.includes('focus')) &&
           event.attendees &&
           event.attendees.some(email => email.toLowerCase().includes('kelly'));
}

function markTaskDone(eventId) {
    alert('Task marked complete! This will accept the calendar event.');
    // TODO: Implement calendar event acceptance
}

function generatePrep(eventId) {
    alert('Auto-prep feature coming soon! Will generate AI-powered prep for this meeting.');
    // TODO: Implement auto-prep agent call
}

// Load agents from the agents directory
async function loadAgents() {
    try {
        const response = await fetch('/api/agents');
        agents = await response.json();
        renderAgents();
    } catch (error) {
        // Fallback to static data for demo
        agents = [
            {
                id: 'meeting-prep',
                name: 'Meeting Preparation',
                description: 'Prepares comprehensive briefings for upcoming meetings with Google Calendar integration',
                status: 'ready',
                capabilities: [
                    'Fetch meeting details from Google Calendar',
                    'Research attendees and their recent work',
                    'Generate talking points and questions',
                    'Create pre-read summaries'
                ],
                requirements: ['Google Calendar API configured'],
                inputExample: {
                    meeting: {
                        calendarEventId: "event_abc123xyz"
                    }
                }
            },
            {
                id: 'task-manager',
                name: 'Task Manager',
                description: 'Manages tasks, deadlines, and priorities across projects',
                status: 'ready',
                capabilities: [
                    'Create and prioritize task lists',
                    'Track deadlines and dependencies',
                    'Generate daily/weekly summaries',
                    'Identify blocking tasks'
                ],
                requirements: ['None'],
                inputExample: {
                    tasks: ["Review Q4 goals", "Prepare board deck"],
                    timeframe: "this week"
                }
            },
            {
                id: 'email-drafter',
                name: 'Email Drafter',
                description: 'Drafts professional emails with appropriate tone and structure',
                status: 'ready',
                capabilities: [
                    'Draft emails in your voice',
                    'Adjust tone for different audiences',
                    'Create follow-up sequences',
                    'Summarize email threads'
                ],
                requirements: ['None'],
                inputExample: {
                    to: "team@company.com",
                    subject: "Q4 Planning",
                    tone: "professional",
                    key_points: ["deadline moved", "need resources"]
                }
            },
            {
                id: 'slack-summarizer',
                name: 'Slack Summarizer',
                description: 'Retrieves and summarizes Slack conversations and channel activity',
                status: 'needs-config',
                capabilities: [
                    'Summarize channel activity',
                    'Extract action items from threads',
                    'Identify key decisions',
                    'Create executive summaries'
                ],
                requirements: ['Slack MCP server configured', 'Slack OAuth tokens'],
                inputExample: {
                    channel: "#product",
                    timeRange: "last 24 hours"
                }
            },
            {
                id: 'podcast-prep',
                name: 'Podcast Prep Researcher',
                description: 'Researches interviewers and generates tailored talking points for podcast appearances',
                status: 'ready',
                capabilities: [
                    'Research interviewer background and style',
                    'Analyze show format and audience',
                    'Generate custom talking points',
                    'Create strategic soundbites'
                ],
                requirements: ['None'],
                inputExample: {
                    podcast: "The Product Coalition",
                    host: "Jay Stansell",
                    topics: ["AI in product management", "Webflow strategy"]
                }
            }
        ];
        renderAgents();
    }
}

// Load recent outputs
async function loadOutputs() {
    try {
        const response = await fetch('/api/outputs');
        outputs = await response.json();
        renderOutputs();
    } catch (error) {
        // Fallback to static data for demo
        outputs = [
            {
                agent: 'podcast-prep',
                name: 'Product Coalition Podcast Prep',
                timestamp: '2025-09-28 15:30',
                preview: 'Comprehensive preparation for Webflow AI strategy discussion...',
                file: 'product-coalition-podcast-prep.md'
            },
            {
                agent: 'meeting-prep',
                name: 'Tomorrow\'s Meetings Brief',
                timestamp: '2025-09-28 14:00',
                preview: 'Calendar scan for 2025-09-29, preparing briefings...',
                file: 'tomorrow-meetings-input.json'
            }
        ];
        renderOutputs();
    }
}

// Render agents list
function renderAgents() {
    const agentsList = document.getElementById('agents-list');
    agentsList.innerHTML = '';

    // Update statistics
    document.getElementById('total-agents').textContent = agents.length;
    document.getElementById('agent-count').textContent = `${agents.length} agents`;

    agents.forEach(agent => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        card.onclick = () => selectAgent(agent);

        const statusClass = agent.status === 'ready' ? 'status-ready' : 'status-needs-config';
        const statusText = agent.status === 'ready' ? 'Ready' : 'Needs Config';

        card.innerHTML = `
            <h3>${agent.name}</h3>
            <p>${agent.description}</p>
            <span class="agent-status ${statusClass}">${statusText}</span>
        `;

        agentsList.appendChild(card);
    });
}

// Select and display agent details
function selectAgent(agent) {
    selectedAgent = agent;

    // Update active state
    document.querySelectorAll('.agent-card').forEach((card, index) => {
        card.classList.toggle('active', agents[index].id === agent.id);
    });

    // Display agent details
    const detailsDiv = document.getElementById('agent-details');
    detailsDiv.innerHTML = `
        <div class="agent-details-content">
            <h2>${agent.name}</h2>
            <p>${agent.description}</p>

            <div class="capabilities-list">
                <h3>Capabilities:</h3>
                <ul>
                    ${agent.capabilities.map(cap => `<li>${cap}</li>`).join('')}
                </ul>
            </div>

            <div class="requirements-list">
                <h3>Requirements:</h3>
                <ul>
                    ${agent.requirements.map(req => `<li>${req}</li>`).join('')}
                </ul>
            </div>

            <div class="input-example">
                <h4>Example Input:</h4>
                <pre>${JSON.stringify(agent.inputExample, null, 2)}</pre>
            </div>

            <button class="btn-run-agent" onclick="openRunModal('${agent.id}', '${agent.name}')">
                Run ${agent.name} Agent
            </button>
        </div>
    `;
}

// Render outputs list
function renderOutputs() {
    const outputsList = document.getElementById('outputs-list');
    outputsList.innerHTML = '';

    // Update statistics
    document.getElementById('total-outputs').textContent = outputs.length;
    document.getElementById('output-count').textContent = `${outputs.length} files`;

    outputs.forEach(output => {
        const card = document.createElement('div');
        card.className = 'output-card';

        card.innerHTML = `
            <h4>${output.name}</h4>
            <div class="output-timestamp">${output.timestamp}</div>
            <div class="output-preview">${output.preview}</div>
            <a href="#" class="output-link" onclick="viewOutput('${output.file}'); return false;">
                View Output →
            </a>
        `;

        outputsList.appendChild(card);
    });
}

// Open run agent modal
function openRunModal(agentId, agentName) {
    const modal = document.getElementById('run-modal');
    document.getElementById('agent-name').textContent = agentName;

    // Pre-fill with example input
    const agent = agents.find(a => a.id === agentId);
    if (agent && agent.inputExample) {
        document.getElementById('agent-input').value = JSON.stringify(agent.inputExample, null, 2);
    }

    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('run-modal').style.display = 'none';
    document.getElementById('run-output').classList.remove('show');
    resetModal();
}

// Run agent
async function runAgent() {
    const input = document.getElementById('agent-input').value;
    const outputDiv = document.getElementById('run-output');

    outputDiv.innerHTML = '<p>Running agent...</p>';
    outputDiv.classList.add('show');

    try {
        // Simulate agent execution
        setTimeout(() => {
            outputDiv.innerHTML = `
                <h4>Agent Output:</h4>
                <pre>{
  "status": "success",
  "message": "Agent executed successfully",
  "result": {
    "briefing": "Generated comprehensive briefing...",
    "next_steps": ["Review outputs", "Take action"]
  }
}</pre>
                <p style="margin-top: 10px;">Output saved to logs/</p>
            `;

            // Reload outputs
            loadOutputs();
        }, 2000);
    } catch (error) {
        outputDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

// View output file - opens in new page
function viewOutput(filename) {
    // Open output in new page
    window.location.href = `/output.html?file=${encodeURIComponent(filename)}`;
}

// OLD VIEW OUTPUT FUNCTION - DEPRECATED
async function viewOutputOld(filename) {
    try {
        const modal = document.getElementById('run-modal');
        const outputDiv = document.getElementById('run-output');

        // Set modal title
        document.getElementById('agent-name').textContent = filename;

        // Show loading state
        outputDiv.innerHTML = '<p>Loading output...</p>';
        outputDiv.classList.add('show');
        modal.style.display = 'block';

        // Hide the input area for viewing outputs
        document.getElementById('agent-input').style.display = 'none';
        document.querySelector('.modal-actions').style.display = 'none';

        // Fetch the file content
        const response = await fetch(`/api/output/${filename}`);
        if (response.ok) {
            let content = await response.text();

            // Format based on file type
            let formattedContent = '';

            if (filename.endsWith('.md')) {
                // For markdown files, convert to HTML for better readability
                formattedContent = `<div class="markdown-output">${formatMarkdown(content)}</div>`;
            } else if (filename.endsWith('.json')) {
                // For JSON files, format with syntax highlighting
                try {
                    const jsonObj = JSON.parse(content);
                    formattedContent = `<pre class="json-output">${JSON.stringify(jsonObj, null, 2)}</pre>`;
                } catch (e) {
                    formattedContent = `<pre class="output-content">${escapeHtml(content)}</pre>`;
                }
            } else {
                // For other files, display as preformatted text
                formattedContent = `<pre class="output-content">${escapeHtml(content)}</pre>`;
            }

            outputDiv.innerHTML = `
                <div class="output-header">
                    <h3>${filename}</h3>
                    <span class="output-type">${getFileType(filename)}</span>
                </div>
                <div class="output-body">
                    ${formattedContent}
                </div>
                <div class="output-footer">
                    <button class="btn-secondary" onclick="copyToClipboard(\`${escapeHtml(content).replace(/`/g, '\\`')}\`)">Copy to Clipboard</button>
                    <button class="btn-primary" onclick="closeModal(); resetModal();">Close</button>
                </div>
            `;
        } else {
            outputDiv.innerHTML = `<p style="color: red;">Error loading output file</p>`;
        }
    } catch (error) {
        console.error('Error viewing output:', error);
        alert('Error loading output file');
    }
}

// Reset modal to normal state
function resetModal() {
    document.getElementById('agent-input').style.display = 'block';
    document.querySelector('.modal-actions').style.display = 'flex';
    document.getElementById('run-output').classList.remove('show');
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to get file type
function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
        'md': 'Markdown',
        'json': 'JSON',
        'txt': 'Text',
        'log': 'Log',
        'js': 'JavaScript',
        'ts': 'TypeScript'
    };
    return types[ext] || ext.toUpperCase();
}

// Simple markdown formatter
function formatMarkdown(text) {
    return text
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        // Code blocks
        .replace(/```([^`]+)```/g, '<pre class="code-block">$1</pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Lists
        .replace(/^\* (.+)$/gim, '<li>$1</li>')
        .replace(/^- (.+)$/gim, '<li>$1</li>')
        .replace(/^\d+\. (.+)$/gim, '<li>$1</li>')
        // Wrap lists
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        // Wrap in paragraphs
        .replace(/^(.+)$/gim, '<p>$1</p>')
        // Clean up
        .replace(/<p><h/g, '<h')
        .replace(/<\/h(\d)><\/p>/g, '</h$1>')
        .replace(/<p><ul>/g, '<ul>')
        .replace(/<\/ul><\/p>/g, '</ul>')
        .replace(/<p><pre/g, '<pre')
        .replace(/<\/pre><\/p>/g, '</pre>');
}

// Copy to clipboard function
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);

        // Show feedback
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#10b981';

        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
    } catch (err) {
        alert('Failed to copy to clipboard');
    }
}

// Filter agents by status
function filterAgents(status) {
    const checkbox = event.target;
    // This is a simplified filter - you could expand this
    loadAgents();
}

// Team Calendar functions
async function loadTeamCalendar() {
    const dateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const isTodayView = isToday(currentDate);

    // Calculate days from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const viewDate = new Date(currentDate);
    viewDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.round((viewDate - today) / (1000 * 60 * 60 * 24));

    let dateLabel = dateStr;
    if (daysDiff === 0) dateLabel = `Today - ${dateStr}`;
    else if (daysDiff === 1) dateLabel = `Tomorrow - ${dateStr}`;
    else if (daysDiff === -1) dateLabel = `Yesterday - ${dateStr}`;
    else if (daysDiff > 0) dateLabel = `${dateStr} (${daysDiff} days ahead)`;
    else dateLabel = `${dateStr} (${Math.abs(daysDiff)} days ago)`;

    document.getElementById('team-dashboard-date').innerHTML = `
        <div class="date-navigation">
            <h1 class="page-title">Team Calendars</h1>
            <div class="nav-controls">
                <button class="nav-btn" onclick="changeTeamDay(-7)" title="Previous week">« Week</button>
                <button class="nav-btn" onclick="changeTeamDay(-1)" title="Previous day">‹ Day</button>
                <span class="date-label">${dateLabel}</span>
                <button class="nav-btn" onclick="changeTeamDay(1)" title="Next day">Day ›</button>
                <button class="nav-btn" onclick="changeTeamDay(7)" title="Next week">Week »</button>
                ${!isTodayView ? '<button class="nav-btn today-btn" onclick="goToTodayTeam()">Today</button>' : ''}
            </div>
        </div>
    `;

    // Load calendars for each team
    renderTeamCalendars('estaff-calendar', LINDA);
    renderTeamCalendars('myteam-calendar', MY_TEAM);
}

function changeTeamDay(offset) {
    currentDate.setDate(currentDate.getDate() + offset);
    loadTeamCalendar();
}

function goToTodayTeam() {
    currentDate = new Date();
    loadTeamCalendar();
}

async function renderTeamCalendars(containerId, members) {
    const container = document.getElementById(containerId);

    // Show loading state
    container.innerHTML = members.map(m => `
        <div class="team-member-card">
            <div class="team-member-header"><h3>${m.name}</h3></div>
            <div class="team-member-status"><em>Analyzing calendar...</em></div>
        </div>
    `).join('');

    try {
        // Format date as YYYY-MM-DD
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Fetch AI-summarized insights
        const emails = members.map(m => m.email).join(',');
        const response = await fetch(`/api/calendar/team-summary?date=${dateStr}&emails=${emails}`);
        const summaries = await response.json();

        // Render clean, scannable cards with insights
        const html = members.map(member => {
            const summary = summaries[member.email];
            if (!summary) {
                return `
                    <div class="team-member-card">
                        <div class="team-member-header">
                            <div class="team-member-name">
                                <div class="status-indicator available"></div>
                                <h3>${member.name}</h3>
                            </div>
                        </div>
                        <div class="team-member-empty">
                            <em>Calendar unavailable</em>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="team-member-card">
                    <div class="team-member-header">
                        <div class="team-member-name">
                            <div class="status-indicator ${summary.status}"></div>
                            <h3>${member.name}</h3>
                        </div>
                    </div>
                    <div class="team-insights">
                        ${summary.insights.map(insight => `
                            <div class="insight-item">• ${insight}</div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading team calendars:', error);
        container.innerHTML = members.map(m => `
            <div class="team-member-card">
                <div class="team-member-header"><h3>${m.name}</h3></div>
                <div class="team-member-status error">
                    <em>Calendar not shared or unavailable</em>
                </div>
            </div>
        `).join('');
    }
}

// Window click to close modal
window.onclick = function(event) {
    const modal = document.getElementById('run-modal');
    if (event.target == modal) {
        closeModal();
    }
}

// ============================================
// INDEX CARD (3x5 CARD) FUNCTIONS
// ============================================

let currentCard = null;
let isCardFlipped = false;

async function loadIndexCard() {
    try {
        // Use local timezone for date (not UTC)
        const dateStr = formatLocalDate(currentDate);
        const response = await fetch(`/api/index-card/${dateStr}`);
        currentCard = await response.json();
        renderIndexCard();
    } catch (error) {
        console.error('Error loading index card:', error);
        renderIndexCard(); // Render blank card
    }
}

function changeCardDay(offset) {
    currentDate.setDate(currentDate.getDate() + offset);
    loadCalendar();
    loadIndexCard();
}

function goToTodayCard() {
    currentDate = new Date();
    loadCalendar();
    loadIndexCard();
}

function renderIndexCard() {
    const container = document.getElementById('index-card-container');
    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();

    // Calculate days difference for label
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const cardMidnight = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const daysDiff = Math.round((cardMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

    const dateStr = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let dateLabel = dateStr;
    if (daysDiff === 0) dateLabel = `Today - ${dateStr}`;
    else if (daysDiff === 1) dateLabel = `Tomorrow - ${dateStr}`;
    else if (daysDiff === -1) dateLabel = `Yesterday - ${dateStr}`;
    else if (daysDiff > 0) dateLabel = `${dateStr} (${daysDiff} days ahead)`;
    else dateLabel = `${dateStr} (${Math.abs(daysDiff)} days ago)`;

    if (!currentCard) {
        // Create new blank card
        currentCard = {
            date: formatLocalDate(currentDate),
            createdAt: new Date().toISOString(),
            priorities: ['', '', ''],
            completed: [false, false, false],
            antiTodo: [],
            wasSuccessful: false,
            completedAt: null
        };
    }

    const cardHTML = `
        <div class="index-card-wrapper">
            <div class="index-card ${isCardFlipped ? 'flipped' : ''}">
                <!-- Front of card (Priorities) -->
                <div class="card-face card-front">
                    <div class="card-header">
                        <h3>Top Priorities for ${currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                        <button class="btn-flip-icon" onclick="flipCard()" title="Flip card">⟲</button>
                    </div>
                    <div class="card-priorities">
                        ${currentCard.priorities
                            .map((priority, index) => ({ priority, index }))
                            .filter(item => item.priority.trim() !== '')
                            .map(item => `
                                <div class="priority-item">
                                    <span>✓</span>
                                    <span>${item.priority}</span>
                                    <button class="btn-remove" onclick="removePriority(${item.index})">×</button>
                                </div>
                            `).join('')}
                    </div>
                    ${currentCard.priorities.length < 5 ? `
                        <div class="priority-add">
                            <input
                                type="text"
                                id="priority-input"
                                placeholder="Add a priority..."
                                onkeypress="if(event.key==='Enter') addPriority()"
                                maxlength="60"
                            >
                            <button onclick="addPriority()">Add</button>
                        </div>
                    ` : ''}
                </div>

                <!-- Back of card (Anti-To-Do) -->
                <div class="card-face card-back">
                    <div class="card-header">
                        <h3>Top Accomplishments for ${currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                        <button class="btn-flip-icon" onclick="flipCard()" title="Flip card">⟲</button>
                    </div>
                    <div class="anti-todo-list">
                        ${currentCard.antiTodo.map((item, index) => `
                            <div class="anti-todo-item">
                                <span>✓</span>
                                <span>${item}</span>
                                <button class="btn-remove" onclick="removeAntiTodo(${index})">×</button>
                            </div>
                        `).join('')}
                    </div>
                    <div class="anti-todo-add">
                        <input
                            type="text"
                            id="anti-todo-input"
                            placeholder="Add something you accomplished..."
                            onkeypress="if(event.key==='Enter') addAntiTodo()"
                        >
                        <button onclick="addAntiTodo()">Add</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = cardHTML;
}

function flipCard() {
    isCardFlipped = !isCardFlipped;
    document.querySelector('.index-card').classList.toggle('flipped');
}

function updatePriority(index, value) {
    currentCard.priorities[index] = value;
    autoSaveCard();
}

function togglePriority(index) {
    currentCard.completed[index] = !currentCard.completed[index];

    // Check if day was successful (all priorities completed)
    const allCompleted = currentCard.priorities
        .filter(p => p.trim() !== '')
        .every((_, i) => currentCard.completed[i]);

    currentCard.wasSuccessful = allCompleted;
    autoSaveCard();
}

function addPriority() {
    const input = document.getElementById('priority-input');
    const value = input.value.trim();

    if (value && currentCard.priorities.length < 5) {
        currentCard.priorities.push(value);
        input.value = '';
        renderIndexCard();
        autoSaveCard();
    }
}

function removePriority(index) {
    currentCard.priorities.splice(index, 1);
    renderIndexCard();
    autoSaveCard();
}

function addAntiTodo() {
    const input = document.getElementById('anti-todo-input');
    const value = input.value.trim();

    if (value) {
        currentCard.antiTodo.push(value);
        input.value = '';
        renderIndexCard();
        autoSaveCard();
    }
}

function removeAntiTodo(index) {
    currentCard.antiTodo.splice(index, 1);
    renderIndexCard();
    autoSaveCard();
}

let saveTimeout = null;

async function autoSaveCard() {
    // Debounce saves to prevent too many requests
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(async () => {
        try {
            // Filter out empty priorities for saving
            const cardToSave = {
                ...currentCard,
                priorities: currentCard.priorities.filter(p => p.trim() !== ''),
                completed: currentCard.completed.slice(0, currentCard.priorities.filter(p => p.trim() !== '').length)
            };

            if (cardToSave.priorities.length === 0) {
                return; // Don't save empty cards
            }

            const response = await fetch('/api/index-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cardToSave)
            });

            if (response.ok) {
                console.log('Card autosaved ✓');
            }
        } catch (error) {
            console.error('Error autosaving card:', error);
        }
    }, 500); // Wait 500ms after last change before saving
}

// ============================================
// LEARN-IT-ALL FUNCTIONS
// ============================================

async function loadDailyDossier() {
    const container = document.getElementById('dossier-content');

    try {
        // Check Gmail auth status
        const statusResponse = await fetch('/api/gmail/status');
        const status = await statusResponse.json();

        if (!status.authenticated) {
            container.innerHTML = `
                <div class="gmail-connect-card">
                    <div class="connect-icon">📧</div>
                    <h2>Connect Your Gmail</h2>
                    <p>To generate your daily Learn-it-all dossier, we need access to your Gmail newsletters.</p>
                    <button class="btn-primary btn-large" onclick="window.location.href='/oauth/gmail/start'">
                        Connect Gmail Account
                    </button>
                    <p class="connect-note">We'll only read emails with the "Newsletter" label</p>
                </div>
            `;
            return;
        }

        // Check if today's dossier already exists
        const todayResponse = await fetch('/api/dossier/today');
        const existingDossier = await todayResponse.json();

        if (existingDossier) {
            renderDossier(existingDossier);
        } else {
            // Show generation option
            container.innerHTML = `
                <div class="empty-state">
                    <p>Your personalized daily dossier from newsletters</p>
                    <button class="btn-primary" onclick="generateDossier()">
                        Generate Today's Dossier
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading Learn-it-all:', error);
        container.innerHTML = `
            <div class="error-state">
                <p>⚠️ Unable to load Learn-it-all</p>
            </div>
        `;
    }
}

async function generateDossier() {
    const container = document.getElementById('dossier-content');

    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Generating dossier...</p>
            <p class="loading-note">This may take 30-60 seconds</p>
        </div>
    `;

    try {
        const response = await fetch('/api/dossier/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const dossier = await response.json();

        if (dossier.error) {
            container.innerHTML = `
                <div class="error-state">
                    <p>⚠️ ${dossier.error}</p>
                    <p class="error-details">${dossier.message}</p>
                </div>
            `;
        } else {
            renderDossier(dossier);
        }
    } catch (error) {
        console.error('Error generating dossier:', error);
        container.innerHTML = `
            <div class="error-state">
                <p>⚠️ Failed to generate dossier</p>
                <button class="btn-primary" onclick="loadDailyDossier()">Try Again</button>
            </div>
        `;
    }
}

function renderDossier(dossier) {
    const container = document.getElementById('dossier-content');

    // Simple markdown to HTML converter
    const markdownToHtml = (md) => {
        if (!md) return '';
        return md
            // Headers
            .replace(/^### (.+)$/gm, '<h4>$1</h4>')
            .replace(/^## (.+)$/gm, '<h3>$1</h3>')
            .replace(/^# (.+)$/gm, '<h2>$1</h2>')
            // Bold
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Links
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
            // Paragraphs
            .split('\n\n')
            .map(p => p.trim() ? `<p>${p.replace(/\n/g, '<br>')}</p>` : '')
            .join('');
    };

    container.innerHTML = `
        <div class="dossier-content">
            <div class="dossier-section">
                <h3>📋 Executive Summary</h3>
                <p>${dossier.summary}</p>
            </div>

            <div class="dossier-section">
                <h3>🎯 Key Insights</h3>
                <ul>
                    ${(dossier.keyInsights || []).map(insight => `<li>${insight}</li>`).join('')}
                </ul>
            </div>

            <div class="dossier-section">
                <h3>💡 Strategic Implications</h3>
                <div class="dossier-full">${markdownToHtml(dossier.strategicImplications)}</div>
            </div>

            <div class="dossier-section">
                <h3>📤 Share with Product Org</h3>
                <div class="share-card">
                    <a href="${dossier.productOrgShare.link}" target="_blank" class="share-title">${dossier.productOrgShare.title}</a>
                    <p class="share-message">${dossier.productOrgShare.slackMessage}</p>
                </div>
            </div>

            <div class="dossier-section">
                <h3>📤 Share with E-Staff</h3>
                <div class="share-card">
                    <a href="${dossier.eStaffShare.link}" target="_blank" class="share-title">${dossier.eStaffShare.title}</a>
                    <p class="share-message">${dossier.eStaffShare.slackMessage}</p>
                    ${dossier.eStaffShare.mentions ? `<p class="share-mentions">Mentions: ${dossier.eStaffShare.mentions.join(', ')}</p>` : ''}
                </div>
            </div>

            <div class="dossier-section">
                <h3>📝 Full Analysis</h3>
                <div class="dossier-full">${markdownToHtml(dossier.fullAnalysis || dossier.fullDossier || '')}</div>
            </div>

            ${dossier.newsletters && dossier.newsletters.length > 0 ? `
            <div class="dossier-section">
                <h3>📧 Source Newsletters</h3>
                <div class="sources-list">
                    ${dossier.newsletters.map(newsletter => `
                        <div class="source-item">
                            <strong>${newsletter.subject}</strong>
                            <div class="source-meta">
                                <span>${newsletter.from}</span>
                                <span class="source-badge">${newsletter.linkCount} links</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${dossier.articles && dossier.articles.length > 0 ? `
            <div class="dossier-section">
                <h3>📰 Article Takeaways (${dossier.articles.length})</h3>
                <div class="articles-list">
                    ${dossier.articles.map((article, idx) => `
                        <div class="article-item ${article.shouldRead ? 'priority-article' : ''}">
                            <span class="article-number">${article.shouldRead ? '⭐' : ''} ${idx + 1}.</span>
                            <div class="article-info">
                                <a href="${article.url}" target="_blank" class="article-title">${article.title || 'Untitled'}</a>
                                <span class="article-source">${article.source}</span>
                                ${article.takeaways && article.takeaways.length > 0 ? `
                                    <ul class="article-takeaways">
                                        ${article.takeaways.map(t => `<li>${t}</li>`).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <div class="dossier-actions">
                <button class="btn-primary" onclick="generateDossier()">Regenerate Dossier</button>
            </div>
        </div>
    `;
}

// Collapsible section toggle
function toggleSection(sectionName) {
    const content = document.getElementById(`${sectionName}-content`);
    const icon = document.getElementById(`${sectionName}-icon`);

    if (content && icon) {
        content.classList.toggle('collapsed');
        icon.classList.toggle('collapsed');
    }
}

// ============================================
// SMART MEETING RECORDING WIDGET
// ============================================

let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let recordingTimer = null;
let meetingContext = { title: '', attendees: '' };

// Keyboard shortcut: Cmd+Shift+R or Ctrl+Shift+R
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        toggleRecordingWidget();
    }
});

async function toggleRecordingWidget() {
    // Try to autofill from current or next calendar event
    await autofillMeetingContext();

    const modal = document.getElementById('meeting-context-modal');
    modal.style.display = 'flex';
}

async function autofillMeetingContext() {
    try {
        // Find current or next meeting
        const now = new Date();
        const currentOrNext = calendarEvents.find(event => {
            const start = new Date(event.start);
            const end = new Date(event.end);

            // Current meeting (started and hasn't ended)
            if (start <= now && end >= now) {
                return true;
            }

            // Next meeting (starts within the next 15 minutes)
            const minutesUntilStart = (start - now) / (1000 * 60);
            return minutesUntilStart > 0 && minutesUntilStart <= 15;
        });

        if (currentOrNext) {
            // Set meeting title
            document.getElementById('meeting-title-input').value = currentOrNext.summary || '';

            // Extract attendee names (first names only, exclude yourself)
            const attendeeNames = currentOrNext.attendees
                ?.filter(email => !email.includes('rachel.wolan@webflow.com'))
                .map(email => {
                    const name = email.split('@')[0];
                    const parts = name.split('.');
                    // Capitalize first name
                    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
                })
                .filter(name => name && name.length > 1)
                .slice(0, 5) // Max 5 names
                .join(', ');

            document.getElementById('meeting-attendees-input').value = attendeeNames || '';

            // Show autofill message
            const start = new Date(currentOrNext.start);
            const isCurrent = start <= now;
            const statusText = isCurrent ? 'current meeting' : 'next meeting';
            document.getElementById('modal-description').innerHTML =
                `✨ <strong>Autofilled from your ${statusText}</strong> • Edit as needed`;
            document.getElementById('modal-description').style.color = '#667eea';

            console.log('Autofilled meeting context:', currentOrNext.summary);
        } else {
            // Clear fields if no meeting found
            document.getElementById('meeting-title-input').value = '';
            document.getElementById('meeting-attendees-input').value = '';
            document.getElementById('modal-description').textContent = 'Add context to help with better analysis';
            document.getElementById('modal-description').style.color = '#7f8c8d';
        }
    } catch (error) {
        console.error('Error autofilling meeting context:', error);
        // Don't block the modal from opening
    }
}

function closeMeetingContextModal() {
    const modal = document.getElementById('meeting-context-modal');
    modal.style.display = 'none';
}

function startRecordingWithoutContext() {
    meetingContext = { title: '', attendees: '' };
    closeMeetingContextModal();
    startRecording();
}

function startRecordingWithContext() {
    meetingContext = {
        title: document.getElementById('meeting-title-input').value || 'Meeting',
        attendees: document.getElementById('meeting-attendees-input').value || ''
    };
    closeMeetingContextModal();

    // Clear inputs for next time
    document.getElementById('meeting-title-input').value = '';
    document.getElementById('meeting-attendees-input').value = '';

    startRecording();
}

async function startRecording() {
    try {
        // Request audio input
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                channelCount: 2
            }
        });

        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm',
            audioBitsPerSecond: 128000
        });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await uploadAndProcessRecording(audioBlob);
        };

        mediaRecorder.start(1000); // Collect data every second for size tracking

        recordingStartTime = Date.now();

        // Show active recording state
        showRecordingState('active');

        // Update meeting title if provided
        if (meetingContext.title) {
            document.getElementById('recording-meeting-title').textContent = meetingContext.title;
        }

        // Start timer and size updates
        recordingTimer = setInterval(updateRecordingUI, 1000);

        console.log('Recording started');
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Failed to start recording. Make sure you have granted microphone permissions.');
    }
}

function updateRecordingUI() {
    if (!recordingStartTime) return;

    const elapsed = Date.now() - recordingStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    document.getElementById('recording-timer').textContent = timeStr;
    document.getElementById('recording-timer-small').textContent = timeStr;

    // Estimate file size (rough estimate based on bitrate)
    const estimatedBytes = (elapsed / 1000) * (128000 / 8);
    const sizeKB = Math.round(estimatedBytes / 1024);
    const sizeMB = (sizeKB / 1024).toFixed(2);

    document.getElementById('recording-size').textContent =
        sizeKB < 1024 ? `${sizeKB} KB` : `${sizeMB} MB`;
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        // Clear timer
        if (recordingTimer) {
            clearInterval(recordingTimer);
            recordingTimer = null;
        }

        console.log('Recording stopped, processing...');
    }
}

function cancelRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        // Clear timer
        if (recordingTimer) {
            clearInterval(recordingTimer);
            recordingTimer = null;
        }

        // Clear audio chunks so uploadAndProcessRecording won't run
        audioChunks = [];

        // Reset to idle state
        resetRecordingWidget();

        console.log('Recording cancelled');
    }
}

function minimizeRecording() {
    showRecordingState('minimized');
}

function expandRecording() {
    showRecordingState('active');
}

function showRecordingState(state) {
    // Hide all states
    document.getElementById('recording-idle').style.display = 'none';
    document.getElementById('recording-active').style.display = 'none';
    document.getElementById('recording-minimized').style.display = 'none';
    document.getElementById('recording-processing').style.display = 'none';
    document.getElementById('recording-success').style.display = 'none';

    // Show requested state
    document.getElementById(`recording-${state}`).style.display = 'block';
}

function resetRecordingWidget() {
    recordingStartTime = null;
    audioChunks = [];
    meetingContext = { title: '', attendees: '' };
    showRecordingState('idle');
}

async function uploadAndProcessRecording(audioBlob) {
    // Don't process if cancelled (audioChunks cleared)
    if (audioChunks.length === 0) {
        return;
    }

    // Show processing state
    showRecordingState('processing');

    try {
        // Step 1: Upload
        updateProcessingStep('upload', 'active');
        setProgressBar(25);

        const formData = new FormData();
        formData.append('audio', audioBlob, `meeting-${Date.now()}.webm`);

        const response = await fetch('/api/meeting/process-recording', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to process recording');
        }

        // Step 2: Transcribing (server is doing this)
        updateProcessingStep('upload', 'complete');
        updateProcessingStep('transcribe', 'active');
        setProgressBar(50);

        // Wait a bit to simulate the backend process
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 3: Analyzing
        updateProcessingStep('transcribe', 'complete');
        updateProcessingStep('analyze', 'active');
        setProgressBar(75);

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 4: Posting to Slack
        updateProcessingStep('analyze', 'complete');
        updateProcessingStep('post', 'active');
        setProgressBar(90);

        const result = await response.json();

        // Complete!
        updateProcessingStep('post', 'complete');
        setProgressBar(100);

        await new Promise(resolve => setTimeout(resolve, 500));

        // Show success state
        showRecordingState('success');

        console.log('Recording processed successfully:', result);
    } catch (error) {
        console.error('Error processing recording:', error);
        alert('Failed to process recording. Check console for details.');
        resetRecordingWidget();
    }
}

function updateProcessingStep(stepId, state) {
    const step = document.getElementById(`step-${stepId}`);
    step.classList.remove('active', 'complete');
    step.classList.add(state);

    const icon = step.querySelector('.step-icon');
    if (state === 'complete') {
        icon.textContent = '✓';
        icon.classList.remove('spinner');
        icon.classList.add('complete');
    } else if (state === 'active') {
        icon.classList.add('spinner');
    }
}

function setProgressBar(percent) {
    document.getElementById('processing-progress-bar').style.width = `${percent}%`;
}

function viewInSlack() {
    // Open your Slack workspace - you can customize this URL
    window.open('https://slack.com/app_redirect?channel=rachels-mcp', '_blank');
}

// For backward compatibility with old code
function startRecordingWithoutContext() {
    meetingContext = { title: 'Meeting', attendees: '' };
    closeMeetingContextModal();
    startRecording();
}