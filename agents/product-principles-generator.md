# Product Principles Generator

## Job Description
Analyzes a collection of Product Requirement Documents (PRDs) to retroactively extract and synthesize product principles. Identifies patterns in decision-making, prioritization, user focus, and design philosophy across multiple PRDs.

## Schedule
On-demand

## Input Schema
```json
{
  "prds": "array of PRD objects with title, content, url, date",
  "context": "string (optional) - additional context about the company/product"
}
```

## Output Schema
```json
{
  "principles": [
    {
      "title": "string - principle name",
      "description": "string - what this principle means",
      "rationale": "string - why this principle emerged from the PRDs",
      "examples": ["array of specific examples from PRDs"],
      "frequency": "string - how often this principle appeared (high/medium/low)"
    }
  ],
  "themes": [
    {
      "theme": "string - overarching theme",
      "principles": ["array of principle titles related to this theme"]
    }
  ],
  "summary": "string - executive summary of the product philosophy",
  "metadata": {
    "totalPRDs": "number",
    "dateRange": "string",
    "confidenceLevel": "string (high/medium/low)"
  }
}
```

## Prompt Template
```
You are analyzing a collection of Product Requirement Documents (PRDs) from Webflow to retroactively identify the product principles that guide their decision-making.

CONTEXT:
- Company: Webflow (visual web design and development platform)
- Role: CPO (Chief Product Officer)
- Goal: Extract implicit product principles from past PRDs

TASK:
Analyze the provided PRDs and identify 8-12 product principles that consistently appear across them. Look for:

1. **User-Centric Patterns**: How do they think about users? What user needs are prioritized?
2. **Decision-Making Criteria**: What factors drive "yes" vs "no" decisions?
3. **Quality Standards**: What level of polish, performance, or completeness is required?
4. **Technical Philosophy**: How do they balance innovation vs stability, flexibility vs simplicity?
5. **Business Alignment**: How do they balance user value vs business value?
6. **Design Philosophy**: What design values consistently appear (simplicity, power, flexibility)?
7. **Prioritization Framework**: What gets prioritized and why?
8. **Scope Approach**: How do they scope features (MVP vs complete, iterative vs big bang)?

For each principle:
- Give it a clear, memorable name (2-5 words)
- Describe what it means in practice (2-3 sentences)
- Explain the evidence from PRDs that led you to identify this principle
- Provide 2-3 specific examples from the PRDs
- Rate how frequently this principle appeared (high/medium/low)

Group principles into themes (e.g., "User Experience", "Technical Excellence", "Business Strategy").

Provide an executive summary (3-4 sentences) that captures the overall product philosophy.

Rate your confidence level:
- HIGH: Principle appeared explicitly or implicitly in 50%+ of PRDs
- MEDIUM: Principle appeared in 25-50% of PRDs
- LOW: Principle appeared in <25% of PRDs but seems significant

IMPORTANT:
- Focus on IMPLICIT principles (what they do) not just explicit statements
- Look for patterns across multiple PRDs, not one-offs
- Distinguish between aspirational statements and actual practice
- Be specific - cite actual examples from PRDs
- Prioritize principles that are distinctive or non-obvious

PRDs TO ANALYZE:
{{prdsContent}}

{{#if context}}
ADDITIONAL CONTEXT:
{{context}}
{{/if}}

Format your response as JSON matching the output schema.
```

## Configuration
Model: claude-sonnet-4-20250514
Max tokens: 16000

## Notes
- Requires collection of PRDs as input
- Best with 10+ PRDs for pattern recognition
- Can be combined with Slack channel analysis to fetch PRDs
- Output saved to `/docs/personal/product-principles.md` by default
