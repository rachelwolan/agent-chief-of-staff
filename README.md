# Chief of Staff Agent

An async, spec-driven AI agent system that acts as a chief of staff for product leadership tasks.

## Overview

This project provides an intelligent agent that can handle various chief of staff responsibilities asynchronously, including:
- Task management and delegation
- Information gathering and synthesis
- Document creation and review
- Strategic analysis and recommendations

## Tech Stack

- **Runtime**: Cloudflare Workers with Durable Objects
- **AI**: Anthropic Claude API
- **Language**: TypeScript
- **Queue**: Cloudflare Queues for async processing
- **Storage**: Cloudflare KV/D1 for persistence
- **Validation**: Zod for spec-driven development

## Getting Started

```bash
npm install
npm run dev
```

## Architecture

The system uses spec-driven development where each task type is defined as a schema, enabling:
- Type-safe task definitions
- Predictable agent behavior
- Easy extensibility
- Clear documentation of capabilities

## Usage

Submit tasks via the API or UI, and receive async notifications when complete.