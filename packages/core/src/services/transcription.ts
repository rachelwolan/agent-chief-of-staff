import OpenAI from 'openai';
import { createReadStream, statSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { basename, join, dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TranscriptionService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Transcribe an audio file using OpenAI Whisper API
   * Automatically splits files larger than 25MB and stitches transcripts together
   * Supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
   */
  async transcribeAudio(audioFilePath: string): Promise<string> {
    // Check file size (Whisper has a 25MB limit)
    const stats = statSync(audioFilePath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > 25) {
      console.log(`File is ${fileSizeMB.toFixed(2)}MB. Auto-splitting into chunks...`);
      return await this.transcribeLargeFile(audioFilePath, fileSizeMB);
    }

    // File is small enough, transcribe directly
    return await this.transcribeSingleFile(audioFilePath);
  }

  /**
   * Transcribe a single audio file with retry logic
   */
  private async transcribeSingleFile(audioFilePath: string, maxRetries: number = 3): Promise<string> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const audioFile = createReadStream(audioFilePath);

        const transcription = await this.openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          response_format: 'verbose_json',
          language: 'en',
        });

        return transcription.text;
      } catch (error) {
        lastError = error as Error;
        console.error(`Transcription attempt ${attempt}/${maxRetries} failed:`, error);

        // If it's a connection error and we have retries left, wait and try again
        if (attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          console.log(`Waiting ${waitTime / 1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw new Error(`Failed to transcribe after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Split large audio file and transcribe each chunk
   */
  private async transcribeLargeFile(audioFilePath: string, fileSizeMB: number): Promise<string> {
    const dir = dirname(audioFilePath);
    const baseName = basename(audioFilePath, '.webm');
    const chunksDir = join(dir, `${baseName}_chunks`);

    // Create chunks directory
    if (!existsSync(chunksDir)) {
      mkdirSync(chunksDir, { recursive: true });
    }

    try {
      // Calculate chunk duration to keep each under 20MB (safe margin)
      // Estimate: 1 minute of webm ≈ 1MB, so aim for ~15 min chunks
      const chunkDurationMinutes = 15;

      console.log(`Splitting file into ${chunkDurationMinutes}-minute chunks...`);

      // Use ffmpeg to split the audio file
      const chunkPattern = join(chunksDir, `chunk_%03d.webm`);
      await execAsync(
        `ffmpeg -i "${audioFilePath}" -f segment -segment_time ${chunkDurationMinutes * 60} -c copy "${chunkPattern}"`
      );

      // Get list of chunk files
      const { stdout } = await execAsync(`ls "${chunksDir}"/chunk_*.webm`);
      const chunkFiles = stdout.trim().split('\n').filter(f => f);

      console.log(`Created ${chunkFiles.length} chunks. Transcribing each...`);

      // Transcribe each chunk
      const transcripts: string[] = [];
      for (let i = 0; i < chunkFiles.length; i++) {
        const chunkFile = chunkFiles[i];
        console.log(`Transcribing chunk ${i + 1}/${chunkFiles.length}...`);

        const chunkTranscript = await this.transcribeSingleFile(chunkFile);
        transcripts.push(chunkTranscript);
      }

      // Stitch transcripts together
      const fullTranscript = transcripts.join(' ');

      // Clean up chunk files
      console.log('Cleaning up temporary chunk files...');
      for (const chunkFile of chunkFiles) {
        unlinkSync(chunkFile);
      }

      // Try to remove chunks directory (will only work if empty)
      try {
        await execAsync(`rmdir "${chunksDir}"`);
      } catch (e) {
        // Ignore if directory not empty
      }

      return fullTranscript;

    } catch (error) {
      console.error('Error splitting/transcribing large file:', error);
      throw new Error(`Failed to process large audio file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if a file is an audio file based on extension
   */
  static isAudioFile(filePath: string): boolean {
    const audioExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
    return audioExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
  }
}

// Factory function to create client from environment
export function createTranscriptionService(): TranscriptionService {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not found in environment');
  }

  return new TranscriptionService(apiKey);
}
