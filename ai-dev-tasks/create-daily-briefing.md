# Rule: Create Daily Briefing

## Goal

To guide an AI assistant in building a daily calendar intelligence system that automatically prepares you for each day by generating meeting prep materials, displaying a smart calendar view, and delivering a morning briefing digest. This saves 30+ minutes every morning and ensures you never walk into a meeting unprepared.

## Process

1. **Understand Requirements**: Review the Phase 1 scope including dashboard UI, auto-prep agent, meeting intelligence cards, and daily briefing digest
2. **Set Up Foundation**:
   - Verify Google Calendar integration is working (`GoogleCalendarService` exists)
   - Ensure environment variables are configured
   - Confirm required dependencies are installed (googleapis, @anthropic-ai/sdk, express, zod)
3. **Build Smart Daily Calendar View (UI)**:
   - Create dashboard UI skeleton in `apps/agent-manager/dashboard-calendar.html`
   - Build React calendar view component showing today's schedule
   - Display meetings with time blocks and visual grouping
   - Show prep status for each meeting (Ready ✅ | In Progress ⚠️ | Not Started ⏳)
   - Highlight protected focus time and flag long meetings
   - Add one-click access to meeting links
   - Implement real-time calendar sync (poll every 5 minutes)
4. **Develop Auto-Prep Agent**:
   - Create `packages/core/src/agents/auto-prep-simple.ts`
   - Define Zod schemas for input (calendar event) and output (prep card)
   - Write prompt template for prep generation focusing on talking points and brief
   - Extract meeting details (title, attendees, agenda from description)
   - Research attendees (LinkedIn profile lookup if available)
   - Generate 3-5 key talking points based on meeting type
   - Create suggested questions and one-page brief (max 200 words)
   - Store prep cards to `~/.config/claude/prep-cards/{event-id}.json`
5. **Build Scheduled Prep Job**:
   - Create `packages/core/src/schedulers/daily-prep.ts`
   - Schedule to run daily at 6pm for next day's meetings
   - Fetch tomorrow's calendar events from Google Calendar
   - For each meeting, invoke auto-prep agent
   - Save all prep cards for dashboard display
6. **Create Meeting Intelligence Cards**:
   - Build React component `MeetingCard.tsx`
   - Display compact card with prep status, attendees, key info, quick actions
   - Add modal for full prep view
   - Integrate prep card data from storage
   - Add quick action buttons: [View Prep] [Join Meeting] [Add Notes]
7. **Implement Daily Briefing (Morning Digest)**:
   - Create `packages/core/src/schedulers/morning-briefing.ts`
   - Schedule to run daily at 7am
   - Generate summary with: number of meetings, meetings needing attention, meeting time vs. focus time, top 3 priorities
   - Format as console output (later: email/Slack integration)
   - Include prep status alerts for meetings without materials
8. **Add npm Scripts**:
   - `npm run calendar:prep` - Manually trigger prep generation
   - `npm run calendar:briefing` - Get morning briefing
   - `npm run dashboard` - Open calendar dashboard
9. **Configure Environment Variables**:
   - Set `PREP_SCHEDULE_TIME=18:00` (6pm daily)
   - Set `BRIEFING_SCHEDULE_TIME=07:00` (7am daily)
   - Set `PREP_STORAGE_PATH=~/.config/claude/prep-cards`
10. **Test and Validate**:
    - Dashboard loads in < 2 seconds
    - Calendar syncs every 5 minutes
    - Auto-prep generates materials for 90%+ of meetings
    - Prep cards created within 30 seconds per meeting
    - Daily briefing runs reliably at 7am
    - User testing with real calendar data

## Prerequisites

### Environment Variables
```bash
# Google Calendar (required)
GOOGLE_CALENDAR_CLIENT_ID=your_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/oauth/calendar/callback

# Anthropic (required for prep generation)
ANTHROPIC_API_KEY=your_api_key

# Schedule Configuration
PREP_SCHEDULE_TIME=18:00           # 6pm daily
BRIEFING_SCHEDULE_TIME=07:00       # 7am daily
PREP_STORAGE_PATH=~/.config/claude/prep-cards

# Optional: LinkedIn for attendee research
LINKEDIN_API_KEY=your_linkedin_key
```

