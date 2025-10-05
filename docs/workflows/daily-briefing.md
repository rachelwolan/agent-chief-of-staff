# Phase 1: Daily Calendar Intelligence

## Overview

**Goal:** Provide a smart daily calendar view that saves 30+ minutes every morning by automatically preparing you for the day ahead.

**Value Delivered:**
- Never walk into a meeting unprepared
- Know who you're meeting and why
- See your day at a glance with context
- Get alerts for scheduling issues

**Time to Value:** 1-2 weeks

---

## What Gets Built

### 1. Smart Daily Calendar View (UI)

**Dashboard Display:**
```
┌─────────────────────────────────────────────────────────────┐
│  🗓️  Today - Thursday, October 3, 2024                      │
│  📊 15 meetings • 6.5 hours in meetings • 1.5 hours focus    │
│  ⚠️  3 meetings need prep • 2 back-to-back blocks           │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  MORNING                                                      │
├──────────────────────────────────────────────────────────────┤
│  9:00-9:30  ✍🏼Review prep for Product Coalition             │
│             📝 Prep: Ready ✅                                 │
│             👥 Kelly, Rachel                                  │
│             [View Prep] [Join Meeting]                        │
│                                                               │
│  9:30-10:30 🔴 Product Coalition Livestream (LIVE)            │
│             📝 Prep: Ready ✅                                 │
│             👥 Jay, Kelly, Steph, Rachel                      │
│             📍 https://studio.restream.io/...                 │
│             💡 Talking Points: Product updates, Q&A prep      │
│             [View Prep] [Join Meeting]                        │
│                                                               │
│  10:30-11:00 Personal (walk) 🧘                               │
│              Protected focus time                             │
├──────────────────────────────────────────────────────────────┤
│  AFTERNOON                                                    │
├──────────────────────────────────────────────────────────────┤
│  12:00-2:00  FY27 Planning Pt 3                               │
│              📝 Prep: In Progress ⚠️                          │
│              👥 10 attendees                                  │
│              ⚠️ LONG MEETING - Consider break                 │
│              💡 Decisions: Q1 resources, roadmap priorities   │
│              [Finish Prep] [View Details]                     │
│                                                               │
│  2:00-2:30   BREAK 🧘                                         │
│              Protected focus time                             │
└──────────────────────────────────────────────────────────────┘
```

**Features:**
- Pull events from Google Calendar (already built ✅)
- Display with time blocks and visual grouping
- Show prep status for each meeting
- Highlight protected focus time
- Flag long meetings and back-to-back blocks
- One-click access to meeting links

**Technical:**
- Extend existing `GoogleCalendarService`
- Build React dashboard component
- Real-time calendar sync (poll every 5 minutes)
- Responsive layout for desktop/tablet

---

### 2. Auto-Prep Agent

**Job Statement:**
> When I have meetings tomorrow, automatically generate preparation materials, so I'm never caught off guard.

**How It Works:**
1. **Trigger:** Runs daily at 6pm for next day's meetings
2. **Input:** Tomorrow's calendar events from Google Calendar
3. **Process:** For each meeting:
   - Extract meeting details (title, attendees, agenda from description)
   - Research attendees (LinkedIn profile lookup)
   - Generate talking points based on meeting type
   - Create one-page brief
4. **Output:** Prep card stored and displayed in dashboard

**Agent Spec (Simplified):**

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

interface AutoPrepOutput {
  prepCard: {
    meetingTitle: string;
    dateTime: string;
    attendeeSummary: string; // "3 internal, 1 external"
    keyPoints: string[];     // Top 3-5 talking points
    agenda?: string;         // Extracted from description
    suggestedQuestions: string[];
    onePager: string;        // Markdown brief
  };
  status: 'ready' | 'needs_review' | 'insufficient_data';
}
```

**Prompt Template:**
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

**Implementation:**
- New file: `src/agents/auto-prep-simple.ts`
- Scheduled job: `src/schedulers/daily-prep.ts` (runs at 6pm)
- Storage: Save prep cards to `~/.config/claude/prep-cards/{event-id}.json`
- Dashboard integration: Display prep status and cards

---

### 3. Meeting Intelligence Cards

**What They Show:**
For each meeting, a compact card with:
- **Prep Status:** Ready ✅ | In Progress ⚠️ | Not Started ⏳
- **Attendees:** Quick list with count
- **Key Info:** Talking points, agenda, location
- **Quick Actions:** [View Prep] [Join Meeting] [Add Notes]

**Example Card:**
```
┌──────────────────────────────────────────┐
│ 9:30-10:30 Product Coalition Livestream │
│ 📝 Prep: Ready ✅                        │
│ 👥 Jay, Kelly, Steph, Rachel (4)         │
│ 📍 https://studio.restream.io/...        │
│                                          │
│ 💡 Key Points:                           │
│ • Webflow product update for Q4          │
│ • New features: Localization, CMS v2     │
│ • Q&A: Prepare for AI/design questions   │
│                                          │
│ [View Full Prep] [Join Meeting]          │
└──────────────────────────────────────────┘
```

**Technical:**
- React component: `MeetingCard.tsx`
- Props: meeting data + prep card data
- Click "View Full Prep" → Modal with full one-pager

---

### 4. Daily Briefing (Morning Digest)

**What It Does:**
Generate a daily summary email/Slack message at 7am with:
- Number of meetings today
- Meetings needing attention (no prep, no agenda)
- Total meeting time vs. focus time
- Top 3 priorities for the day

**Example:**
```
Good morning, Rachel! ☀️

