import type { ZodTypeAny } from 'zod';

export interface SchemaSource {
  language?: string;
  code: string;
}

export interface CompiledSchemas {
  input?: ZodTypeAny;
  output?: ZodTypeAny;
}

export interface AgentSpec {
  name: string;
  sourcePath: string;
  frontMatter: Record<string, unknown>;
  metadata: Record<string, unknown>;
  sections: Record<string, string>;
  promptTemplate: string;
  jobStatement?: string;
  overview?: string;
  capabilities?: string[];
  inputSchema?: SchemaSource;
  outputSchema?: SchemaSource;
}

export interface AgentSpecWithSchemas extends AgentSpec {
  schemas: CompiledSchemas;
}
