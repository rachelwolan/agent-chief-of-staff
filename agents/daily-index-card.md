# Daily Index Card Agent

## Job Statement
Every evening, write down 3-5 things to accomplish tomorrow on a 3x5 index card. The next day, try like hell to get just those things done. If you do, it was a successful day.

## Philosophy
Based on Marc Andreessen's productivity system: the tactile ritual of writing by hand, carrying the physical concept digitally, and the satisfying act of marking complete at day's end provide psychological benefits traditional to-do systems can't replicate.

## Capabilities
- **Nightly planning ritual**: Select 3-5 most important tasks for tomorrow
- **Daily constraint**: Force clarity through limitation - you can't fake it or hedge
- **Anti-To-Do tracking**: Flip side captures everything accomplished during the day
- **Daily reset**: Complete psychological reset each night, no guilt about undone tasks
- **Success metric**: Did you complete your 3-5 things? If yes, successful day.

## Input Schema
```json
{
  "date": "YYYY-MM-DD",
  "priorities": [
    "Priority 1 (most important)",
    "Priority 2",
    "Priority 3"
  ],
  "accomplished": [
    "Everything else you did today (anti-to-do list)"
  ]
}
```

## Output Schema
```json
{
  "card": {
    "date": "YYYY-MM-DD",
    "createdAt": "ISO datetime",
    "priorities": ["string", "string", "string"],
    "completed": [false, false, false],
    "antiTodo": ["string"],
    "wasSuccessful": boolean,
    "completedAt": "ISO datetime | null"
  }
}
```

## Core Principles

### 1. The Nightly Ritual
- Before bed, sit down and decide: what truly matters tomorrow?
- Not 20 things, not 10 things - THREE TO FIVE things
- Write them down with intention
- This is your contract with tomorrow

### 2. The Daily Constraint  
- Only 3-5 significant accomplishments make a successful day
- Either those specific items got done, or they didn't
- The constraint forces clarity
- You can't multitask your way out - focus wins

### 3. The Anti-To-Do List (Flip Side)
- Throughout the day, write down everything useful you accomplish
- Not just the planned items - EVERYTHING productive
- Interruptions handled, problems solved, emails sent, favors done
- Get that little rush of accomplishment with each addition

### 4. The Psychological Reframe
**Traditional To-Do Lists:**
- Focus on what's undone
- Grow longer over time
- Create stress
- Highlight failures

**Anti-To-Do List:**
- Focus on what's accomplished
- Resets daily
- Creates satisfaction
- Highlights successes

### 5. The Daily Reset
- At day's end, review your card - front and back
- Marvel at all you actually accomplished
- Then tear it up (digitally: archive it)
- No permanent guilt
- Complete reset
- Start fresh tomorrow

## Success Criteria
- Did you complete your 3-5 priorities? → Successful day
- Is your anti-to-do list full of accomplishments? → Productive day
- Did you feel clarity about what mattered? → Effective planning
- Did you end the day satisfied instead of stressed? → System working

## UI/UX Requirements

### Tactile Design
- Must feel like a physical 3x5 index card
- Handwriting-style font for priorities
- Ruled lines like a real card
- Texture/shadow to give depth
- Card "flip" animation to see anti-to-do list

### Interaction Flow
1. **Evening Planning** (before bed):
   - Open blank card
   - Write 3-5 priorities for tomorrow
   - Limited to 5 lines - no cheating
   - "Lay out with keys" (save and pin to dashboard)

2. **Morning Reminder**:
   - Card appears at top of dashboard
   - Shows your 3-5 priorities
   - Clean, simple, focused

3. **Throughout Day**:
   - Check off priorities as completed
   - Flip card to add anti-to-do items
   - Quick add anything accomplished

4. **Evening Review**:
   - See completion status
   - Review anti-to-do list
   - Feel satisfaction
   - "Tear up" (archive) and start tomorrow's card

