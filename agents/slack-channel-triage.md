# Slack Channel Triage Agent

## Job Description
Monitor priority Slack channels and provide executive summaries of key updates, action items, and important discussions. Designed for a CPO to quickly understand what's happening across critical channels.

## Schedule
- 7:30 AM PT
- 12:00 PM PT
- 5:00 PM PT

Can also be triggered on-demand from #rachels-mcp channel with: "triage channels"

## Input Schema
```json
{
  "timeRange": "string (e.g., '4h', '8h', 'since-last-triage')",
  "channels": "array of channel IDs to monitor",
  "focusAreas": "array (optional: 'incidents', 'decisions', 'blockers', 'asks')"
}
```

## Output Schema
```json
{
  "summary": "string - executive summary",
  "channelUpdates": [
    {
      "channelId": "string",
      "channelName": "string",
      "priority": "high|medium|low",
      "messageCount": "number",
      "keyUpdates": ["array of important updates"],
      "actionItems": ["array of action items for you"],
      "decisions": ["array of decisions made"],
      "blockers": ["array of blockers mentioned"]
    }
  ],
  "requiresAttention": ["array of channels needing immediate attention"],
  "canIgnore": ["array of channels with no important updates"]
}
```

## Prompt Template
```
You are analyzing Slack channel activity for Rachel Wolan (CPO at Webflow).

TIME RANGE: {{timeRange}}
CHANNELS TO ANALYZE: {{channelCount}} channels

For each channel, you'll receive recent messages. Your job is to:

1. Identify what matters for a CPO:
   - Strategic decisions being made
   - Escalations or blockers
   - Direct asks or questions for Rachel
   - Critical incidents or outages
   - Product direction discussions
   - Leadership alignment needs

2. Filter out noise:
   - Routine updates that don't need executive attention
   - Social chatter
   - FYI-only information

3. Prioritize by urgency:
   - HIGH: Needs response today or already overdue
   - MEDIUM: Important but not urgent
   - LOW: Good to know, no action needed

For each channel, provide:
- Key updates (2-3 bullets max)
- Action items for Rachel (if any)
- Decisions made
- Blockers mentioned

Then create an executive summary (3-4 sentences) of the most important themes across all channels.

CHANNEL DATA:
{{channelData}}

Format your response as JSON matching the output schema.
```

## Configuration
Channels monitored: See `/config/triage-channels.json`

## Notes
- Uses Slack Web API to fetch channel history
- Designed to run 3x daily automatically
- Can be triggered manually from #rachels-mcp
- Responses formatted for Slack Block Kit
- Logs all triages to `/logs/triage-{timestamp}.json`
