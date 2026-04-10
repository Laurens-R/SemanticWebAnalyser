# Semantic Web Analyser

An Electron + React + TypeScript app for comparing two web pages semantically using Claude AI.

## Features

- **Dual preview panes** — load any two URLs side-by-side
- **DOM extraction** — extracts a compact, semantic DOM representation from both pages (strips scripts/styles, caps depth)
- **AI analysis** — submits DOM context once, then lets you ask free-form questions without re-sending the DOM every turn
- **Element selection** — right-click any element in a preview pane; use "Find Similar" to ask the AI what the equivalent element is on the other page
- **Chat panel** — persistent conversation with Claude Sonnet

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts the Vite dev server. To run the full Electron app, first build and then start:

```bash
npm run build
npm start
```

### Build for distribution

```bash
npm run build
```

Output is in `dist/` (renderer) and `dist-electron/` (main process).

## Architecture

```
src/
├── components/
│   ├── shared/          # Reusable UI primitives (Button, TextInput, Badge, Tooltip)
│   ├── ChatPanel/       # Chat UI + message rendering
│   ├── PageColumn/      # URL bar + preview pane wrapper per page
│   ├── PreviewPane/     # Electron webview with DOM extraction + context menu injection
│   ├── SettingsPanel/   # API key configuration modal
│   ├── Toolbar/         # App header with actions
│   └── UrlBar/          # URL input per pane
├── hooks/
│   ├── useAnalysis.ts   # Manages AI conversation state
│   └── usePageContext.ts # Per-pane page state and DOM extraction
├── services/
│   ├── anthropicService.ts  # Claude API client, token-efficient context management
│   └── domExtractor.ts      # Injects extraction script into webview
├── styles/
│   └── global.scss      # Design tokens + global styles
└── types/
    └── index.ts         # Shared TypeScript types

electron/
├── main.ts     # Electron main process
└── preload.ts  # Context bridge
```

## Token Efficiency Strategy

The DOM is submitted **once** on the first question. Subsequent questions only add the user message + assistant reply to the conversation history — the full DOM is never re-sent. This keeps token usage low for long sessions.

The DOM extractor also compresses the HTML before submission:
- Strips `<script>` and `<style>` tags
- Collapses whitespace
- Limits tree depth to 12
- Caps class names at 5 per element
- Hard-caps at 80,000 characters per page

## Settings

Click the gear icon (⚙) in the toolbar to enter your Anthropic API key. The key is stored in `localStorage`.
