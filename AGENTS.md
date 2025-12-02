# Repository Guidelines

## Project Structure & Module Organization
Code lives in `packages/*-sdk`, each with `src/`, `dist/`, and `tsconfig.*` files so React, React Native, and Node artifacts release independently. `packages/react-sdk` contains web UI and SCSS, `packages/react-native-sdk` mirrors it with native markdown utilities, and `packages/node-sdk` exposes Stream Chat storage helpers for the Vercel AI SDK. Example apps (`examples/nextjs-ai-chatbot`, `examples/react-example`) provide validation and should follow API changes.

## Architecture & Component Highlights
Key React components include `AIMarkdown`, `StreamingMessage`, and `AIMessageComposer`; `AIMarkdown` maps code blocks to `toolComponents` like `chartjs` for charts. Web and mobile share `@stream-io/state-store`, while RN swaps markdown + charts for `@khanacademy/simple-markdown` and `victory-native`. Node SDK’s `StreamStorage` converts Vercel AI SDK transcripts into Stream Chat channels via helpers like `ai-sdk-helpers.ts`.

## Build, Test, and Development Commands
- `pnpm install` — install workspace deps from `pnpm-lock.yaml`.
- `pnpm packages:build:all` / `pnpm examples:build:all` — rebuild SDKs (Vite, `tsc`, Sass, bob) or demos.
- `pnpm --filter @stream-io/chat-react-ai dev` — watch-build the React SDK; `pnpm --filter ./packages/react-native-sdk start` and `pnpm --filter ./packages/node-sdk dev` serve RN/Node watch modes.
- `pnpm packages:test:all` or `pnpm --filter ./packages/react-sdk exec vitest run` — run Vitest across the repo or inside one package.
- `pnpm lint:all` / `pnpm prettier:fix-all` — enforce lint and format rules before pushing.

## Coding Style & Naming Conventions
TypeScript is mandatory with strict root settings (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`). Prettier (two-space indent, single quotes) and ESLint guardrails (`eqeqeq`, sorted imports, `@typescript-eslint/consistent-type-imports`, Hooks rules) must pass before committing. Name components in PascalCase (`StreamingMessage.tsx`), prefix hooks with `use`, keep barrel exports in each `index.ts`, and model shared contracts in `types.ts`.

## Testing Guidelines
Vitest powers all suites. Place specs under `src/__tests__` with the `.test.ts` suffix and mirror the production folder layout. Exercise new branches (charting, composer state, storage conversions). Use `pnpm --filter ./packages/react-native-sdk exec vitest run` or package-specific commands before opening a PR.

## Commit & Pull Request Guidelines
Follow `feat(scope): summary (#PR)` like the existing history, keep commits scoped, and add a Changeset when a package surface changes. Pull requests need a problem statement, solution summary, proof of testing (logs or screenshots), and links to relevant issues/Linear tickets. UI-focused PRs should attach before/after visuals.

## Security & Publishing Tips
Keep `"private": true` in each `package.json` until release day, store credentials in ignored `.env.local` files, and scrub secrets from `examples/*` before pushing. Run `pnpm ci:publish` only after confirming demos leak no tokens and sensitive assets load from secure URLs.
