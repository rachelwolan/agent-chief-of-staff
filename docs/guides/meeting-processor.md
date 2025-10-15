# Meeting Processor Guide

The Meeting Processor automatically analyzes meeting transcripts or audio recordings to extract structured notes, action items, key decisions, and follow-up tasks. It posts formatted summaries to Slack for team visibility.

## Features

- **Audio Transcription**: Automatically transcribe audio recordings using OpenAI Whisper API
- **Smart Analysis**: Extract key decisions, action items with owners, deadlines, and priorities
- **Slack Integration**: Post formatted summaries to specified Slack channels
- **Flexible Input**: Process text transcripts or audio files (mp3, m4a, wav, etc.)

## Setup

### Required Environment Variables

Add these to your `.env` file:

```bash
# Required for all features
ANTHROPIC_API_KEY=your_anthropic_key
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token

# Required only for audio transcription
OPENAI_API_KEY=your_openai_key
```

### Slack Bot Permissions

Ensure your Slack bot has these scopes:
- `chat:write` - Post messages to channels
- `channels:read` - List public channels

## Usage

### Process Text Transcript

```bash
npm run meeting:process transcripts/team-sync.txt
```

### Process Audio Recording

```bash
npm run meeting:process transcripts/recordings/meeting.m4a
```

Supported audio formats: mp3, mp4, mpeg, mpga, m4a, wav, webm

**Note**: Whisper API has a 25MB file size limit. For larger files, compress or split them first.

## How It Works

1. **Input Detection**: Automatically detects if input is audio or text
2. **Transcription** (if audio): Uses Whisper API to transcribe and saves transcript to `transcripts/`
3. **Analysis**: Claude Sonnet 4.5 analyzes the transcript using the meeting-processor agent
4. **Extraction**: Parses structured data (decisions, action items, open questions, next steps)
5. **Slack Posting**: Formats and posts summary to `#rachels-mcp` channel

## Output Format

The processor generates:

### Meeting Summary
2-3 sentence overview of what was discussed and outcomes

### Key Decisions
- Major decisions made during the meeting

### Action Items
Formatted as:
1. **Task description** - Owner: @name | Due: date | Priority: level

### Open Questions & Follow-ups
- Items needing future discussion or clarification

### Next Steps
- Immediate actions that need to happen

## Examples

### Example Command
```bash
npm run meeting:process transcripts/sample-product-sync.txt
```

### Example Output
```
✔ Meeting processed successfully!
📋 Meeting Summary:

### Meeting Summary
Product team aligned on Q4 roadmap execution with key timeline adjustments...

### Action Items
1. **Update Q4 roadmap and communicate to stakeholders** - Owner: @mike | Due: Oct 16 | Priority: High
2. **Document design system guidelines** - Owner: @sarah | Due: Oct 18 | Priority: High
...

✔ Posted to #rachels-mcp on Slack!
```

## Customization

### Change Target Slack Channel

Edit `packages/core/src/process-meeting.ts` line 79:

```typescript
const result = await slackClient.postMeetingSummary('your-channel-name', summary);
```

### Modify Agent Behavior

Edit the agent prompt in `agents/meeting-processor.md` to change:
- Output format
- What information to extract
- How to parse action items
- Priority assignment logic

### Adjust Claude Model

Change the model in `agents/meeting-processor.md` frontmatter:

```yaml
---
model: claude-sonnet-4.5-20250929  # or another model
---
```

## Tips

1. **Better Transcripts**: For audio, use clear recordings with minimal background noise
2. **Name Mentions**: Use clear names in meetings for better action item assignment
3. **Explicit Deadlines**: State deadlines explicitly ("by Friday") for accurate extraction
4. **Save Costs**: Process text transcripts when available instead of re-transcribing audio

## Troubleshooting

### "OPENAI_API_KEY not found"
- Only needed for audio transcription
- Add to your `.env` file
- Not required for text transcript processing

### "Audio file too large"
- Whisper API limit is 25MB
- Compress audio file or split into smaller segments
- Use lower bitrate audio recordings

### "Failed to post to Slack"
- Check your `SLACK_BOT_TOKEN` is valid
- Verify bot has access to the target channel
- Ensure bot has `chat:write` permission

### Parsing Issues
- Agent might not always extract all items perfectly
- Review and edit the transcript for clarity
- Adjust the agent prompt in `agents/meeting-processor.md`

## File Structure

```
transcripts/
├── recordings/           # Place audio files here
│   └── meeting.m4a
├── sample-product-sync.txt
└── [auto-saved transcripts from audio]

agents/
└── meeting-processor.md  # Agent configuration and prompt

packages/core/src/
├── process-meeting.ts    # Main processor script
└── services/
    ├── transcription.ts  # Whisper API integration
    └── slack.ts         # Slack posting logic
```

## Related Documentation

- [Agent Architecture](../reference/architecture.md)
- [Slack Integration](../reference/agents.md#slack-integration)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
