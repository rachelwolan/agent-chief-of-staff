# Rule: Process Meeting

## Goal

To guide an AI assistant in automatically analyzing meeting transcripts or audio recordings to extract structured notes, key decisions, action items with owners and deadlines, and follow-up tasks. The system then posts formatted summaries to Slack for team visibility, transforming raw meeting content into actionable intelligence.

## Process

1. **Verify Prerequisites**:
   - Confirm Anthropic API key is configured in `.env` (for Claude analysis)
   - Verify Slack bot token is set (for posting summaries)
   - If processing audio: Confirm OpenAI API key is set (for Whisper transcription)
   - Check Slack bot has required permissions (`chat:write`, `channels:read`)
2. **Detect Input Type**:
   - Check file extension to determine if input is audio or text
   - Text formats: `.txt`, `.md`
   - Audio formats: `.mp3`, `.mp4`, `.mpeg`, `.mpga`, `.m4a`, `.wav`, `.webm`
3. **Transcribe Audio** (if applicable):
   - If input is audio file, verify file size is under 25MB (Whisper API limit)
   - Send audio to OpenAI Whisper API for transcription
   - Receive transcript text
   - Save transcript to `transcripts/` directory with same filename (different extension)
4. **Load Transcript**:
   - If input was text, read the file directly
   - If input was audio, use the newly created transcript file
   - Verify transcript has content
5. **Analyze with Meeting Processor Agent**:
   - Load agent configuration from `agents/meeting-processor.md`
   - Send transcript to Claude Sonnet 4.5 with analysis prompt
   - Extract structured information:
     - Meeting summary (2-3 sentences)
     - Key decisions made
     - Action items with owners, deadlines, and priorities
     - Open questions and follow-ups
     - Next steps
6. **Parse Agent Output**:
   - Validate output follows expected schema (Zod validation)
   - Parse action items into structured format
   - Extract owner mentions, due dates, priority levels
   - Organize decisions and next steps
7. **Format for Slack**:
   - Convert analysis into Slack-friendly markdown
   - Add proper formatting (bold, lists, mentions)
   - Structure sections with headers
   - Include emoji indicators for visual clarity
8. **Post to Slack**:
   - Connect to Slack API using bot token
   - Post formatted summary to target channel (default: `#rachels-mcp`)
   - Verify successful posting
9. **Display Confirmation**:
   - Show success message with summary preview
   - Indicate Slack channel where summary was posted
   - Display file path of saved transcript (if audio was transcribed)
10. **Save Metadata**:
    - Log processing details (timestamp, file processed, success/failure)
    - Store metadata for future reference

## Prerequisites

### Environment Variables

Add to `.env`:
```bash
# Required for all features
ANTHROPIC_API_KEY=your_anthropic_key
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token

# Required only for audio transcription
OPENAI_API_KEY=your_openai_key
```

### Slack Bot Setup

Your Slack bot must have these permissions:
- `chat:write` - Post messages to channels
- `channels:read` - List public channels

