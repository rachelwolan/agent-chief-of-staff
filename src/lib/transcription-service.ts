import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface TranscriptionOptions {
  model?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
  language?: string;
  format?: 'text' | 'json' | 'srt' | 'vtt';
  timestamps?: boolean;
}

export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
}

export interface TranscriptionResult {
  text: string;
  segments?: TranscriptionSegment[];
  language?: string;
  duration?: number;
}

export class TranscriptionService {
  private pythonPath: string;

  constructor() {
    // Use the virtual environment Python
    this.pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python');
  }

  async transcribeVideo(
    videoPath: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    const {
      model = 'base',
      language = 'auto',
      format = 'json',
      timestamps = true
    } = options;

    try {
      // Create a temporary Python script for transcription
      const scriptPath = await this.createTranscriptionScript();

      // Prepare command arguments
      const args = [
        scriptPath,
        videoPath,
        '--model', model,
        '--output-format', format
      ];

      if (language !== 'auto') {
        args.push('--language', language);
      }

      if (timestamps) {
        args.push('--timestamps');
      }

      // Execute the transcription
      const { stdout, stderr } = await execAsync(
        `${this.pythonPath} ${args.join(' ')}`,
        {
          maxBuffer: 1024 * 1024 * 50 // 50MB buffer for large transcriptions
        }
      );

      if (stderr && !stderr.includes('UserWarning')) {
        console.warn('Transcription warnings:', stderr);
      }

      // Parse the result
      const result = JSON.parse(stdout);

      return {
        text: result.text,
        segments: result.segments,
        language: result.language,
        duration: result.duration
      };
    } catch (error) {
      console.error('Transcription error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to transcribe video: ${errorMessage}`);
    }
  }

  async transcribeToMarkdown(
    videoPath: string,
    options: TranscriptionOptions = {}
  ): Promise<string> {
    const result = await this.transcribeVideo(videoPath, {
      ...options,
      format: 'json',
      timestamps: true
    });

    // Format as markdown with timestamps
    let markdown = `# Video Transcription\n\n`;
    markdown += `**File**: ${path.basename(videoPath)}\n`;
    markdown += `**Duration**: ${this.formatDuration(result.duration || 0)}\n`;
    markdown += `**Language**: ${result.language || 'Unknown'}\n\n`;
    markdown += `---\n\n`;
    markdown += `## Transcript\n\n`;

    if (result.segments) {
      for (const segment of result.segments) {
        const timestamp = this.formatTimestamp(segment.start);
        markdown += `**[${timestamp}]** ${segment.text}\n\n`;
      }
    } else {
      markdown += result.text;
    }

    return markdown;
  }

  private async createTranscriptionScript(): Promise<string> {
    const scriptContent = `
import whisper
import json
import sys
import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('video_path', help='Path to video file')
    parser.add_argument('--model', default='base', help='Whisper model size')
    parser.add_argument('--language', default=None, help='Language code')
    parser.add_argument('--output-format', default='json', help='Output format')
    parser.add_argument('--timestamps', action='store_true', help='Include timestamps')

    args = parser.parse_args()

    # Load the model
    model = whisper.load_model(args.model)

    # Transcribe
    result = model.transcribe(
        args.video_path,
        language=args.language,
        verbose=False
    )

    # Format output
    output = {
        'text': result['text'],
        'language': result.get('language', 'unknown')
    }

    if args.timestamps and 'segments' in result:
        output['segments'] = [
            {
                'text': seg['text'],
                'start': seg['start'],
                'end': seg['end']
            }
            for seg in result['segments']
        ]

    # Get duration from last segment
    if result.get('segments'):
        output['duration'] = result['segments'][-1]['end']

    print(json.dumps(output))

if __name__ == '__main__':
    main()
`;

    const scriptPath = path.join(process.cwd(), 'transcribe_temp.py');
    await fs.writeFile(scriptPath, scriptContent);
    return scriptPath;
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  async cleanup(): Promise<void> {
    // Remove temporary script
    try {
      await fs.unlink(path.join(process.cwd(), 'transcribe_temp.py'));
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }
}