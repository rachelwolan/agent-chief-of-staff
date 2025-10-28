import Anthropic from '@anthropic-ai/sdk';

export type MessageParam = Anthropic.MessageParam;
export type Message = Anthropic.Message;

export interface AnthropicClientOptions {
  apiKey: string;
  defaultModel?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface MessageRequest {
  model?: string;
  messages: MessageParam[];
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export class AnthropicClient {
  private readonly anthropic: Anthropic;
  private readonly defaults: Required<Omit<AnthropicClientOptions, 'apiKey'>>;

  constructor(options: AnthropicClientOptions) {
    if (!options.apiKey) {
      throw new Error('Anthropic API key is required to create a client');
    }

    this.anthropic = new Anthropic({ apiKey: options.apiKey });
    this.defaults = {
      defaultModel: options.defaultModel ?? 'claude-3-5-sonnet-20241022',
      maxTokens: options.maxTokens ?? 4000,
      temperature: options.temperature ?? 0.5,
      systemPrompt: options.systemPrompt ?? ''
    };
  }

  async createMessage(request: MessageRequest): Promise<Message> {
    const systemPrompt = request.systemPrompt ?? this.defaults.systemPrompt;

    return this.anthropic.messages.create({
      model: request.model ?? this.defaults.defaultModel,
      max_tokens: request.maxTokens ?? this.defaults.maxTokens,
      temperature: request.temperature ?? this.defaults.temperature,
      system: systemPrompt && systemPrompt.length > 0 ? systemPrompt : undefined,
      messages: request.messages
    });
  }

  extractText(response: Message): string {
    const parts: string[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        parts.push(block.text);
      }
    }

    return parts.join('\n').trim();
  }
}
