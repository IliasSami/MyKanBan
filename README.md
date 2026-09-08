# 🚀 MyKanBan — Ultra-Fast Collaborative Scrum Kanban

A desktop-grade, lightning-fast collaborative Kanban Board App built with **React (Vite) + Tailwind CSS + @dnd-kit**, engineered for internal team workflows and free hosting on **Cloudflare Pages**.

---

## 🌟 Key Features

1. **Structured Ingestion Engine (Markdown & CSV to Kanban)**
   - **Markdown Parsing:** Automatically transforms Markdown files into visual Scrum boards:
     - `# Column Name` or `## Column Name` creates lanes.
     - `- [ ] Task Name` creates draggable task cards.
     - Supports inline tags: `@assignee`, `#priority` (`#urgent`, `#high`, `#medium`, `#low`), and `~points` (`~3`, `(5pts)`, `5sp`).
     - Nested bullet points become interactive subtasks/checklists.
   - **CSV Ingestion:** Auto-maps columns (`Title, Column, Assignee, Priority, Story Points, Tags, Description`) via PapaParse.
   - **Live Parser Preview:** See parsed lanes, task counts, and story points before importing.
   - **1-Click Export:** Download your active board as structured Markdown (`.md`) or CSV (`.csv`) for Git versioning.

2. **Scrum & Velocity Metrics**
   - **Sprint Velocity Tracker:** Real-time story point completion progress bar.
   - **WIP Limits:** Highlight columns when tasks exceed configured Work-In-Progress limits.
   - **Sprint Completion Celebration:** Confetti fireworks trigger when a sprint reaches 100% completion!

3. **Multi-User Collaboration & Collab Codes**
   - **Instant Share Codes:** Every board generates a unique 6-character room code (e.g. `KAN-842`).
   - **Zero-Friction Joining:** Teammates enter the Collab Code in the Collab modal to instantly connect.
   - **Live Synchronized State:** Built-in multi-tab/window real-time synchronization out of the box (`BroadcastChannel`), plus plug-and-play **Convex** backend support.

4. **Zero-Hydration Lag Performance**
   - Pure client-side React SPA with Vite — no Next.js SSR overhead, providing butter-smooth 60fps drag-and-drop animations.

---

## 🛠 Tech Stack

- **Frontend:** React 18/19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Drag and Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Parsers:** Custom Markdown AST & regex parser, `papaparse` for CSV
- **Backend / Realtime:** Reactive Store + `BroadcastChannel` (local multi-window sync) + Convex Cloud backend (`convex/schema.ts`)
- **Hosting:** Cloudflare Pages (`public/_redirects` included for client-side SPA routing)

---

## 🚀 Getting Started Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in two different browser windows to test instant real-time drag-and-drop synchronization.

3. **Build for production:**
   ```bash
   npm run build
   ```
   Compiles into `dist/` in ~200ms.

---

## ☁️ Deploying to Cloudflare Pages (100% Free)

### Option 1: Git Integration (Recommended)
1. Push this repository to GitHub or GitLab.
2. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Set the build settings:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Click **Save and Deploy**. Your Kanban board will be globally deployed on Cloudflare's edge CDN with free unlimited bandwidth and zero cold starts!

### Option 2: Direct CLI Deployment
```bash
npx wrangler pages deploy dist --project-name=mykanban
```

---

## ⚡ Connecting Convex Cloud (Optional for Remote Multi-Device Sync)

The app already syncs across local tabs and windows in real-time. To enable persistent cloud database synchronization across different physical computers:

1. Initialize Convex:
   ```bash
   npx convex dev
   ```
2. Follow the prompt to create a free Convex project.
3. Add `VITE_CONVEX_URL` to your `.env` or Cloudflare Pages environment variables.

---

## 📝 Markdown Ingestion Syntax Guide

You can paste or upload Markdown files using this simple syntax:

```markdown
# Sprint 25: Platform Core

## Backlog
- [ ] Research WebAssembly pipelines @Alex #high ~5
- [ ] User permissions role architecture #medium ~3

## Sprint To-Do
- [ ] Cloudflare D1 migrations @David #high ~5
- [ ] Mobile responsive touch layout @Sarah #urgent ~3
  - Include ghost placeholder
  - Test on iOS Safari

## In Progress
- [ ] Ingest structured Markdown files @Alex #urgent ~5
  > Supports @assignee, #priority, and ~storypoints.
  - [x] Header parser
  - [ ] Live preview modal

## Done
- [x] Scaffolding React Vite + Tailwind #medium ~2
```
