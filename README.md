<div align="center">

# 🚀 MyKanBan

**The Ultra-Fast, Open-Source Collaborative Agile Scrum Kanban Engine**  
*Native Markdown (.md) & CSV Ingestion • Guided AI ChatBot Preformatter • 3D Tactile UI • Real-Time Sync*

**Built from scratch for the community by [Ilias Sami](https://iliassami.com)**  
*100% Free & Open-Source Forever*

[![Live Demo](https://img.shields.io/badge/Live_Demo-mykanban.pages.dev-2563eb?style=for-the-badge&logo=cloudflare&logoColor=white)](https://mykanban.pages.dev)
[![Creator: Ilias Sami](https://img.shields.io/badge/Creator-Ilias_Sami-7c3aed?style=for-the-badge&logo=googlechrome&logoColor=white)](https://iliassami.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.2-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.3-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudflare Pages](https://img.shields.io/badge/Hosted_on-Cloudflare_Pages-f38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](https://github.com/IliasSami/MyKanBan/pulls)

[**Explore Live Demo**](https://mykanban.pages.dev) • [**Creator's Website**](https://iliassami.com) • [**Read Documentation**](https://github.com/IliasSami/MyKanBan#readme) • [**Report an Issue**](https://github.com/IliasSami/MyKanBan/issues) • [**Contribute**](https://github.com/IliasSami/MyKanBan/blob/main/CONTRIBUTING.md)

</div>

---

## 📖 What is MyKanBan?

> **MyKanBan** is an open-source, desktop-grade collaborative Kanban board and Agile Scrum workflow engine designed for high-performance engineering teams, developers, and technical project managers. Built from scratch for the community by **[Ilias Sami](https://iliassami.com)** with pure **React 19, TypeScript, and Tailwind CSS**, MyKanBan runs with zero hydration lag, offers native **Markdown (`.md`) and CSV import/export**, and features a guided **AI ChatBot Preformatter** that enables users to convert messy meeting notes, SEO audits, or PRDs into structured agile workflows using **Claude, ChatGPT, Gemini, or DeepSeek**.

Unlike heavy project management suites that trap your data behind paywalls, MyKanBan is **100% free, MIT-licensed, offline-first, and Git-friendly**, deploying effortlessly to **Cloudflare Pages** with unlimited free bandwidth.

---

## ⚡ Quick Comparison: Why MyKanBan?

| Feature | MyKanBan | Trello | Jira | Notion |
| :--- | :---: | :---: | :---: | :---: |
| **Pricing & License** | **100% Free / MIT Open Source** | Freemium ($5–$17.50/mo) | Paid tiers ($7–$15/mo) | Freemium ($10–$18/mo) |
| **Native Markdown Syntax (`.md`)** | **Full AST Parsing & Export** | Partial / Markdown only in card | Complex proprietary format | Database blocks only |
| **AI Preformatter (Claude / ChatGPT / Gemini)** | **Built-in Master Prompt Engine** | Paid Add-on (Atlassian Intelligence) | Paid Add-on | Paid Add-on ($10/mo) |
| **Hydration Latency & FPS** | **Instant 60fps Client-Side** | Medium hydration lag | High latency & bloat | Heavy document overhead |
| **Offline-First & Git-Friendly** | **1-Click `.md` & `.csv` Sync** | No native file sync | No Git sync | Manual export only |
| **Real-Time Multi-Window Sync** | **Zero-Config BroadcastChannel** | Requires Internet connection | Requires Cloud server | Requires Cloud server |
| **Hosting Cost** | **$0 / Cloudflare Pages Free** | Hosted by Atlassian | Hosted by Atlassian | Hosted by Notion |

---

## 🌟 Key Architecture & Capabilities

### 1. 📝 Native Markdown & CSV Ingestion Engine
MyKanBan treats your Markdown files as first-class citizens:
- **Columns / Stages**: Level 2 headings (`## Backlog`, `## Sprint To-Do`, `## In Progress`, `## Review / QA`, `## Done`) dynamically generate workflow columns.
- **Task Cards**: Checkbox bullet syntax (`- [ ] Task Title`) automatically creates draggable, interactive cards.
- **Smart Metadata Extraction**:
  - **Roles / Assignees**: Inferred via `@Role` (e.g. `@Dev`, `@SEO`, `@Content`, `@DevOps`, `@QA`, `@Copy`, `@Design`).
  - **Priority Tokens**: `#urgent`, `#high`, `#medium`, `#low` with distinct semantic color badges.
  - **Story Points**: Inferred Fibonacci estimates prefixed with `~` (e.g. `~1`, `~2`, `~3`, `~5`, `~8`).
  - **Hashtags**: Inferred categorization tags (e.g. `#seo`, `#security`, `#performance`, `#hubspot`).
  - **Context Blockquotes (`> `)**: Contextual metrics, rationales, and background descriptions.
  - **Subtasks (`  - [ ] `)**: Indented bullet points convert into interactive checklist subtasks.
- **CSV Support**: Ingest raw spreadsheet exports with automatic column mapping via `papaparse`.

---

### 2. 🤖 Guided AI ChatBot Preformatter (Claude · ChatGPT · Gemini)
Turn messy meeting transcripts, architecture notes, or technical audits into gold-standard Kanban boards:
1. **Step 1: Input Document**: Paste or drop your raw audit report, meeting notes, or PRD.
2. **Step 2: Copy Master Prompt & Launch AI**:
   - 1-Click copy the engineered master prompt (with your document pre-attached).
   - Quick launch directly into **Claude** (Anthropic), **ChatGPT** (OpenAI), **Gemini** (Google), or **DeepSeek**.
3. **Step 3: Paste & Verify**: Paste the AI response into the live validator to inspect detected stages, task counts, and story points, then click **"Import Structured Board"** to load everything in 1 click!

---

### 3. 🏃‍♂️ Scrum Velocity & Sprint Analytics
- **Live Velocity Progress Bar**: Displays completed story points vs. total sprint commitment in real-time.
- **Work-In-Progress (WIP) Limits**: Visual warnings when columns exceed team WIP limits to prevent workflow bottlenecks.
- **Sprint Completion Confetti**: Rewarding completion fireworks powered by `canvas-confetti` when a sprint hits 100%.

---

### 4. 🤝 Real-Time Multi-User Collaboration & Room Codes
- **Instant Collab Codes**: Every board generates a lightweight 6-character room code (e.g. `KAN-842`).
- **Zero-Config Local Sync**: Uses the browser's native `BroadcastChannel` for instantaneous multi-tab and multi-window state synchronization.
- **Cloud Database Support**: Plug-and-play **Convex Cloud** integration (`convex/schema.ts`) for persistent remote cross-device collaboration.

---

### 5. 📱 Dedicated Mobile-Native UX
Designed to feel like a native mobile app (Notion / Google Keep):
- Bottom navigation with haptic micro-interactions.
- Horizontal column carousel with swipe snapping.
- Compact/comfortable density toggle.
- Full offline support on iOS Safari and Android Chrome.

---

## 📋 Gold-Standard MyKanBan Markdown Specification

The following format is natively supported by MyKanBan's AST parser:

```markdown
# OutCraft.ai Technical SEO Remediation — Sprint Workflow

> Crawl: https://www.outcraft.ai/ · Screaming Frog 19.8 · 2026-09-07 · HubSpot CMS behind Cloudflare
> Flow: P0 this week → P1 this month → P2 quarter → P3 opportunistic · Re-audit loop gates "Done"

## Backlog

- [ ] Rewrite Link Anchor Text Sitewide @Content #high ~5 #seo #links #accessibility
  > 236 outlinks have no anchor text; 108 use non-descriptive text ("click here", "learn more").
  - [ ] Audit rich-text content and CTA modules for empty anchors
  - [ ] Replace generic anchors with descriptive link labels
  - [ ] Add aria-labels to icon/CTA links

- [ ] Compress Images Over 100 KB @Content #medium ~5 #images #media #hubspot
  > 1,058 images exceed 100 KB; prefer WebP/AVIF via HubSpot Files hs-fs width params.
  - [ ] Re-export heaviest images to WebP/AVIF
  - [ ] Serve per-width variants from HubSpot Files

## Sprint To-Do

- [ ] Write Unique Title Tags @Content #high ~3 #seo #meta #hubspot
  > 57 titles exceed 60 chars; /pricing has raw URL as title; 2 duplicate pairs.
  - [ ] Add a real title to /pricing
  - [ ] Trim the automated " | Outcraft AI" suffix in the blog template

## In Progress

- [ ] Resolve Dead Knowledge Base URLs @Content #urgent ~3 #hubspot #cms #404
  > 18 URLs under /outcraft-ai-knowledge-base/ return 404 but are still listed in sitemap.xml.
  - [ ] Unpublish dead KB posts in CMS
  - [ ] Add 301 redirects to live equivalents

- [ ] Fix Sitewide Logo Link Protocol @Dev #urgent ~1 #security #hubspot #design
  > Global header logo links to http://outcraft.ai/ (202 insecure links; extra 301 hop on every page).
  - [ ] In Design Manager, change logo URL to https://www.outcraft.ai/
  - [ ] Add aria-label "Outcraft AI — homepage" to logo

## Review / QA

- [ ] Optimize Mobile Core Web Vitals (INP) @Dev #high ~8 #performance #analytics
  > Mobile INP 237 ms fails the 200 ms threshold; ~475 KB unused third-party JS.
  - [ ] Defer non-critical tracking scripts
  - [ ] Re-run PageSpeed Insights to verify INP < 200 ms

## Done

- [x] Crawl OutCraft.ai with Screaming Frog 19.8 @SEO #medium ~8 #screaming-frog #audit
  > JS-rendered crawl completed: 2,084 URLs inspected, 0 5xx errors.
```

---

## 🛠 Tech Stack & Architecture

- **Core Engine:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite 8.2](https://vite.dev/)
- **Styling & 3D Tactile Design:** [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Drag & Drop Physics:** [@dnd-kit/core](https://dndkit.com/), `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Data Ingestion:** Custom Markdown Parser AST + [PapaParse](https://www.papaparse.com/) for CSV
- **State & Collaboration:** Reactive Store + Native `BroadcastChannel` + Optional [Convex Cloud](https://www.convex.dev/)
- **Hosting & Edge Deployment:** [Cloudflare Pages](https://pages.cloudflare.com/) (Zero cold-starts, global CDN edge)

---

## 🚀 Quickstart & Local Development

### Prerequisites
- Node.js 18+ or Node.js 20+
- npm, pnpm, or bun

### 1. Clone the repository
```bash
git clone https://github.com/IliasSami/MyKanBan.git
cd MyKanBan
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. Open multiple tabs or windows to see instant real-time synchronization!

### 4. Run automated test suite
```bash
npm test
```

### 5. Build for production
```bash
npm run build
```

---

## ☁️ 1-Click Free Cloudflare Pages Deployment

MyKanBan is built to run 100% free on Cloudflare Pages with zero server costs:

### Via Git Integration
1. Fork or push this repository to your GitHub account.
2. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your `MyKanBan` repository.
4. Set the build configuration:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
5. Click **Save and Deploy**. Your site will be live on `*.pages.dev` with free global edge distribution and SSL!

### Via Wrangler CLI
```bash
npx wrangler pages deploy dist --project-name=mykanban
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are warmly welcomed!  
Feel free to check the [issues page](https://github.com/IliasSami/MyKanBan/issues).

1. Fork the Project (`https://github.com/IliasSami/MyKanBan/fork`)
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Creator & Community Mission

**MyKanBan** was envisioned, designed, and built completely from scratch by **[Ilias Sami](https://iliassami.com)** as a free, open-source gift for the developer, product, and agile community worldwide.

- 🌐 **Website**: [iliassami.com](https://iliassami.com)
- 🐙 **GitHub Profile**: [@IliasSami](https://github.com/IliasSami)
- 📦 **Source Repository**: [github.com/IliasSami/MyKanBan](https://github.com/IliasSami/MyKanBan)

No subscription gates, no proprietary data lock-in, and no hidden fees — built from scratch so teams everywhere can ship better software with complete data sovereignty.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.  
Free for commercial and non-commercial use by everyone.

---

<div align="center">
  <sub>Built with ❤️ from scratch for the community by <a href="https://iliassami.com"><b>Ilias Sami</b></a>. Star ⭐ this repository if you find it helpful!</sub>
</div>
