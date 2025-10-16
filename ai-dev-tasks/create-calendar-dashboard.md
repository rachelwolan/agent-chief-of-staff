# Rule: Create Calendar Dashboard

## Goal

To guide an AI assistant in creating an intelligent, context-rich Calendar Dashboard that transforms Google Calendar from a simple list of events into a strategic command center with AI-powered insights and automated preparation workflows.

## Process

1. **Understand Requirements**: Review the full specification including core components, AI agents, and technical architecture
2. **Set Up Foundation**:
   - Verify Google Calendar API integration is working
   - Ensure environment variables are configured (`GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`)
   - Test calendar data fetching capabilities
3. **Build Dashboard UI Framework**:
   - Create React-based dashboard component in `/apps/agent-manager` or new directory
   - Implement real-time updates via WebSocket
   - Design mobile-responsive layout
   - Add keyboard shortcuts for power users
4. **Implement Core Components**:
   - Smart Calendar View (today/week/month views)
   - Meeting Preparation Hub
   - Priority & Impact Scoring
   - Action Items & Follow-Up Tracker
   - Attendee Intelligence Panel
   - Time Analytics & Insights
   - Quick Actions & Automation
   - Strategic Alignment View
5. **Develop AI Agents** (using existing agent-runner framework):
   - Calendar Intelligence Agent (daily briefing)
   - Auto-Prep Agent (meeting preparation)
   - Meeting Context Agent (pulls relevant info)
   - Agenda Intelligence Agent (ensures clear purpose)
   - Meeting Prioritization Agent (importance scoring)
   - Delegation Recommendation Agent (suggests alternates)
   - Post-Meeting Action Agent (extracts commitments)
   - Meeting Transcript Analyzer Agent (processes recordings)
   - Relationship Intelligence Agent (tracks interactions)
   - Attendee Research Agent (background info)
   - Calendar Analytics Agent (time audit)
   - Energy Management Agent (optimize schedule)
   - Calendar Automation Agent (routine management)
   - Smart Scheduling Agent (finds optimal times)
   - Strategic Alignment Agent (aligns with OKRs)
   - Goal Progress Agent (tracks objectives)
6. **Integrate Data Sources**:
   - Google Calendar API (primary)
   - Slack API (context, messages)
   - Plane API (tasks, issues)
   - LinkedIn API (attendee research)
   - Internal knowledge base (meeting notes, docs)
7. **Configure User Preferences**:
   - Work hours and timezone
   - Focus time goals
   - No-meeting days
   - Strategic priorities
   - Auto-decline/accept rules
   - Prep settings by priority level
8. **Implement Workflows**:
   - Morning Routine (automated daily briefing)
   - Pre-Meeting (15 min before - pull context)
   - Post-Meeting (extract actions, send follow-ups)
   - Weekly Review (Friday analytics and alignment check)
9. **Test and Validate**:
   - Dashboard load time < 2 seconds
   - Agent response time < 30 seconds
   - Calendar sync real-time (< 5 second lag)
   - Prep accuracy 90%+
   - Action capture 95%+
10. **Deploy and Monitor**:
    - Launch dashboard UI
    - Activate agents according to implementation phases
    - Monitor success metrics
    - Iterate based on user feedback

## Prerequisites

### Environment Variables
```bash
# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID=your_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/oauth/calendar/callback

# Anthropic (for AI agents)
ANTHROPIC_API_KEY=your_api_key

# Slack
SLACK_BOT_TOKEN=your_bot_token
SLACK_USER_TOKEN=your_user_token

# Plane (optional)
PLANE_API_KEY=your_plane_key
PLANE_WORKSPACE_SLUG=your_workspace

# LinkedIn (optional)
LINKEDIN_API_KEY=your_linkedin_key
```

### Required Integrations
- Google Calendar API enabled
- Existing agent-runner framework (`/packages/core/src/lib/agent-runner.ts`)
- Google Calendar service (`/packages/core/src/services/google-calendar.ts`)

## Vision

A Chief of Staff dashboard that doesn't just show what's on your calendar—it tells you what you need to know, what you need to prepare, and what actions to take before, during, and after each meeting.

## Core Components

### 1. Smart Calendar View
- Today's schedule with intelligent event grouping
- Week/month views with priority highlighting
- Time block visualization (meetings vs. focus time vs. breaks)
- Energy optimization (meeting density alerts)

### 2. Meeting Preparation Hub
- Upcoming meetings requiring prep (next 24-48 hours)
- Preparation status for each meeting (not started / in progress / ready)
- Quick prep cards with attendee info and talking points
- One-click access to prep materials

### 3. Priority & Impact Scoring
- Each meeting color-coded by priority/impact
- "Skippable" vs. "Critical" indicators
- ROI estimates (is this meeting worth your time?)
- Delegation opportunities

### 4. Action Items & Follow-Up Tracker
- Action items extracted from meeting recordings
- Follow-up tasks by deadline
- Open items from prior meetings with same attendees
- Completion status tracking

### 5. Attendee Intelligence Panel
- Quick bios for each meeting participant
- Recent interactions and shared history
- Relationship strength indicators
- Talking points specific to each person

### 6. Time Analytics & Insights
- Time spent in meetings vs. focus work
- Meeting breakdown by type (1:1s, team, external, etc.)
- Busiest days/times of week
- Trends over time

### 7. Quick Actions & Automation
- One-click meeting actions (reschedule, decline, add notes)
- Template responses for common scenarios
- Automated workflows for repetitive tasks