To configure:
1. Go to [Slack API](https://api.slack.com/apps)
2. Select your app or create a new one
3. Navigate to OAuth & Permissions
4. Add the required scopes
5. Install/reinstall the app to your workspace
6. Copy the Bot User OAuth Token to `.env`

### Agent Configuration

The agent spec should exist at:
- `agents/meeting-processor.md` - Agent configuration with prompt template

### Directory Structure

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

## Features

- **Audio Transcription**: Automatically transcribe audio recordings using OpenAI Whisper API
- **Smart Analysis**: Extract key decisions, action items with owners, deadlines, and priorities
- **Slack Integration**: Post formatted summaries to specified Slack channels
- **Flexible Input**: Process text transcripts or audio files (mp3, m4a, wav, etc.)
- **Structured Output**: Consistent format with sections for decisions, actions, questions, next steps
- **Owner Assignment**: Automatically detect and assign action item owners
- **Priority Detection**: Identify priority levels from meeting context

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
- Strategic choices and their rationale

### Action Items
Formatted as:
1. **Task description** - Owner: @name | Due: date | Priority: level

Example:
1. **Update Q4 roadmap and communicate to stakeholders** - Owner: @mike | Due: Oct 16 | Priority: High
2. **Document design system guidelines** - Owner: @sarah | Due: Oct 18 | Priority: High

### Open Questions & Follow-ups
- Items needing future discussion or clarification
- Unresolved topics requiring follow-up

### Next Steps
- Immediate actions that need to happen
- Dependencies and blockers to address

## Example Workflow

### Example Command
```bash
npm run meeting:process transcripts/sample-product-sync.txt
```

### Example Output
```
✔ Meeting processed successfully!
📋 Meeting Summary:

### Meeting Summary
Product team aligned on Q4 roadmap execution with key timeline adjustments. Discussed design system documentation needs and resource allocation for upcoming launches.

### Key Decisions
- Moved Q4 feature launch from Oct 20 to Oct 27 to allow for additional testing
- Prioritized design system documentation over new component development

### Action Items
1. **Update Q4 roadmap and communicate to stakeholders** - Owner: @mike | Due: Oct 16 | Priority: High
2. **Document design system guidelines** - Owner: @sarah | Due: Oct 18 | Priority: High
3. **Schedule testing session for new features** - Owner: @alex | Due: Oct 20 | Priority: Medium

### Open Questions
- Need to clarify resource availability for November sprint
- Waiting on legal review for new terms of service

### Next Steps
- Mike to send updated roadmap to exec team by EOD
- Sarah to create design system doc template
- Team to reconvene Friday for launch readiness review

✔ Posted to #rachels-mcp on Slack!
```

## Customization

### Change Target Slack Channel

Edit `packages/core/src/process-meeting.ts` to change the target channel:

```typescript
const result = await slackClient.postMeetingSummary('your-channel-name', summary);
```

### Modify Agent Behavior

Edit the agent prompt in `agents/meeting-processor.md` to change:
- Output format and structure
- What information to extract
- How to parse action items
- Priority assignment logic
- Owner detection rules

### Adjust Claude Model

Change the model in `agents/meeting-processor.md` frontmatter:

```yaml
---
model: claude-sonnet-4-20250929  # or another model
---
```

## Tips

1. **Better Transcripts**: For audio, use clear recordings with minimal background noise
2. **Name Mentions**: Use clear names in meetings for better action item assignment
3. **Explicit Deadlines**: State deadlines explicitly ("by Friday") for accurate extraction
4. **Save Costs**: Process text transcripts when available instead of re-transcribing audio
5. **Review Output**: Always review the generated summary - AI may miss nuances
6. **Consistent Naming**: Use consistent name formats for better owner attribution

## Troubleshooting

### "OPENAI_API_KEY not found"
- Only needed for audio transcription
- Add to your `.env` file
- Not required for text transcript processing
- Get key from [OpenAI Platform](https://platform.openai.com/api-keys)

### "Audio file too large"
- Whisper API limit is 25MB
- Compress audio file or split into smaller segments
- Use lower bitrate audio recordings
- Consider using a compression tool like `ffmpeg`

### "Failed to post to Slack"
- Check your `SLACK_BOT_TOKEN` is valid
- Verify bot has access to the target channel
- Ensure bot has `chat:write` permission
- Try inviting the bot to the channel: `/invite @botname`

### "Parsing Issues" / "Action items not detected"
- Agent might not always extract all items perfectly
- Review and edit the transcript for clarity
- Adjust the agent prompt in `agents/meeting-processor.md`
- Ensure speakers state action items clearly during meetings
- Add more explicit language: "Action item: X will do Y by Z"

### "Transcription quality poor"
- Use higher quality audio recordings
- Minimize background noise
- Ensure clear speaker audio
- Consider using external recording tools with noise cancellation

### "File not found"
- Verify file path is correct
- Check file exists in `transcripts/` or `transcripts/recordings/`
- Use absolute or relative paths correctly

## Output

A comprehensive meeting summary that:
1. Transcribes audio recordings (if needed) using Whisper API
2. Analyzes transcript content using Claude Sonnet 4.5
3. Extracts key decisions made during the meeting
4. Identifies action items with owners, deadlines, and priorities
5. Lists open questions and follow-up items
6. Outlines immediate next steps
7. Posts formatted summary to Slack channel
8. Saves transcript file for future reference
9. Provides confirmation and preview of processed content

## Target Audience

This workflow is designed to be executed by an AI assistant (like Claude Code) to automate meeting documentation and ensure action items are captured and communicated to the team without manual note-taking.

## Related Documentation

- [Agent Architecture](../reference/architecture.md)
- [Slack Integration](../reference/agents.md#slack-integration)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)

## Notes

- Audio transcription requires OpenAI API key and has 25MB file size limit
- Text transcript processing only requires Anthropic API key
- Slack posting is automatic but can be disabled by modifying the script
- Agent uses Claude Sonnet 4.5 for best analysis quality
- Output format is customizable via agent prompt template
- First-time users should test with sample transcript before processing important meetings
- Transcripts are saved permanently for future reference
- Consider privacy and compliance when recording meetings

---

*Transform meeting chaos into structured action plans - automatically.*
