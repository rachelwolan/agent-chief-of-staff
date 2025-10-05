# Chief of Staff Calendar Dashboard Specification

## Overview

The Calendar Dashboard provides an intelligent, context-rich view of your schedule with AI-powered insights and automated preparation workflows. It transforms your Google Calendar from a simple list of events into a strategic command center with actionable intelligence.

## Vision

A Chief of Staff dashboard that doesn't just show what's on your calendar—it tells you what you need to know, what you need to prepare, and what actions to take before, during, and after each meeting.

---

## Core Components

### 1. Smart Calendar View

**What It Shows:**
- Today's schedule with intelligent event grouping
- Week/month views with priority highlighting
- Time block visualization (meetings vs. focus time vs. breaks)
- Energy optimization (meeting density alerts)

**AI Agent Opportunities:**

### 2. Meeting Preparation Hub

**What It Shows:**
- Upcoming meetings requiring prep (next 24-48 hours)
- Preparation status for each meeting (not started / in progress / ready)
- Quick prep cards with attendee info and talking points
- One-click access to prep materials

**AI Agent Opportunities:**

#### **Auto-Prep Agent** (Enhanced Meeting Prep)
- **Job:** Automatically prepare me for every meeting on my calendar
- **Capabilities:**
  - Trigger 24 hours before each meeting
  - Fetch meeting details from Google Calendar
  - Research all attendees (LinkedIn, company news, recent work, shared context)
  - Pull agenda from calendar description
  - Generate talking points aligned with my goals
  - Surface prior meeting notes and action items
  - Create one-page meeting brief
  - Flag missing information (no agenda, unclear purpose)
  - Suggest questions to ask based on attendee backgrounds
  - Identify decision points and prep needed materials

#### **Meeting Context Agent**
- **Job:** Surface relevant context from across all my systems
- **Capabilities:**
  - Search Slack for recent conversations with attendees
  - Pull Plane issues related to meeting topic
  - Find shared documents (Google Docs, Notion, etc.)
  - Identify prior commitments or promises made
  - Surface recent email threads with participants
  - Track follow-ups from previous meetings
  - Link related calendar events (prep calls, follow-ups)

#### **Agenda Intelligence Agent**
- **Job:** Ensure every meeting has a clear purpose and structure
- **Capabilities:**
  - Extract agenda from calendar event description
  - Score agenda quality (specific vs. vague)
  - Suggest agenda improvements
  - Generate agenda template if missing
  - Align agenda items with strategic priorities
  - Estimate time needed per agenda item
  - Flag over-packed agendas

---

### 3. Priority & Impact Scoring

**What It Shows:**
- Each meeting color-coded by priority/impact
- "Skippable" vs. "Critical" indicators
- ROI estimates (is this meeting worth your time?)
- Delegation opportunities

**AI Agent Opportunities:**

#### **Meeting Prioritization Agent**
- **Job:** Help me decide which meetings deserve my time
- **Capabilities:**
  - Score meeting importance (1-10) based on:
    - Strategic alignment with my goals
    - Attendee seniority and influence
    - Decision-making authority needed
    - Time sensitivity of topics
    - Unique value I bring (could someone else attend?)
  - Flag meetings I can decline or delegate
  - Suggest alternative attendees for low-priority meetings
  - Calculate opportunity cost (what else could I do instead?)
  - Track historical meeting value (was it worth it?)
  - Recommend recurring meeting cancellation when value drops

#### **Delegation Recommendation Agent**
- **Job:** Identify meetings others on my team should attend instead
- **Capabilities:**
  - Analyze meeting purpose and required expertise
  - Match meetings to team member skills/responsibilities
  - Suggest who else could represent my perspective
  - Draft delegation messages with context
  - Track delegation success rate
  - Identify gaps in team coverage

---

### 4. Action Items & Follow-Up Tracker

**What It Shows:**
- Action items extracted from meeting recordings on Zoom and Loom
- Follow-up tasks by deadline
- Open items from prior meetings with same attendees
- Completion status tracking

**AI Agent Opportunities:**