### Required Dependencies (Already Installed)
- `googleapis` - Google Calendar API
- `google-auth-library` - OAuth authentication
- `@anthropic-ai/sdk` - Claude API for prep generation
- `express` - Web server for dashboard
- `zod` - Schema validation

### Existing Infrastructure
- `packages/core/src/services/google-calendar.ts` - Google Calendar service (✅ exists)
- Agent runner framework for executing AI agents
- Existing dashboard infrastructure in `apps/agent-manager`

## What Gets Built

### 1. Smart Daily Calendar View (UI)
A dashboard displaying today's schedule with:
- Header showing date, meeting count, total meeting hours, focus time, alerts
- Morning/afternoon sections with time blocks
- Prep status indicators for each meeting
- Attendee lists and talking points
- Protected focus time highlighting
- Long meeting warnings and back-to-back block alerts
- One-click join links

### 2. Auto-Prep Agent
An AI agent that:
- Runs daily at 6pm for next day's meetings
- Extracts meeting details from Google Calendar
- Researches attendees (LinkedIn lookup)
- Generates 3-5 key talking points
- Creates 2-3 suggested questions
- Produces one-page brief (max 200 words)
- Stores prep cards as JSON files
- Updates dashboard with prep status

### 3. Meeting Intelligence Cards
Compact cards for each meeting showing:
- Time and title
- Prep status (Ready ✅ | In Progress ⚠️ | Not Started ⏳)
- Attendee count and names
- Meeting location/link
- Key talking points
- Quick action buttons

### 4. Daily Briefing (Morning Digest)
A summary delivered at 7am with:
- Number of meetings and total time
- Meetings needing attention
- Prep status alerts
- Top 3 priorities for the day
- Focus time vs. meeting time breakdown

## Auto-Prep Agent Specification

### Input Schema
```typescript
interface AutoPrepInput {
  calendarEventId: string;
  meeting: {
    title: string;
    start: string;
    end: string;
    attendees: Array<{ email: string; name: string }>;
    description?: string;
    location?: string;
  };
}
```

### Output Schema
```typescript
interface AutoPrepOutput {
  prepCard: {
    meetingTitle: string;
    dateTime: string;
    attendeeSummary: string;     // "3 internal, 1 external"
    keyPoints: string[];         // Top 3-5 talking points
    agenda?: string;             // Extracted from description
    suggestedQuestions: string[];
    onePager: string;            // Markdown brief
  };
  status: 'ready' | 'needs_review' | 'insufficient_data';
}
```

### Prompt Template
```
You are preparing Rachel for a meeting. Generate a concise prep card.

Meeting: {{meeting.title}}
Time: {{meeting.start}}
Attendees: {{meeting.attendees}}
Description: {{meeting.description}}

Provide:
1. 3-5 key talking points
2. 2-3 questions to ask
3. Brief one-pager (max 200 words)

Focus on what Rachel needs to know to show up prepared and confident.
```

## Implementation Checklist

### Week 1: Dashboard Foundation
- [ ] Create dashboard UI skeleton (`apps/agent-manager/dashboard-calendar.html`)
- [ ] Build calendar view component (reuse existing CSS)
- [ ] Integrate with existing `GoogleCalendarService`
- [ ] Display today's events with time blocks
- [ ] Add meeting card components
- [ ] Test with real calendar data

### Week 2: Auto-Prep Agent
- [ ] Create `auto-prep-simple.ts` agent
- [ ] Define input/output schemas (Zod)
- [ ] Write prompt template for prep generation
- [ ] Build scheduled job to run at 6pm
- [ ] Store prep cards in JSON files
- [ ] Link prep cards to dashboard meeting cards
- [ ] Test with sample meetings

### Week 2: Daily Briefing
- [ ] Create `morning-briefing.ts` script
- [ ] Generate summary from calendar + prep data
- [ ] Output to console (later: email/Slack)
- [ ] Test scheduled run at 7am
- [ ] Add to package.json scripts

### Polish & Testing
- [ ] Add loading states to dashboard
- [ ] Error handling for missing prep
- [ ] Mobile-responsive layout
- [ ] User testing with real calendar
- [ ] Performance optimization

## File Structure

