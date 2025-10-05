# Video Transcriber Agent Specification

## Overview

The Video Transcriber Agent converts video and audio content into structured, searchable text documents with timestamps, speaker identification, and key insights extraction.

## Agent Metadata

```yaml
name: video-transcriber
version: 1.0.0
type: content-processing
category: media-automation
author: Agent Chief of Staff Team
engine: whisper-base
```

## Capabilities

### Primary Functions

1. **Media Processing**
   - Video file transcription (MP4, AVI, MOV, WebM)
   - Audio file transcription (MP3, WAV, M4A, FLAC)
   - Multi-language detection and transcription
   - Timestamp generation

2. **Content Enhancement**
   - Speaker diarization (when possible)
   - Punctuation and formatting
   - Chapter detection
   - Key quote extraction

3. **Output Generation**
   - Markdown formatted transcripts
   - JSON structured data
   - SRT/VTT subtitle files
   - Executive summaries

## Input Schema

```typescript
interface VideoTranscriberInput {
  media: {
    path: string;           // Local file path or URL
    type: 'video' | 'audio';
    format: string;         // mp4, mp3, etc.
    duration?: number;      // seconds
  };
  options: {
    language?: string;      // ISO 639-1 code, 'auto' for detection
    model?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
    timestamps?: boolean;
    speakerDiarization?: boolean;
    summarize?: boolean;
    outputFormat?: 'markdown' | 'json' | 'srt' | 'vtt' | 'all';
  };
  context?: {
    expectedSpeakers?: string[];
    topic?: string;
    glossary?: string[];  // Domain-specific terms
  };
}
```

## Output Schema

```typescript
interface VideoTranscriberOutput {
  transcript: {
    fullText: string;
    segments: Array<{
      id: number;
      text: string;
      start: number;      // seconds
      end: number;        // seconds
      speaker?: string;
      confidence?: number;
    }>;
    language: string;
    duration: number;
  };
  summary?: {
    brief: string;        // 2-3 sentences
    keyPoints: string[];
    actionItems?: string[];
    decisions?: string[];
  };
  metadata: {
    fileName: string;
    processedAt: string;
    processingTime: number;
    modelUsed: string;
    wordCount: number;
    accuracy?: number;
  };
  files: {
    markdown?: string;    // Path to .md file
    json?: string;       // Path to .json file
    subtitles?: string;  // Path to .srt/.vtt file
  };
}
```

## Processing Pipeline

```mermaid
graph LR
    A[Media Input] --> B[Audio Extraction]
    B --> C[Whisper Processing]
    C --> D[Text Enhancement]
    D --> E[Format Generation]
    E --> F[Quality Check]
    F --> G[Output Files]
```

## Technical Implementation

### Whisper Configuration

```python
import whisper

class TranscriptionConfig:
    model_size = "base"  # Default model
    language = None      # Auto-detect
    task = "transcribe"  # or "translate"
    temperature = 0      # Deterministic
    compression_ratio_threshold = 2.4
    logprob_threshold = -1.0
    no_speech_threshold = 0.6
    condition_on_previous_text = True
    initial_prompt = None
```

### Processing Steps

1. **Pre-processing**
   ```bash
   ffmpeg -i input.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 output.wav
   ```

2. **Transcription**
   ```python
   model = whisper.load_model("base")
   result = model.transcribe(
       audio_path,
       language=language,
       verbose=False,
       task="transcribe"
   )
   ```

3. **Post-processing**
   - Clean up filler words
   - Add punctuation
   - Format timestamps
   - Generate chapters

## Configuration

```yaml
settings:
  default_model: base
  max_file_size: 500MB
  supported_formats:
    video: [mp4, avi, mov, webm, mkv]
    audio: [mp3, wav, m4a, flac, ogg]
  output:
    directory: ./outputs/transcripts
    format: markdown
    include_timestamps: true
    include_summary: true
  performance:
    use_gpu: false
    batch_size: 1
    num_workers: 2
```