#### **Post-Meeting Action Agent**
- **Job:** Extract and track commitments from every meeting
- **Capabilities:**
  - Parse meeting notes/transcripts for action items
  - Identify who committed to what
  - Set deadlines based on conversation context
  - Create tasks in Plane or task manager
  - Send follow-up emails with action item summaries
  - Track completion status
  - Remind attendees of pending commitments
  - Surface blocked or overdue items before next meeting

#### **Meeting Transcript Analyzer Agent**
- **Job:** Turn meeting recordings into actionable intelligence
- **Capabilities:**
  - Transcribe meeting audio/video
  - Extract key decisions made and keep a decision log
  - Identify action items and owners
  - Highlight important insights or quotes
  - Detect sentiment and engagement levels
  - Flag disagreements or unresolved issues
  - Generate executive summary
  - Create searchable meeting knowledge base

---

### 5. Attendee Intelligence Panel

**What It Shows:**
- Quick bios for each meeting participant
- Recent interactions and shared history over Email and Slack
- Relationship strength indicators
- Talking points specific to each person

**AI Agent Opportunities:**

#### **Relationship Intelligence Agent**
- **Job:** Help me build stronger relationships through every interaction
- **Capabilities:**
  - Track interaction frequency with each person
  - Note important personal details (birthdays, interests, etc.)
  - Surface recent wins or challenges they're facing
  - Suggest relationship-building opportunities
  - Identify "neglected" relationships (haven't connected in X months)
  - Recommend coffee chats or informal check-ins
  - Track relationship "temperature" over time
  - Flag when someone needs attention or support

#### **Attendee Research Agent**
- **Job:** Know everything relevant about meeting participants
- **Capabilities:**
  - Auto-research new attendees before first meeting
  - Pull LinkedIn profile, role, background
  - Find recent posts, articles, or announcements
  - Identify mutual connections
  - Surface shared interests or experiences
  - Track career progression and aspirations
  - Note communication preferences (email vs. Slack, formal vs. casual)
  - Highlight potential collaboration opportunities

---

### 6. Time Analytics & Insights

**What It Shows:**
- Time spent in meetings vs. focus work
- Meeting breakdown by type (1:1s, team, external, etc.)
- Busiest days/times of week
- Trends over time (am I getting more meeting-heavy?)

**AI Agent Opportunities:**

#### **Calendar Analytics Agent**
- **Job:** Help me understand and optimize how I spend my time
- **Capabilities:**
  - Weekly time audit (where did my hours go?)
  - Compare time allocation to stated priorities
  - Identify time drains (low-value recurring meetings)
  - Benchmark against ideal schedule template
  - Track progress toward time management goals
  - Suggest schedule optimizations
  - Generate weekly time reports
  - Alert when calendar diverges from priorities
  - Forecast upcoming busy periods
  - Recommend proactive schedule adjustments

#### **Energy Management Agent**
- **Job:** Optimize my schedule for peak performance
- **Capabilities:**
  - Survey me for every meeting -2, -1, 0, 1, 2 on my energy at the end of the meeting
  - Learn my energy patterns (morning person vs. night owl)
  - Suggest optimal meeting times based on energy levels
  - Flag draining meeting sequences (too many hard conversations)
  - Recommend strategic break placement
  - Balance high-energy and low-energy activities
  - Detect burnout risk from calendar patterns
  - Suggest recovery time after intense periods
  - Track meeting fatigue over time

---

### 7. Quick Actions & Automation

**What It Shows:**
- One-click meeting actions (reschedule, decline, add notes)
- Template responses for common scenarios
- Automated workflows for repetitive tasks

**AI Agent Opportunities:**

#### **Calendar Automation Agent**
- **Job:** Handle routine calendar management so I don't have to
- **Capabilities:**
  - Auto-accept meetings that match criteria
  - Auto-decline meetings outside core hours
  - Suggest reschedules for conflicting events
  - Propose alternative times using availability
  - Send automatic prep reminders
  - Book prep time before important meetings
  - Add buffer time between back-to-back meetings
  - Update meeting status (prep done, attended, follow-up sent)
  - Archive old meeting notes
  - Clean up duplicate or outdated events

#### **Smart Scheduling Agent**
- **Job:** Find optimal meeting times without endless back-and-forth
- **Capabilities:**
  - Analyze all attendees' availability
  - Consider timezone differences
  - Factor in travel time between locations
  - Respect focus time and preferences
  - Suggest best time slots (not just available, but optimal)
  - Handle meeting reschedule requests
  - Propose alternative attendees if conflicts exist
  - Batch similar meetings for efficiency
  - Negotiate meeting duration (suggest 25/50 min vs. 30/60)

---

### 8. Strategic Alignment View

**What It Shows:**
- How calendar aligns with quarterly goals/OKRs
- Time spent on strategic vs. operational work
- Gap analysis (what's getting neglected?)

**AI Agent Opportunities:**

#### **Strategic Alignment Agent**
- **Job:** Ensure my calendar reflects my priorities
- **Capabilities:**
  - Tag meetings by strategic theme (product, hiring, customers, etc.)
  - Calculate time allocation vs. stated priorities
  - Flag misalignment (spending 5% on claimed top priority)
  - Suggest calendar changes to better align with goals
  - Track progress toward strategic objectives through meetings
  - Identify missing meetings (who should I be talking to?)
  - Recommend new recurring meetings for neglected areas
  - Quarterly calendar review and optimization

#### **Goal Progress Agent**
- **Job:** Connect calendar activities to measurable outcomes
- **Capabilities:**
  - Link meetings to specific OKRs or projects
  - Track which goals are getting attention
  - Measure meeting effectiveness toward goal progress
  - Surface goals without supporting calendar time
  - Suggest meeting adjustments to accelerate goal completion
  - Generate goal-oriented weekly schedule templates
  - Alert when high-priority goals lack calendar support

---

## Dashboard Layout

### Main View (Daily Focus)

```
┌─────────────────────────────────────────────────────────────┐
│  🗓️  Thursday, October 3, 2024                              │
│                                                              │
│  ⚡ Energy Forecast: High until 2pm, schedule hard work early│
│  ⚠️  Alert: 5 meetings without prep • 2 scheduling conflicts │
│  ✅ Today's Priorities: Product Coalition, FY27 Planning     │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────────────────────────────┐
│  📅 Timeline     │  🎯 Meeting Intelligence                 │
├──────────────────┼──────────────────────────────────────────┤
│                  │                                          │
│  8:30-9:00       │  📝 Prep Status: Not Started             │
│  [P2] Rachel to  │  💡 Quick Prep: Call Kirk to confirm     │
│  cancel Kirk     │                                          │
│                  │  🔗 Quick Actions:                       │
│  ─────────────   │  [Cancel] [Reschedule] [Add Notes]      │
│                  │                                          │
│  9:30-10:30      │  📝 Prep Status: Ready ✅                │
│  [P1] Product    │  👥 Attendees: Jay (Product Coalition)   │
│  Coalition Live  │     Kelly (Webflow), Steph (Webflow)     │
│  🔴 LIVE         │                                          │
│                  │  💡 Key Points:                          │
│  ─────────────   │  • New podcast format launch            │
│                  │  • Webflow product updates to share      │
│                  │  • Q&A preparation                       │
│  12:00-2:00      │                                          │
│  [P1] FY27       │  📝 Prep Status: In Progress             │
│  Planning Pt 3   │  👥 10 attendees (click to expand)       │
│  ⚠️ LONG         │                                          │
│                  │  💡 Decisions Needed:                    │
│  ─────────────   │  • Q1 resource allocation               │
│                  │  • Product roadmap priorities            │
│  2:00-2:30       │  • Budget approval                       │
│  BREAK           │                                          │
│  🧘 Protected    │  📄 Prep Materials:                      │
│                  │  → FY27 Planning Doc (Google Docs)       │
│                  │  → Q4 Metrics Dashboard (Plane)          │
│                  │  → Prior meeting notes                   │
│                  │                                          │
└──────────────────┴──────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📊 Today's Stats                                            │
│  ⏱️  Total Meeting Time: 6.5 hours (78% of workday)         │
│  🎯 Focus Time: 1.5 hours (fragmented across 3 blocks)       │
│  ⚡ Recommendation: Block Friday morning for deep work       │
└─────────────────────────────────────────────────────────────┘
```

### Week View

```
┌─────────────────────────────────────────────────────────────┐
│  Week of October 1-5, 2024                                   │
│                                                              │
│  Mon    ▓▓▓▓▓▓░░░░  65% meetings (8 events)                 │
│  Tue    ▓▓▓▓▓▓▓▓▓░  85% meetings (11 events) ⚠️ HEAVY       │
│  Wed    ▓▓▓▓░░░░░░  45% meetings (6 events) ✅ BALANCED     │
│  Thu    ▓▓▓▓▓▓▓▓░░  78% meetings (15 events) ⚠️ HEAVY       │
│  Fri    ▓▓░░░░░░░░  25% meetings (3 events) 🎯 FOCUS DAY    │
│                                                              │
│  💡 Insight: Consider moving Thu recurring meetings to Mon   │
│  🎯 Protected Focus: 12 hours this week                      │
│  ⚠️  Prep Needed: 8 meetings without materials              │
└─────────────────────────────────────────────────────────────┘
```

### Insights Panel (Sidebar)

```
┌──────────────────────────┐
│  🎯 This Week's Focus    │
├──────────────────────────┤
│  1. FY27 Planning        │
│     4 hrs scheduled ✅   │
│                          │
│  2. Customer Meetings    │
│     2 hrs scheduled ⚠️   │
│     (Goal: 5 hrs/week)   │
│                          │
│  3. Team 1:1s            │
│     3 hrs scheduled ✅   │
└──────────────────────────┘

┌──────────────────────────┐
│  🚨 Needs Attention      │
├──────────────────────────┤
│  • Product Coalition     │
│    🔴 LIVE in 30 mins    │
│    [Open Prep]           │
│                          │
│  • Ryan <> Rachel        │
│    ⚠️ No agenda set      │
│    [Generate Agenda]     │
│                          │
│  • Security Training     │
│    ℹ️  Pre-work required │
│    [View Materials]      │
└──────────────────────────┘

┌──────────────────────────┐
│  ✅ Follow-Ups Due       │
├──────────────────────────┤
│  From: FY26 CAB Retro    │
│  • Send summary notes    │
│  • Schedule Q1 kickoff   │
│  ⏰ Due: Today EOD        │
│                          │
│  From: Alpha Arcade      │
│  • Submit feedback form  │
│  ⏰ Due: Tomorrow         │
└──────────────────────────┘
```

---

## Workflow Integration

### Morning Routine (Automated)
1. **Calendar Analytics Agent** generates daily briefing
2. **Auto-Prep Agent** ensures all today's meetings have prep
3. **Priority Agent** highlights must-attend vs. optional
4. **Action Agent** surfaces overdue follow-ups
5. **Dashboard** displays unified view by 7am

### Pre-Meeting (15 minutes before)
1. **Meeting Context Agent** pulls all relevant info
2. **Attendee Research Agent** provides quick bios
3. **Agenda Intelligence Agent** surfaces talking points
4. **Dashboard** shows prep card notification

### Post-Meeting (Immediately after)
1. **Transcript Analyzer Agent** processes recording
2. **Action Agent** extracts commitments
3. **Follow-Up Agent** drafts summary email
4. **Dashboard** updates action items tracker

### Weekly Review (Friday afternoon)
1. **Calendar Analytics Agent** generates weekly report
2. **Strategic Alignment Agent** checks priority alignment
3. **Energy Management Agent** suggests next week optimizations
4. **Dashboard** displays insights and recommendations

---

## Agent Coordination Matrix

| Agent | Triggers On | Outputs To | Dependencies |
|-------|-------------|------------|--------------|
| Calendar Intelligence | Daily @ 7am, Calendar changes | Dashboard, Email digest | Google Calendar API |
| Auto-Prep | 24h before meeting | Meeting cards, Slack | Calendar, LinkedIn, Plane |
| Meeting Context | Pre-meeting (15 min) | Prep cards | Slack, Plane, Google Docs |
| Priority Agent | Daily @ 7am, New event | Meeting labels | Strategic goals data |
| Action Agent | Post-meeting, Daily @ 5pm | Task tracker, Reminders | Meeting transcripts, Notes |
| Transcript Analyzer | Meeting end + 5 min | Action Agent, Archive | Video/audio files |
| Relationship Agent | Weekly, Pre-meeting | Attendee cards | CRM, Interaction logs |
| Calendar Analytics | Weekly Friday @ 4pm | Insights panel, Report | Historical calendar data |
| Strategic Alignment | Weekly Friday @ 4pm | Alignment view | OKRs, Goals database |
| Automation Agent | Real-time (calendar events) | Calendar updates | User preferences |

---

## Technical Architecture

### Data Sources
- **Google Calendar API** (primary)
- **Slack API** (context, messages)
- **Plane API** (tasks, issues)
- **LinkedIn API** (attendee research)
- **Internal knowledge base** (meeting notes, docs)
- **Webflow internal systems** (org charts, team data)

### Agent Framework
- Each agent runs independently via the existing agent-runner system
- Agents communicate via shared data layer (calendar events as central hub)
- Dashboard polls agent outputs and aggregates in real-time
- Caching layer prevents redundant API calls

### User Interface
- React-based dashboard (can extend existing agent-manager UI)
- Real-time updates via WebSocket
- Mobile-responsive design
- Keyboard shortcuts for power users
- Integration with existing CLI (`npm run calendar:dashboard`)

---

## Success Metrics

### User Experience
- **Time Saved**: 2+ hours/week on meeting prep
- **Prep Coverage**: 95% of meetings have preparation materials
- **Meeting Quality**: User-rated improvement in meeting effectiveness
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

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- ✅ Google Calendar integration (DONE)
- Build dashboard UI framework
- Implement Calendar Intelligence Agent
- Deploy Auto-Prep Agent

### Phase 2: Core Intelligence (Weeks 3-4)
- Meeting Context Agent
- Priority Agent
- Action Agent
- Basic analytics view

### Phase 3: Advanced Features (Weeks 5-6)
- Transcript Analyzer Agent
- Relationship Intelligence Agent
- Strategic Alignment Agent
- Energy Management Agent

### Phase 4: Automation & Polish (Weeks 7-8)
- Calendar Automation Agent
- Smart Scheduling Agent
- Workflow integrations
- Mobile optimization

---

## Example User Stories

### Story 1: The Over-Scheduled Executive
> "As a CPO with 40+ meetings/week, I want my calendar to tell me which meetings I can safely decline, so I can reclaim time for strategic work."

**Agents Activated:**
- Priority Agent scores all meetings
- Delegation Agent suggests alternates
- Calendar Analytics shows time allocation vs. priorities
- Dashboard highlights "skippable" meetings in yellow

### Story 2: The Unprepared Leader
> "As a product leader, I want to never walk into a meeting cold again, so I can make better decisions and build stronger relationships."

**Agents Activated:**
- Auto-Prep Agent generates briefings 24h ahead
- Meeting Context Agent pulls relevant Slack/Plane threads
- Attendee Research Agent provides bios
- Dashboard shows prep status and one-click access

### Story 3: The Forgotten Follow-Up
> "As a busy manager, I want action items automatically tracked and surfaced, so nothing falls through the cracks."

**Agents Activated:**
- Transcript Analyzer extracts commitments
- Action Agent creates tasks and reminders
- Post-Meeting Agent sends follow-up emails
- Dashboard shows outstanding items before next meeting

### Story 4: The Misaligned Schedule
> "As a strategic leader, I want my calendar to reflect my stated priorities, so I'm spending time on what matters most."

**Agents Activated:**
- Strategic Alignment Agent compares time vs. OKRs
- Calendar Analytics identifies gaps
- Goal Progress Agent surfaces neglected priorities
- Dashboard shows alignment score and recommendations

---

## Configuration & Personalization

### User Preferences
```yaml
user_config:
  calendar:
    primary_email: rachel.wolan@webflow.com
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
      - name: "FY27 Planning"
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

  agent_settings:
    transcript_analyzer:
      enabled: true
      auto_process: true
    relationship_agent:
      track_personal_details: true
      reminder_frequency: "weekly"
    energy_management:
      track_patterns: true
      suggest_optimizations: true
```

---

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

### Compliance
- GDPR compliant for EU attendees
- SOC 2 Type II certified infrastructure
- Data residency options available
- Opt-out available for sensitive meetings

---

*Specification Version: 1.0.0*
*Last Updated: October 2024*
*Author: Chief of Staff Agent Team*
