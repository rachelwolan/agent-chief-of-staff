import OpenAI from 'openai';
import { createReadStream, statSync } from 'fs';
import { basename } from 'path';

export class TranscriptionService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Transcribe an audio file using OpenAI Whisper API
   * Supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
   */
  async transcribeAudio(audioFilePath: string): Promise<string> {
    // Check file size (Whisper has a 25MB limit)
    const stats = statSync(audioFilePath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > 25) {
      throw new Error(`Audio file is ${fileSizeMB.toFixed(2)}MB. Whisper API has a 25MB limit. Please split the file or compress it.`);
    }

    const audioFile = createReadStream(audioFilePath);
    const fileName = basename(audioFilePath);

    const transcription = await this.openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json', // Get timestamps and other metadata
      language: 'en', // Assuming English meetings
    });

    return transcription.text;
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
