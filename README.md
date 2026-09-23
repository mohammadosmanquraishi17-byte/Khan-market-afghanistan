# Khan Market Afghanistan AI Core

This repository was initially empty except for a root `.gitignore`. To satisfy the work item and preserve the existing project scope, we established the AI foundation directly inside the existing repository instead of creating a duplicate project.

## Repository audit summary

- Repository: `mohammadosmanquraishi17-byte/Khan-market-afghanistan`
- Initial state: empty project scaffold with only `.gitignore`
- Existing architecture: none detected; no package manifests, backend, frontend, DB schema, or AI service existed
- Decision: create a single central AI platform inside the existing repo, without introducing a second app

## AI architecture

The project now includes a central AI platform in `src/ai/` with:

- AI control center
- AI registry
- AI router
- provider adapters
- provider registry
- usage tracking
- security guard rails
- capability abstraction

## Provider model

Providers are represented as:

- `local-openai-compatible` (optional self-hosted)
- `openrouter`
- `gemini`
- `azure-openai`
- `mistral`
- `anthropic`

Each provider is initialized as `NOT_CONFIGURED` unless required keys are present in environment variables.

## Important policy

- Automatic paid AI spending remains disabled by default.
- No provider is marked as working without env config and verification.
- No sensitive action is allowed without normal app authorization.

## Local development

1. Copy `.env.example` to `.env`
2. Set only the providers you actually want to configure
3. Run `npm install`
4. Run `npm run build`
5. Run `npm test`

## Files added

- `src/ai/*.ts`
- `src/index.ts`
- `.env.example`
- `package.json`
- `tsconfig.json`
- `README.md`
- `tests/ai-core.test.ts`

## Current status

This is a foundational implementation. Full production verification remains blocked in the current environment because package installation, linting, TypeScript compilation, and runtime tests were not executed here.