## Trigger Conditions

1. **Manual Trigger**: Direct file upload or URL
2. **Plane Integration**: Issue labeled with "transcribe"
3. **Folder Watch**: Auto-process new media files
4. **API Endpoint**: POST /api/transcribe

## Performance Requirements

- **Processing Speed**: ~1:1 ratio with media length (base model)
- **Accuracy**: > 90% for clear audio
- **File Size Limit**: 500MB per file
- **Concurrent Jobs**: 3 simultaneous transcriptions
- **Memory Usage**: < 4GB per process

## Error Handling

```typescript
enum TranscriptionError {
  FILE_NOT_FOUND = 'Media file does not exist',
  UNSUPPORTED_FORMAT = 'File format not supported',
  AUDIO_EXTRACTION_FAILED = 'Could not extract audio',
  MODEL_LOAD_FAILED = 'Whisper model failed to load',
  PROCESSING_TIMEOUT = 'Transcription exceeded time limit',
  INSUFFICIENT_MEMORY = 'Not enough memory for model'
}
```

## Example Usage

### CLI Command
```bash
# Basic transcription
npm run agent:transcribe -- --file video.mp4

# With options
npm run agent:transcribe -- \
  --file presentation.mp4 \
  --model medium \
  --language en \
  --summarize \
  --format markdown
```

### Programmatic Usage
```typescript
const transcriber = new VideoTranscriberAgent();
const result = await transcriber.transcribe({
  media: {
    path: '/path/to/video.mp4',
    type: 'video'
  },
  options: {
    language: 'en',
    model: 'base',
    timestamps: true,
    summarize: true
  }
});
```

### Workflow Integration
```json
{
  "trigger": {
    "type": "label_added",
    "params": { "label": "transcribe" }
  },
  "action": {
    "type": "run_agent",
    "params": {
      "agentName": "video-transcriber",
      "agentPrompt": "Transcribe the video linked in this issue"
    }
  }
}
```

## Quality Assurance

### Accuracy Metrics
- Word Error Rate (WER)
- Character Error Rate (CER)
- Timestamp alignment accuracy

### Quality Checks
1. Confidence threshold validation
2. Language detection verification
3. Audio quality assessment
4. Output formatting validation

## Resource Management

### System Requirements
- **CPU**: 4+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB for models + workspace
- **GPU**: Optional, improves speed 5-10x

### Model Selection Guide
| Model | Size | RAM  | Speed | Accuracy |
|-------|------|------|-------|----------|
| tiny  | 75MB | 1GB  | Fast  | Good     |
| base  | 150MB| 2GB  | Good  | Better   |
| small | 500MB| 3GB  | OK    | Great    |
| medium| 1.5GB| 5GB  | Slow  | Excellent|
| large | 3GB  | 10GB | Slow  | Best     |

## Monitoring & Metrics

- **Performance Metrics**:
  - Average processing time per minute of media
  - Queue length and wait times
  - Success/failure rates

- **Usage Analytics**:
  - Total minutes transcribed
  - Most common languages
  - Peak usage times

## Security Considerations

- **Data Privacy**: Local processing, no external API calls
- **File Validation**: Check file headers, not just extensions
- **Sandboxing**: Process in isolated environment
- **Cleanup**: Remove temporary files after processing

## Future Enhancements

1. **Advanced Features**:
   - Real-time streaming transcription
   - Multi-speaker identification
   - Emotion and sentiment analysis
   - Background noise removal

2. **Integrations**:
   - YouTube/Vimeo direct download
   - Cloud storage (S3, GCS, Azure)
   - Video conferencing platforms
   - Podcast RSS feeds

3. **Output Enhancements**:
   - Interactive web viewer
   - Search and highlight
   - Translation to multiple languages
   - Video chapter generation

---

*Specification Version: 1.0.0*
*Last Updated: September 2024*