```
/Users/rachelwolan/agent-chief-of-staff/
├── packages/
│   └── core/
│       └── src/
│           ├── agents/
│           │   └── auto-prep-simple.ts          [NEW] Auto-prep agent
│           ├── schedulers/
│           │   ├── daily-prep.ts                [NEW] Run prep at 6pm
│           │   └── morning-briefing.ts          [NEW] Run digest at 7am
│           ├── services/
│           │   └── google-calendar.ts           [EXISTS] ✅
│           └── dashboard/
│               ├── components/
│               │   ├── CalendarView.tsx         [NEW] Main calendar UI
│               │   ├── MeetingCard.tsx          [NEW] Individual meeting card
│               │   └── DailyBriefing.tsx        [NEW] Morning summary
│               └── dashboard.tsx                [NEW] Main dashboard app
├── apps/agent-manager/
│   ├── dashboard-calendar.html                  [NEW] Calendar dashboard page
│   └── dashboard-calendar.js                    [NEW] Dashboard JavaScript
└── package.json                                 [UPDATE] Add npm scripts
```

## Success Criteria

### User Experience
- ✅ See entire day's meetings in one view (< 2 second load)
- ✅ Know prep status for every meeting
- ✅ Access prep materials in 1 click
- ✅ Receive morning briefing by 7am

### Agent Performance
- ✅ Auto-prep generates materials for 90%+ of meetings
- ✅ Prep cards created within 30 seconds per meeting
- ✅ Talking points rated relevant by user (> 80%)
- ✅ Zero meetings without prep (if run night before)

### Technical
- ✅ Dashboard loads in < 2 seconds
- ✅ Calendar syncs every 5 minutes
- ✅ Prep cards stored and retrievable
- ✅ Daily briefing runs reliably at 7am

## Metrics to Track

After 2 weeks, measure:
1. **Prep Coverage**: % of meetings with prep cards
2. **Time Saved**: User estimate of prep time reduction
3. **Prep Quality**: User rating of talking points (1-5)
4. **Dashboard Usage**: Daily active use (yes/no)
5. **Morning Briefing**: Open rate and usefulness (1-5)

**Target**: 90% prep coverage, 4+ quality rating, daily dashboard use

## Output

A fully functional daily calendar intelligence system that:
1. Displays today's schedule with meeting cards and prep status
2. Automatically generates prep materials for tomorrow's meetings (runs at 6pm)
3. Delivers a morning briefing digest at 7am
4. Provides one-click access to prep materials and meeting links
5. Saves 30+ minutes every morning on meeting preparation
6. Ensures you never walk into a meeting unprepared

## Target Audience

This workflow is designed to be executed by an AI assistant (like Claude Code) working with a developer to build Phase 1 of the calendar intelligence system - focusing on immediate value delivery with minimal complexity.

## User Commands

```bash
# View today's calendar with prep status
npm run calendar:today

# Manually trigger prep generation for tomorrow
npm run calendar:prep

# Get morning briefing
npm run calendar:briefing

# Open dashboard (http://localhost:3000)
npm run dashboard
```

## Configuration (package.json)

Add these scripts to `package.json`:
```json
{
  "scripts": {
    "calendar:prep": "tsx packages/core/src/schedulers/daily-prep.ts",
    "calendar:briefing": "tsx packages/core/src/schedulers/morning-briefing.ts",
    "dashboard": "npm run server"
  }
}
```

## Next Phase Preview

**Phase 2 will add**:
- Enhanced attendee research (LinkedIn, company news)
- Slack/email context pulling
- Meeting history tracking
- Related document discovery

**But Phase 1 delivers immediate value**:
- No more scrambling to prep
- All meetings visible with context
- Daily routine automated
- 30 minutes saved every morning

## Notes

- This is Phase 1 of a larger calendar dashboard vision
- Focus on quick wins and immediate value
- No new dependencies needed - uses existing packages
- Builds on existing Google Calendar integration
- Dashboard extends existing `apps/agent-manager` infrastructure
- Keep it simple: console output for briefing before adding email/Slack

---

*Specification: Phase 1 - Daily Calendar Intelligence*
*Estimated Effort: 2 weeks*
*Value Delivered: 30+ minutes saved daily on meeting prep*
