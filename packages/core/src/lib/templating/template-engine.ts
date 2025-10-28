import Handlebars from 'handlebars';

type TemplateCacheKey = string;

export class TemplateEngine {
  private readonly handlebars = Handlebars.create();
  private readonly cache = new Map<TemplateCacheKey, Handlebars.TemplateDelegate>();

  constructor() {
    this.registerBuiltInHelpers();
  }

  render(template: string, data: unknown): string {
    if (!template.trim()) {
      return '';
    }

    const compiled = this.getCompiledTemplate(template);
    const context = prepareTemplateContext(data);

    return compiled(context);
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getCompiledTemplate(template: string): Handlebars.TemplateDelegate {
    const key = template;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const compiled = this.handlebars.compile(template, { noEscape: true });
    this.cache.set(key, compiled);
    return compiled;
  }

  private registerBuiltInHelpers(): void {
    this.handlebars.registerHelper('json', (value: unknown) =>
      JSON.stringify(value, null, 2)
    );

    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
    this.handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b);
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    this.handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
    this.handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    this.handlebars.registerHelper('lte', (a: number, b: number) => a <= b);
    this.handlebars.registerHelper('and', (...args: unknown[]) =>
      args.slice(0, -1).every(Boolean)
    );
    this.handlebars.registerHelper('or', (...args: unknown[]) =>
      args.slice(0, -1).some(Boolean)
    );
    this.handlebars.registerHelper('not', (value: unknown) => !value);
  }
}

function prepareTemplateContext<T>(data: T): T {
  return wrapValue(data) as T;
}

function wrapValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const wrapped = value.map(wrapValue) as unknown as unknown[];
    attachToString(wrapped, value);
    return wrapped;
  }

  if (value && typeof value === 'object') {
    const wrapped: Record<string | symbol, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      wrapped[key] = wrapValue(val);
    }
    attachToString(wrapped, value);
    return wrapped;
  }

  return value;
}

function attachToString(target: object, source: unknown): void {
  if (Object.prototype.hasOwnProperty.call(target, 'toString')) {
    return;
  }

  Object.defineProperty(target, 'toString', {
    enumerable: false,
    configurable: true,
    value: () => JSON.stringify(source, null, 2)
  });
}