TODAY'S SCHEDULE - Thursday, October 3
• 15 meetings (6.5 hours)
• 1.5 hours focus time
• ⚠️ 3 meetings still need prep

NEEDS ATTENTION:
• 9:30am - Product Coalition Livestream 🔴 LIVE
  → Prep is ready. Join link: https://studio.restream.io/...

• 12:00pm - FY27 Planning Pt 3 (2 hours)
  → ⚠️ Finish prep before meeting
  → 10 attendees, decisions needed

• 3:30pm - Security Training
  → Pre-work required, check email

TOP PRIORITIES:
1. Product Coalition appearance (high visibility)
2. FY27 resource allocation decisions
3. Complete security training certification

Have a great day!
```

**Implementation:**
- New script: `src/schedulers/morning-briefing.ts`
- Cron job: Run at 7am daily
- Delivery: Console output (later: email/Slack integration)

---

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

---

## Implementation Checklist

### Week 1: Dashboard Foundation
- [ ] Create dashboard UI skeleton (`agent-manager/dashboard.html`)
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

---

## File Structure

```
/Users/rachelwolan/agent-chief-of-staff/
├── src/
│   ├── agents/
│   │   └── auto-prep-simple.ts          [NEW] Auto-prep agent
│   ├── schedulers/
│   │   ├── daily-prep.ts                [NEW] Run prep at 6pm
│   │   └── morning-briefing.ts          [NEW] Run digest at 7am
│   ├── services/
│   │   └── google-calendar.ts           [EXISTS] ✅
│   └── dashboard/
│       ├── components/
│       │   ├── CalendarView.tsx         [NEW] Main calendar UI
│       │   ├── MeetingCard.tsx          [NEW] Individual meeting card
│       │   └── DailyBriefing.tsx        [NEW] Morning summary
│       └── dashboard.tsx                [NEW] Main dashboard app
├── agent-manager/
│   ├── dashboard-calendar.html          [NEW] Calendar dashboard page
│   └── dashboard-calendar.js            [NEW] Dashboard JavaScript
└── package.json                         [UPDATE] Add npm scripts
```

---

## Dependencies (Already Installed ✅)

- `googleapis` - Google Calendar API
- `google-auth-library` - OAuth authentication
- `@anthropic-ai/sdk` - Claude API for prep generation
- `express` - Web server for dashboard
- `zod` - Schema validation

**No new packages needed!**

---

## Configuration

Add to `package.json`:
```json
{
  "scripts": {
    "calendar:prep": "tsx src/schedulers/daily-prep.ts",
    "calendar:briefing": "tsx src/schedulers/morning-briefing.ts",
    "dashboard": "npm run server"
  }
}
```

Add to `.env`:
```
PREP_SCHEDULE_TIME=18:00  # 6pm daily
BRIEFING_SCHEDULE_TIME=07:00  # 7am daily
PREP_STORAGE_PATH=~/.config/claude/prep-cards
```

---

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

---

## Next Phase Preview

**Phase 2 will add:**
- Enhanced attendee research (LinkedIn, company news)
- Slack/email context pulling
- Meeting history tracking
- Related document discovery

**But Phase 1 delivers immediate value:**
- No more scrambling to prep
- All meetings visible with context
- Daily routine automated
- 30 minutes saved every morning

---

## Metrics to Track

After 2 weeks, measure:
1. **Prep Coverage:** % of meetings with prep cards
2. **Time Saved:** User estimate of prep time reduction
3. **Prep Quality:** User rating of talking points (1-5)
4. **Dashboard Usage:** Daily active use (yes/no)
5. **Morning Briefing:** Open rate and usefulness (1-5)

**Target:** 90% prep coverage, 4+ quality rating, daily dashboard use

---

*Specification Version: 1.0.0*
*Phase: 1 of 5*
*Estimated Effort: 2 weeks*
*Dependencies: Google Calendar integration (✅ Complete)*
