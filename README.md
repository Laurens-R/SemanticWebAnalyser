# Semantic Web Analyser

A desktop application for semantically comparing two web pages side-by-side using Claude AI. Load any two URLs, extract their DOM, then ask natural-language questions to find matching components, structural differences, and semantic relationships — with one-click element highlighting in both previews.

---

## Features

- **Side-by-side browser panes** — live previews of two URLs with independent navigation
- **AI-powered semantic analysis** — powered by Claude (claude-sonnet-4-5) via the Anthropic API
- **Structured results table** — matches rendered as an interactive table with Page A / Page B labels, relationship badges (equivalent / similar / one-sided), and explanations
- **Element highlighting** — click any row to highlight the matched elements in both webviews with a visual overlay
- **Conversational chat** — ask follow-up questions in context after the initial DOM analysis; the full DOM is only submitted once
- **Element selection** — right-click any element in a preview pane and use "Find Similar" to ask the AI for the equivalent element on the other page
- **Resizable panels** — drag the centre divider to adjust pane widths; drag the left edge of the chat panel to resize it
- **Custom title bar** — frameless window with native window controls (Windows & macOS)
- **Configurable limits** — set the maximum number of matches returned and the maximum response token budget in Settings

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- An [Anthropic API key](https://console.anthropic.com/)

---

## Getting Started

```bash
# Install dependencies
npm install

# Start in development mode (hot-reload)
npm run dev
```

On first launch the Settings dialog will open automatically — paste your Anthropic API key and click **Save**.

---

## Usage

1. Enter a URL in each **Page A** / **Page B** address bar and press **Go** (or Enter)
2. Click **Load & Analyse** in the toolbar to extract both pages' DOM and load them into the AI context
3. Type a question in the chat panel, e.g. *"Find all navigation elements"* or *"Which components are semantically equivalent?"*
4. The AI returns a structured table of matches — click the highlight button on any row to highlight those elements in both previews
5. Continue the conversation with follow-up questions — context is retained across turns

---

## Settings

Open Settings via the gear icon in the toolbar.

| Setting | Description | Default |
|---|---|---|
| **API Key** | Your Anthropic API key (`sk-ant-…`) | — |
| **Max matches** | Maximum number of matches the AI returns per analysis (1–50) | `12` |
| **Max response tokens** | Token budget for the AI response (256–16384) | `4096` |

Settings are persisted in `localStorage`.

---

## Building for Distribution

```bash
npm run build:win     # Windows (.exe / NSIS installer)
npm run build:mac     # macOS (.dmg)
npm run build:linux   # Linux (AppImage)
```

Output is written to the `dist/` directory.

---

## Project Structure

```
electron/
  main.ts          # Electron main process, BrowserWindow, IPC handlers
  preload.ts       # Context bridge — exposes electronAPI to renderer

src/
  App.tsx          # Root component, layout, drag-resize logic
  components/
    Toolbar/       # App header, window controls, action buttons
    UrlBar/        # URL input + navigation for each page pane
    PageColumn/    # Wrapper for a single page pane (URL bar + webview)
    PreviewPane/   # <webview> element with DOM extraction helpers
    ChatPanel/     # Chat UI, message list, AnalysisResultTable
    SettingsPanel/ # API key + analysis limit settings modal
    shared/        # Button, Badge, Tooltip, TextInput primitives
  hooks/
    usePageContext.ts   # Per-pane URL / title / DOM state + highlight helpers
    useAnalysis.ts      # Chat state, Anthropic service lifecycle
  services/
    anthropicService.ts # Claude API client, prompt construction, JSON parsing
    domExtractor.ts     # DOM extraction + element highlight scripts for webviews
  styles/
    global.scss    # Design tokens (CSS custom properties), reset, layout
  types/
    index.ts       # Shared TypeScript interfaces
```

---

## Token Efficiency

The DOM is submitted **once** on the first question. Subsequent questions only append the new user message and assistant reply — the full DOM is never re-sent. This keeps costs low for long sessions.

The DOM extractor also compresses HTML before submission:
- Strips `<script>` and `<style>` tags
- Collapses whitespace
- Limits tree depth to 12 levels
- Hard-caps at 80,000 characters per page

---

## Tech Stack

| Layer | Technology |
|---|---|
| Shell | Electron 35 |
| Build | electron-vite 3 + Vite 6 |
| UI | React 19 + TypeScript 6 |
| Styling | SCSS (Sass) |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) |

---

## License

ISC — see [LICENSE](LICENSE).

