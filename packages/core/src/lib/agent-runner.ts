import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import type Anthropic from '@anthropic-ai/sdk';
import { AgentSpecLoader } from './agents/spec-loader.js';
import { compileZodSchema } from './agents/schema-compiler.js';
import type { AgentSpecWithSchemas } from './agents/types.js';
import { TemplateEngine } from './templating/template-engine.js';
import { AnthropicClient, MessageParam } from './clients/anthropic-client.js';

export interface TaskResult {
  agentName: string;
  input: unknown;
  rawInput: unknown;
  prompt: string;
  output: unknown;
  rawOutput: string;
  validatedOutput?: unknown;
  timestamp: string;
  duration: number;
  model: string;
  usage?: Anthropic.Usage;
  success: boolean;
  error?: string;
}

export class AgentRunner {
  private readonly client: AnthropicClient;
  private readonly specLoader: AgentSpecLoader;
  private readonly templateEngine = new TemplateEngine();
  private readonly specCache = new Map<string, AgentSpecWithSchemas>();
  private readonly logsDir: string;

  constructor(private readonly options: AgentRunnerOptions) {
    this.client = new AnthropicClient({
      apiKey: options.apiKey,
      defaultModel: options.model,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      systemPrompt: options.systemPrompt
    });
    this.specLoader = new AgentSpecLoader(options.agentsDir);
    this.logsDir = options.logsDir ?? join(process.cwd(), 'logs');
  }

  async runTask(agentName: string, input: unknown): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      const spec = await this.getSpec(agentName);
      const validatedInput = this.validateInput(spec, input);
      const promptContext = this.buildTemplateContext(validatedInput);
      const prompt = this.templateEngine.render(spec.promptTemplate, promptContext);

      const messages: MessageParam[] = [{
        role: 'user',
        content: prompt
      }];

      console.log(chalk.cyan(`🤖 Running ${spec.name} agent...`));

      const response = await this.client.createMessage({
        model: this.getMetadataString(spec, 'model') ?? this.options.model,
        maxTokens: this.getMetadataNumber(spec, 'maxTokens') ?? this.options.maxTokens,
        temperature: this.getMetadataNumber(spec, 'temperature') ?? this.options.temperature,
        systemPrompt: this.getMetadataString(spec, 'systemPrompt') ?? this.options.systemPrompt,
        messages
      });

      const rawOutput = this.client.extractText(response);
      const validatedOutput = this.validateOutput(spec, rawOutput);

      const result: TaskResult = {
        agentName,
        input: validatedInput,
        rawInput: input,
        prompt,
        output: validatedOutput ?? rawOutput,
        rawOutput,
        validatedOutput,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        model: response.model,
        usage: response.usage,
        success: true
      };

      this.saveResult(result);

      return result;

    } catch (error) {
      const result: TaskResult = {
        agentName,
        input,
        rawInput: input,
        prompt: '',
        output: null,
        rawOutput: '',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        model: this.options.model ?? '',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };

      this.saveResult(result);

      throw error;
    }
  }

  private saveResult(result: TaskResult) {
    const filename = `${result.agentName}-${Date.now()}.json`;
    const filepath = join(this.logsDir, filename);
    mkdirSync(this.logsDir, { recursive: true });
    writeFileSync(filepath, JSON.stringify(result, null, 2));

    console.log(chalk.green(`✅ Result saved to logs/${filename}`));
  }

  private async getSpec(agentName: string): Promise<AgentSpecWithSchemas> {
    if (this.specCache.has(agentName)) {
      return this.specCache.get(agentName)!;
    }

    const spec = await this.specLoader.load(agentName);
    const inputCompilation = compileZodSchema(spec.inputSchema, 'inputSchema');
    const outputCompilation = compileZodSchema(spec.outputSchema, 'outputSchema');

    if (inputCompilation?.warnings?.length) {
      inputCompilation.warnings.forEach(w =>
        console.warn(`⚠️  Input schema warning for ${agentName}: ${w}`)
      );
    }

    if (outputCompilation?.warnings?.length) {
      outputCompilation.warnings.forEach(w =>
        console.warn(`⚠️  Output schema warning for ${agentName}: ${w}`)
      );
    }

    const specWithSchemas: AgentSpecWithSchemas = {
      ...spec,
      schemas: {
        input: inputCompilation?.schema,
        output: outputCompilation?.schema
      }
    };

    this.specCache.set(agentName, specWithSchemas);
    return specWithSchemas;
  }

  private getMetadataString(spec: AgentSpecWithSchemas, key: string): string | undefined {
    const value = spec.metadata?.[key as keyof typeof spec.metadata];
    return typeof value === 'string' ? value : undefined;
  }

  private getMetadataNumber(spec: AgentSpecWithSchemas, key: string): number | undefined {
    const value = spec.metadata?.[key as keyof typeof spec.metadata];
    return typeof value === 'number' ? value : undefined;
  }

  private validateInput(spec: AgentSpecWithSchemas, input: unknown): unknown {
    const schema = spec.schemas.input;
    if (!schema) {
      return input ?? {};
    }

    const result = schema.safeParse(input);

    if (!result.success) {
      const formatted = result.error.errors
        .map(err => `${err.path.join('.') || 'input'}: ${err.message}`)
        .join('; ');

      throw new Error(`Invalid agent input: ${formatted}`);
    }

    return result.data;
  }

  private validateOutput(spec: AgentSpecWithSchemas, rawOutput: string): unknown | undefined {
    const schema = spec.schemas.output;
    if (!schema) {
      return undefined;
    }

    const parsed = this.tryParseJson(rawOutput);
    if (parsed === null) {
      console.warn(`⚠️  Expected JSON output for ${spec.name} but received plain text.`);
      return undefined;
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      const formatted = result.error.errors
        .map(err => `${err.path.join('.') || 'output'}: ${err.message}`)
        .join('; ');

      console.warn(`⚠️  Output validation failed for ${spec.name}: ${formatted}`);
      return undefined;
    }

    return result.data;
  }

  private buildTemplateContext(input: unknown): unknown {
    if (input && typeof input === 'object') {
      return input;
    }
    return { input };
  }

  private tryParseJson(raw: string): unknown | null {
    try {
      return JSON.parse(raw);
    } catch {
      const jsonBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (!jsonBlockMatch) {
        return null;
      }

      try {
        return JSON.parse(jsonBlockMatch[1]);
      } catch {
        return null;
      }
    }
  }
}

export interface AgentRunnerOptions {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  agentsDir?: string;
  logsDir?: string;
}
