# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for Stream.io's AI component SDKs across multiple platforms (React, React Native, and Node.js). The project provides UI components and utilities for building AI chat interfaces with streaming messages, markdown rendering with syntax highlighting, charts/graphs, and message composition with file attachments.

## Monorepo Structure

This is a pnpm workspace with three main packages and example applications:

- `packages/react-sdk` - React web components for AI chat interfaces
- `packages/react-native-sdk` - React Native components for mobile AI chat
- `packages/node-sdk` - Node.js storage connector using Stream Chat infrastructure (integrates with Vercel AI SDK)
- `examples/react-example` - Web example application
- `examples/nextjs-ai-chatbot` - Next.js chatbot example

## Common Commands

### Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm packages:build:all

# Build all examples
pnpm examples:build:all

# Test all packages
pnpm packages:test:all

# Lint everything
pnpm lint:all

# Format code
pnpm prettier:fix-all
```

### Package-Specific Development

Navigate to the package directory for targeted work:

```bash
# React SDK
cd packages/react-sdk
pnpm build         # Build JS + types + styles
pnpm dev           # Watch mode for development
pnpm build:styles  # Compile SCSS to CSS

# React Native SDK
cd packages/react-native-sdk
pnpm build         # Build with react-native-builder-bob
pnpm start         # TypeScript watch mode
pnpm test          # Run tests with vitest

# Node SDK
cd packages/node-sdk
pnpm build         # Compile TypeScript
pnpm dev           # TypeScript watch mode
```

### Publishing

This repo uses Changesets for version management:

```bash
# Create a changeset (do this when making user-facing changes)
pnpm changeset

# Publish packages (automated via CI)
pnpm ci:publish
```

## Architecture Notes

### React SDK (`packages/react-sdk`)

**Main Components:**
- `AIMarkdown` - Markdown renderer with GFM support, syntax highlighting (Prism), and extensible tool components
- `StreamingMessage` - Typewriter-style text streaming with configurable speed
- `AIMessageComposer` - Message input with file attachments, speech-to-text, and state management via `@stream-io/state-store`

**Tool Component System:**
The `AIMarkdown` component supports custom "tool" renderers via the `toolComponents` prop. Tools are registered by language identifier (e.g., `chartjs`) and can render custom visualizations within markdown code blocks. Built-in tools include Chart.js integration via `SuspendedChart`.

**Build System:**
- Uses Vite for bundling (dual format: ESM + CJS)
- TypeScript for type definitions
- SCSS compiled to CSS (distributed as separate files in `dist/styles/`)
- Exports: main entry + `/stream` subpath + `/styles/*` for CSS

### React Native SDK (`packages/react-native-sdk`)

**Key Differences from React SDK:**
- Uses `@khanacademy/simple-markdown` instead of `react-markdown` for markdown parsing
- Charts powered by `victory-native` (React Native/Skia-based)
- Built with `react-native-builder-bob` (CommonJS + ESM + TypeScript)
- Custom markdown components in `src/markdown/`

**Native Components:**
- `MarkdownReactiveScrollView` - Performance-optimized markdown scrolling
- `PerfText` - Text rendering optimization
- Syntax highlighting via `react-syntax-highlighter` (shared with web)

### Node SDK (`packages/node-sdk`)

**Purpose:**
Storage adapter that bridges Vercel AI SDK with Stream Chat backend. Enables persisting AI conversations using Stream's infrastructure.

**Core Classes:**
- `StreamStorage` - Main class for channel/message management
- `ai-sdk-helpers.ts` - Utilities for converting between AI SDK message format and Stream Chat format
- Supports streaming responses from AI SDK back to Stream Chat

### Shared Patterns

**State Management:**
Both React and React Native SDKs use `@stream-io/state-store` for component state (e.g., message composer state).

**Markdown Rendering:**
- Web: `react-markdown` + `remark-gfm`
- Mobile: `@khanacademy/simple-markdown` (custom port)
- Both: `react-syntax-highlighter` for code blocks

**Styling:**
- React SDK: SCSS files compiled to CSS, consumers import from `@stream-io/ai-chat-react/styles/*`
- React Native: StyleSheet-based, no external styles

## TypeScript Configuration

The monorepo uses a shared `tsconfig.root.json` with strict settings:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitOverride: true`
- `verbatimModuleSyntax: true`

Individual packages extend this config.

## Testing

Tests use Vitest (configured via `pnpm-workspace.yaml` catalog). Run tests from package directories or use `pnpm packages:test:all`.

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on PRs:
1. Install dependencies with pnpm
2. Run `pnpm packages:test:all`

Changesets workflow handles automated publishing.
