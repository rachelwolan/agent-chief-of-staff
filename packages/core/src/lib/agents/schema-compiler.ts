import { Script } from 'vm';
import { createRequire } from 'module';
import * as ts from 'typescript';
import type { ZodTypeAny } from 'zod';
import { SchemaSource } from './types.js';

const require = createRequire(import.meta.url);

export interface SchemaCompilationResult {
  schema: ZodTypeAny;
  warnings: string[];
}

export function compileZodSchema(
  source: SchemaSource | undefined,
  exportName: string
): SchemaCompilationResult | null {
  if (!source?.code) {
    return null;
  }

  try {
    const transpiled = ts.transpileModule(source.code, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2021,
        esModuleInterop: true,
        strict: false
      }
    });

    const script = new Script(transpiled.outputText, { filename: `${exportName}-schema.js` });

    const sandbox: Record<string, unknown> = {
      exports: {},
      module: { exports: {} },
      require,
      __dirname: process.cwd(),
      __filename: `${exportName}-schema.js`
    };

    script.runInNewContext(sandbox);

    const exported =
      (sandbox.module as { exports: Record<string, unknown> }).exports[exportName] ??
      (sandbox.exports as Record<string, unknown>)[exportName];

    if (!exported || typeof exported !== 'object' || !('safeParse' in exported)) {
      return null;
    }

    const warnings = (transpiled.diagnostics ?? [])
      .map(diag => formatDiagnostic(diag))
      .filter((msg): msg is string => Boolean(msg));

    return {
      schema: exported as ZodTypeAny,
      warnings
    };
  } catch (error) {
    console.warn(`⚠️  Failed to compile ${exportName}:`, (error as Error).message);
    return null;
  }
}

function formatDiagnostic(diagnostic: ts.Diagnostic): string | undefined {
  if (!diagnostic.messageText) {
    return undefined;
  }

  if (typeof diagnostic.messageText === 'string') {
    return diagnostic.messageText;
  }

  return diagnostic.messageText.messageText;
}
