// Calendar Dashboard JavaScript

const API_BASE = 'http://localhost:3456/api';

// Format date for display
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Format time for display
function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Calculate duration in hours
function calculateDuration(start, end) {
    const duration = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
    return duration.toFixed(1);
}

// Group events by time of day
function groupEventsByTimeOfDay(events) {
    const groups = {
        morning: [],
        afternoon: [],
        evening: []
    };

    events.forEach(event => {
        const hour = new Date(event.start).getHours();
        if (hour < 12) {
            groups.morning.push(event);
        } else if (hour < 17) {
            groups.afternoon.push(event);
        } else {
            groups.evening.push(event);
        }
    });

    return groups;
}

// Render meeting card
function renderMeetingCard(event, prepCard) {
    const startTime = formatTime(event.start);
    const endTime = formatTime(event.end);
    const duration = calculateDuration(event.start, event.end);

    const prepStatus = prepCard?.status || 'not-started';
    const prepStatusText = prepStatus === 'ready' ? '✅ Ready' :
                          prepStatus === 'in-progress' ? '⚠️ In Progress' :
                          '⏳ Not Started';

    const priorityClass = duration > 1.5 ? 'priority-high' : 'priority-medium';
    const isFocusTime = event.summary.toLowerCase().includes('focus') ||
                        event.summary.toLowerCase().includes('break') ||
                        event.summary.toLowerCase().includes('personal');

    let card = `
        <div class="meeting-card ${isFocusTime ? 'focus-time' : priorityClass}">
            <div class="meeting-time">${startTime} - ${endTime}</div>
            <div class="meeting-title">${event.summary}</div>
            <div class="meeting-meta">
                <div class="meta-item">
                    <span>📝</span>
                    <span class="prep-status ${prepStatus}">${prepStatusText}</span>
                </div>
    `;

    if (event.attendees && event.attendees.length > 0) {
        const attendeeCount = event.attendees.length;
        const attendeeNames = event.attendees.slice(0, 3).join(', ');
        card += `
                <div class="meta-item">
                    <span>👥</span>
                    <span>${attendeeNames}${attendeeCount > 3 ? '...' : ''} (${attendeeCount})</span>
                </div>
        `;
    }

    if (event.location) {
        const isVideoLink = event.location.includes('http');
        card += `
                <div class="meta-item">
                    <span>📍</span>
                    <span>${isVideoLink ? '<a href="' + event.location + '" target="_blank">Join Meeting</a>' : event.location}</span>
                </div>
        `;
    }

    card += `</div>`;

    // Add talking points if available
    if (prepCard && prepCard.keyPoints && prepCard.keyPoints.length > 0) {
        card += `
            <div class="talking-points">
                <strong>💡 Key Points:</strong>
                <ul>
                    ${prepCard.keyPoints.map(point => `<li>${point}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Add action buttons
    card += `
            <div class="meeting-actions">
    `;

    if (prepCard) {
        card += `<button class="btn btn-primary" onclick="viewPrepDetails('${event.id}')">View Full Prep</button>`;
    } else {
        card += `<button class="btn btn-secondary" onclick="generatePrep('${event.id}')">Generate Prep</button>`;
    }

    if (event.location && event.location.includes('http')) {
        card += `<button class="btn btn-primary" onclick="window.open('${event.location}', '_blank')">Join Meeting</button>`;
    }

    card += `
            </div>
        </div>
    `;

    return card;
}

// Render timeline
function renderTimeline(events, prepCards) {
    const grouped = groupEventsByTimeOfDay(events);
    let html = '';

    if (grouped.morning.length > 0) {
        html += `
            <div class="time-block">
                <div class="time-block-title">☀️ Morning</div>
                ${grouped.morning.map(event => {
                    const prep = prepCards.find(p => p.eventId === event.id);
                    return renderMeetingCard(event, prep);
                }).join('')}
            </div>
        `;
    }

    if (grouped.afternoon.length > 0) {
        html += `
            <div class="time-block">
                <div class="time-block-title">🌤️ Afternoon</div>
                ${grouped.afternoon.map(event => {
                    const prep = prepCards.find(p => p.eventId === event.id);
                    return renderMeetingCard(event, prep);
                }).join('')}
            </div>
        `;
    }

    if (grouped.evening.length > 0) {
        html += `
            <div class="time-block">
                <div class="time-block-title">🌙 Evening</div>
                ${grouped.evening.map(event => {
                    const prep = prepCards.find(p => p.eventId === event.id);
                    return renderMeetingCard(event, prep);
                }).join('')}
            </div>
        `;
    }

    if (events.length === 0) {
        html = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3>No meetings today</h3>
                <p>Enjoy your focus time!</p>
            </div>
        `;
    }

    return html;
}

// Render needs attention panel
function renderNeedsAttention(events, prepCards) {
    const needsPrep = events.filter(e => {
        const prep = prepCards.find(p => p.eventId === e.id);
        return !prep || prep.status !== 'ready';
    });

    const upcoming = events.filter(e => {
        const eventTime = new Date(e.start);
        const now = new Date();
        const hoursDiff = (eventTime - now) / (1000 * 60 * 60);
        return hoursDiff > 0 && hoursDiff < 2; // Within 2 hours
    });

    let html = '';

    if (upcoming.length > 0) {
        upcoming.forEach(event => {
            const timeUntil = Math.round((new Date(event.start) - new Date()) / (1000 * 60));
            html += `
                <div class="attention-item urgent">
                    <div class="attention-title">${event.summary}</div>
                    <div class="attention-desc">🔴 Starting in ${timeUntil} minutes</div>
                    <button class="btn btn-primary btn-sm" onclick="viewPrepDetails('${event.id}')">Quick Prep</button>
                </div>
            `;
        });
    }

    if (needsPrep.length > 0 && upcoming.length === 0) {
        needsPrep.slice(0, 3).forEach(event => {
            html += `
                <div class="attention-item">
                    <div class="attention-title">${event.summary}</div>
                    <div class="attention-desc">⚠️ Prep not complete</div>
                    <button class="btn btn-secondary btn-sm" onclick="generatePrep('${event.id}')">Generate Prep</button>
                </div>
            `;
        });
    }

    if (html === '') {
        html = '<div style="color: #28a745; text-align: center; padding: 20px;">✅ All meetings prepared!</div>';
    }

    return html;
}

// Calculate summary stats
function renderSummaryStats(events) {
    const totalMeetingTime = events.reduce((sum, e) => {
        return sum + (new Date(e.end) - new Date(e.start)) / (1000 * 60 * 60);
    }, 0);

    const workDayHours = 8;
    const focusTime = workDayHours - totalMeetingTime;

    const stats = `
        <div style="margin-bottom: 10px;">
            <strong>Meeting Load:</strong> ${((totalMeetingTime / workDayHours) * 100).toFixed(0)}% of day
        </div>
        <div style="margin-bottom: 10px;">
            <strong>Longest Meeting:</strong> ${Math.max(...events.map(e => calculateDuration(e.start, e.end)))}hrs
        </div>
        <div style="margin-bottom: 10px;">
            <strong>Back-to-back blocks:</strong> ${countBackToBack(events)}
        </div>
        <div>
            <strong>Recommendation:</strong> ${
                totalMeetingTime > 6 ? 'Heavy meeting day - protect breaks!' :
                totalMeetingTime < 3 ? 'Light day - good for deep work' :
                'Balanced schedule'
            }
        </div>
    `;

    return stats;
}

function countBackToBack(events) {
    let count = 0;
    for (let i = 0; i < events.length - 1; i++) {
        const currentEnd = new Date(events[i].end);
        const nextStart = new Date(events[i + 1].start);
        if (currentEnd.getTime() === nextStart.getTime()) {
            count++;
        }
    }
    return count;
}

// Load calendar data
async function loadCalendarData() {
    try {
        // Fetch today's events
        const eventsResponse = await fetch(`${API_BASE}/calendar/today`);
        const events = await eventsResponse.json();

        // Fetch prep cards (mock for now - will implement in next step)
        const prepCards = [];

        // Update header
        document.getElementById('dashboard-date').textContent = `📅 Today - ${formatDate(new Date())}`;
        document.getElementById('total-meetings').textContent = events.length;

        const totalHours = events.reduce((sum, e) => sum + parseFloat(calculateDuration(e.start, e.end)), 0);
        document.getElementById('meeting-time').textContent = `${totalHours.toFixed(1)}h`;
        document.getElementById('focus-time').textContent = `${(8 - totalHours).toFixed(1)}h`;

        // Render content
        document.getElementById('calendar-content').innerHTML = renderTimeline(events, prepCards);
        document.getElementById('needs-attention').innerHTML = renderNeedsAttention(events, prepCards);
        document.getElementById('quick-stats').innerHTML = renderSummaryStats(events);

        // Show alert if needed
        const needsPrep = events.filter(e => !prepCards.find(p => p.eventId === e.id));
        if (needsPrep.length > 0) {
            showAlert(`⚠️ ${needsPrep.length} meetings need prep`, 'warning');
        }

    } catch (error) {
        console.error('Error loading calendar:', error);
        document.getElementById('calendar-content').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <h3>Error loading calendar</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadCalendarData()">Retry</button>
            </div>
        `;
    }
}

function showAlert(message, type = 'warning') {
    const banner = document.getElementById('alert-banner');
    banner.className = type === 'error' ? 'alert-banner error' : 'alert-banner';
    banner.textContent = message;
    banner.style.display = 'block';
}

// Action functions
function viewPrepDetails(eventId) {
    alert(`Viewing prep details for event: ${eventId}\n\nFull prep modal will be implemented in next phase.`);
}

function generatePrep(eventId) {
    alert(`Generating prep for event: ${eventId}\n\nAuto-prep agent will be implemented next.`);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadCalendarData();

    // Refresh every 5 minutes
    setInterval(loadCalendarData, 5 * 60 * 1000);
});