### Design Specifications
```css
/* 3x5 card dimensions (scaled for screen) */
width: 500px;
height: 300px;
background: linear-gradient(to bottom, #FFFEF8, #FBF9F0); /* Cream color */
border-radius: 2px;
box-shadow: 2px 4px 12px rgba(0,0,0,0.15);
font-family: 'Courier Prime', 'Courier New', monospace; /* Typewriter feel */

/* Ruled lines */
background-image: repeating-linear-gradient(
  0deg,
  transparent,
  transparent 45px,
  #C8E1F7 45px, /* Light blue rule lines */
  #C8E1F7 46px
);

/* Card flip effect */
transform-style: preserve-3d;
transition: transform 0.6s;
```

## Example Card

### Front (Priorities)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Friday, October 4, 2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 1. ☐ Finalize Q4 roadmap with team

 2. ☐ Review AEO metrics dashboard

 3. ☐ 1:1 with Linda re: platform strategy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Back (Anti-To-Do)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Things I Actually Did Today
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 ✓ Responded to 15 Slack messages
 ✓ Helped Jessica unblock design review
 ✓ Quick sync on hiring pipeline
 ✓ Reviewed 3 PRDs
 ✓ Coffee chat with new PM
 ✓ Fixed calendar conflicts
 ✓ Approved 2 vendor contracts
 ✓ Sent follow-up to board member

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Storage Structure
```
/logs/index-cards/
  2025-10-01.json
  2025-10-02.json
  2025-10-03.json
  ...
```

Each file contains:
```json
{
  "date": "2025-10-04",
  "createdAt": "2025-10-03T22:30:00Z",
  "priorities": [
    "Finalize Q4 roadmap with team",
    "Review AEO metrics dashboard", 
    "1:1 with Linda re: platform strategy"
  ],
  "completed": [true, true, false],
  "antiTodo": [
    "Responded to 15 Slack messages",
    "Helped Jessica unblock design review",
    "Quick sync on hiring pipeline",
    "Reviewed 3 PRDs",
    "Coffee chat with new PM"
  ],
  "wasSuccessful": false, // Only 2/3 completed
  "completedAt": "2025-10-04T18:00:00Z"
}
```

## Integration Points

### 1. New "Focus" Tab
- Primary view: Today's index card
- Large, centered card UI
- Create new card if none exists
- View card history (last 7 days)

### 2. Dashboard Top Widget
- If card exists for today, show it at very top
- Collapsed view: "Today's 3 priorities" with checkboxes
- Expand to see full card
- Always visible reminder

### 3. Evening Prompt
- At 8 PM, prompt: "Plan tomorrow's card?"
- If today's card not complete, show: "Mark remaining items complete or carry forward?"
- Ritual reinforcement

## Key Quotes (System Prompts)

> "What truly matters tomorrow? Only 3-5 things make a successful day."

> "Either those specific items got done, or they didn't. You can't fake it."

> "You know those days when you're running around all day and you get home completely exhausted and say, 'What the hell did I actually get done today?' Your Anti-Todo list has the answer."

> "Being able to put more notches on my accomplishment belt makes me feel marvelously productive and efficient."

> "At day's end, review your card—front and back—and marvel at all you actually accomplished. Then tear it up and throw it away. Complete psychological reset. Start fresh tomorrow."

## Success Metrics
- **Completion rate**: % of priorities completed per day
- **Consistency**: Days with card created (streak)
- **Anti-to-do growth**: Average items added per day
- **Satisfaction**: Subjective "was this a good day?" feeling

## Constraints
- **Maximum 5 priorities** - system enforces this
- **Minimum 1 priority** - must have focus
- **No editing after midnight** - card is locked for that day
- **No carrying forward automatically** - manual decision each night

## Future Enhancements
- Weekly review: Stack of week's cards
- Pattern recognition: What types of priorities get done?
- AI suggestions: Based on calendar and history
- Sharing: Send card to accountability partner
- Mobile app: Photo of physical card → digital card

---

*Based on Marc Andreessen's Pmarca Guide to Personal Productivity*
*"The 3x5 card method is one of the most successful productivity techniques people have ever used."*