### 8. Strategic Alignment View
- How calendar aligns with quarterly goals/OKRs
- Time spent on strategic vs. operational work
- Gap analysis (what's getting neglected?)

## Dashboard Layout

### Main View (Daily Focus)
- Header: Date, energy forecast, alerts, today's priorities
- Left: Timeline view with meeting cards
- Right: Meeting intelligence panel with prep status, attendees, key points, decisions needed, materials
- Footer: Today's stats (meeting time, focus time, recommendations)

### Week View
- Horizontal timeline showing all 5 days
- Visual density indicators (% meetings per day)
- Balance assessment (heavy/balanced/focus days)
- Insights and recommendations

### Insights Panel (Sidebar)
- This week's focus (strategic themes + time allocation)
- Needs attention (urgent meetings, missing agendas)
- Follow-ups due (from previous meetings)

## Technical Architecture

### Data Sources
- **Google Calendar API** (primary)
- **Slack API** (context, messages)
- **Plane API** (tasks, issues)
- **LinkedIn API** (attendee research)
- **Internal knowledge base** (meeting notes, docs)

### Agent Framework
- Each agent runs independently via existing agent-runner system
- Agents communicate via shared data layer
- Dashboard polls agent outputs and aggregates in real-time
- Caching layer prevents redundant API calls

### User Interface
- React-based dashboard (extend existing apps/agent-manager UI)
- Real-time updates via WebSocket
- Mobile-responsive design
- Keyboard shortcuts for power users
- CLI integration: `npm run calendar:dashboard`

## Implementation Phases

### Phase 1: Foundation
- Google Calendar integration
- Dashboard UI framework
- Calendar Intelligence Agent
- Auto-Prep Agent

### Phase 2: Core Intelligence
- Meeting Context Agent
- Priority Agent
- Action Agent
- Basic analytics view

### Phase 3: Advanced Features
- Transcript Analyzer Agent
- Relationship Intelligence Agent
- Strategic Alignment Agent
- Energy Management Agent

### Phase 4: Automation & Polish
- Calendar Automation Agent
- Smart Scheduling Agent
- Workflow integrations
- Mobile optimization

## Success Metrics

### User Experience
- **Time Saved**: 2+ hours/week on meeting prep
- **Prep Coverage**: 95% of meetings have preparation materials
- **Meeting Quality**: User-rated improvement in effectiveness
- **Decision Velocity**: Faster decisions due to better preparation

### Agent Performance
- **Prep Accuracy**: 90%+ relevance of auto-generated talking points
- **Action Capture**: 95%+ of action items correctly identified
- **Priority Accuracy**: 85%+ agreement with user's importance rating
- **Context Relevance**: 90%+ of surfaced context rated useful

### System Health
- **Dashboard Load Time**: < 2 seconds
- **Agent Response Time**: < 30 seconds for prep generation
- **Calendar Sync**: Real-time (< 5 second lag)
- **Uptime**: 99.9%

## User Configuration Example

```yaml
user_config:
  calendar:
    primary_email: user@example.com
    work_hours:
      start: "08:00"
      end: "18:00"
      timezone: "America/Los_Angeles"
    focus_time_goals:
      daily_minimum: 2  # hours
      preferred_blocks: ["09:00-11:00", "14:00-16:00"]
    no_meeting_days: ["Friday"]

  priorities:
    strategic_themes:
      - name: "Product Planning"
        target_hours_per_week: 4
      - name: "Customer Engagement"
        target_hours_per_week: 5
      - name: "Team Development"
        target_hours_per_week: 3

  meeting_preferences:
    auto_decline:
      - outside_work_hours: true
      - no_agenda_after_hours: 24
      - conflicts_with_focus_time: true
    auto_accept:
      - from_ceo: true
      - labeled_urgent: true

  prep_settings:
    minimum_notice: 24  # hours before meeting
    depth_by_priority:
      P1: "comprehensive"
      P2: "standard"
      P3: "quick"
```

## Security & Privacy

### Data Handling
- All calendar data encrypted in transit and at rest
- Meeting notes stored for 90 days, then archived
- PII automatically redacted from logs
- User can exclude specific meetings from AI processing

### Access Control
- OAuth2 for Google Calendar (read-only by default)
- Role-based permissions for shared calendars
- Audit log of all agent actions
- User can revoke agent access anytime

## Output

A fully functional Calendar Dashboard that:
1. Displays today's and this week's schedule with intelligent insights
2. Automatically prepares you for every meeting 24 hours in advance
3. Extracts and tracks action items from meetings
4. Provides attendee intelligence and relationship insights
5. Analyzes time allocation vs. strategic priorities
6. Offers recommendations for schedule optimization
7. Enables one-click actions for common calendar tasks
8. Integrates with existing systems (Slack, Plane, etc.)

## Target Audience

This workflow is designed to be executed by an AI assistant (like Claude Code) working with a developer to build a comprehensive calendar intelligence system for executive support.

## Quick Start Commands

```bash
# Development
npm run dev                          # Start with hot reload
npm run build                        # Compile TypeScript

# Launch Dashboard
npm run calendar:dashboard           # Start calendar dashboard

# Test Agents
node dist/cli.js run agents/calendar-intelligence.md
node dist/cli.js run agents/auto-prep.md
node dist/cli.js run agents/meeting-context.md
```

## Notes

- This is a comprehensive vision document - implement incrementally by phase
- Focus on Phase 1 foundation first before building advanced agents
- Each AI agent should be defined in its own markdown file in `/agents/`
- Use existing Google Calendar service and agent-runner infrastructure
- Dashboard UI can extend the existing `/apps/agent-manager` application
- Test with real calendar data but ensure privacy/security measures are in place

---

*For full specification details including all agent capabilities, workflows, and user stories, see original documentation.*
