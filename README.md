# mitaa.dev

> Personal portfolio and blog of a Junior Embedded Systems Engineer & Software Developer.
> Built with Next.js, TypeScript, Tailwind CSS, and a love for clean, minimal design.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
  - [Content Management](#content-management)
  - [Blog System](#blog-system)
  - [Projects System](#projects-system)
  - [GitHub Integration](#github-integration)
  - [PCB Viewer](#pcb-viewer-schematic--pcb--3d--bom)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Build](#build)
- [Configuration](#configuration)
- [Content Guide](#content-guide)
  - [Adding a Blog Post](#adding-a-blog-post)
  - [Adding a Project](#adding-a-project)
  - [Showcasing a PCB](#showcasing-a-pcb)
- [Comments & Social](#comments--social)
- [Shop](#shop)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

**mitaa.dev** is a portfolio website showcasing projects, technical blog posts, and GitHub activity. It is designed with a minimalist aesthetic, smooth scroll animations, and a focus on readability and performance.

Content is file-based — no database, no CMS. Blog posts are **LaTeX** documents
(`.tex`), curated projects are markdown files, and GitHub data is prefetched at
build time. The site runs as a **native Next.js app on Vercel** (server rendering
+ static generation), so it keeps the speed of a mostly-static site while still
allowing dynamic routes like the RSS feed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **UI Primitives** | [animate-ui](https://animate-ui.com/) (vendored in `src/components/animate-ui/`) |
| **Animations** | [Motion](https://motion.dev/) |
| **Blog** | LaTeX via [@unified-latex](https://github.com/siefkenj/unified-latex) → [Rehype](https://github.com/rehypejs/rehype), math via [KaTeX](https://katex.org/) |
| **Markdown** | [Remark](https://remark.js.org/) — projects, bio and GitHub READMEs |
| **Syntax Highlighting** | [highlight.js](https://highlightjs.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Font** | [Inter](https://rsms.me/inter/) (Google Fonts) |
| **Hardware viewer** | [KiCanvas](https://kicanvas.org) (live schematic/PCB) + [`<model-viewer>`](https://modelviewer.dev) (3D) + [occt-import-js](https://github.com/kovacsv/occt-import-js) (STEP→GLB) + [kicad-cli](https://docs.kicad.org) (pre-rendered SVGs) |
| **Hosting** | [Vercel](https://vercel.com/) — native Next.js (SSR + static) |

---

## Features

### General
- ⚡ **Pre-rendered** — content baked in at build time for instant page loads
- 🎨 **Minimalist light theme** — clean whites, subtle grays, green accents
- 📱 **Responsive** — optimized for mobile, tablet, and desktop
- 🔤 **Inter font** — crisp, modern typography with tight tracking
- ✨ **Scroll animations** — blur and fade effects via `animate-ui` primitives
- 📊 **Scroll progress bar** — subtle indicator at the top of the viewport
- 🧭 **Sticky table of contents** — auto-highlighting active section on blog posts

### Home Page (`/`)
- Bio section with staggered fade-in paragraphs
- Latest blog posts list with date and primary tag

### Projects (`/projects`)
- Curated projects from `content/projects/*.md`
- Public GitHub repos pulled at build time (deduplicated against curated projects)
- Hardware viewer for PCB projects: **Schematic / PCB / 3D / BOM** tabs, with a
  PCB **Top / Bottom / X-ray** toggle and an auto-rotating 3D thumbnail in the list
- Category filter tabs (Embedded, Web, ML, Open Source, etc.)
- Live search by title, description, or tech stack
- Star/fork counts for GitHub-sourced projects
- Detail pages with rich markdown content, tech stack, features, and context

### Blog (`/blog`)
- Posts written in **LaTeX** — sectioning, lists, tables, listings, figures
- Math rendered server-side with **KaTeX**, including `mhchem` chemistry
- Theorem environments, callouts, abstracts, footnotes
- `\label` / `\ref` cross-references and a `thebibliography` bibliography,
  numbered continuously across chapters
- Long posts split into **one page per `\section`**, with a chapter list,
  previous/next navigation and ← → keys — only the text swaps between chapters
- Syntax-highlighted listings with language labels
- SEO-friendly metadata per post and per chapter

### GitHub Integration
- Contribution calendar heatmap (via GitHub GraphQL API)
- Public repo listing with metadata (stars, forks, language, topics)

---

## Project Structure

```
mitaa.dev/
├── content/
│   ├── blog/*.tex              # Blog posts — LaTeX documents
│   ├── projects/*.md           # Curated projects — YAML frontmatter + markdown
│   └── bio.md                  # Home page bio
├── public/
│   ├── data/                   # Pre-fetched GitHub data (git-ignored; generated at build time)
│   ├── docs/                   # PDFs: blog/ committed, <repo>/ pulled at build time
│   ├── media/                  # Gallery/video/CSV: curated/ committed, <repo>/ pulled at build time
│   ├── pcb/                    # PCB assets: demo-board/ committed, <repo>/ pulled at build time
│   └── shop/                   # Shop preview images
├── scripts/
│   ├── fetch-github-data.mjs   # Pre-build: GitHub data + PCB/doc/media assets
│   ├── convert-step-models.mjs # predev/prebuild: convert curated .step models → .glb
│   ├── step-to-glb.mjs         # STEP → GLB converter (OpenCascade / occt-import-js)
│   ├── render-kicad-images.mjs # kicad-cli → schematic/PCB SVGs + X-ray (run locally)
│   ├── recolor-glb.mjs         # Recolor soldermask/silkscreen/finish of a board GLB
│   └── blog-check.mts          # Compile a post with latexmk and compare numbering
├── templates/                  # Starting points: a blog post and a project repo
├── src/
│   ├── app/                    # Next.js App Router routes
│   │   ├── api/github-repos/   # Live repo list (revalidates every 60 s)
│   │   ├── blog/[slug]/        # layout.tsx = post chrome, page.tsx = chapter text
│   │   ├── feed.xml/           # RSS feed
│   │   ├── projects/           # Project list & detail pages
│   │   ├── shop/               # Shop and product pages
│   │   └── globals.css         # Global styles + .prose-blog
│   ├── components/
│   │   ├── animate-ui/         # Animation primitives (Blur, Fade, ScrollProgress)
│   │   ├── blog/               # Table of contents, chapter nav, progress bar
│   │   ├── pcb/                # Schematic / PCB / 3D / BOM viewer
│   │   ├── project/            # Docs, gallery, video, charts, contributions
│   │   ├── shop/               # Shop gallery
│   │   └── site/               # Footer, theme toggle, icons
│   ├── hooks/                  # Hooks used by the animation primitives
│   ├── lib/
│   │   ├── blog/               # The LaTeX pipeline (see Blog System)
│   │   ├── projects/           # Curated + GitHub-sourced projects, shared types
│   │   └── date.ts, bio.ts, pcb.ts, site.ts, utils.ts
│   ├── data/shop.ts            # Shop catalogue
│   └── types/                  # JSX types for <model-viewer> and KiCanvas elements
└── tests/                      # node --test: blog snapshots + regressions
```

## Architecture

### Content Management

All content lives in the `content/` directory as plain files, edited by hand.
There is **no database and no CMS**. This makes the site:

- **Version-controlled** — content changes are Git commits
- **Portable** — move the folder, the content moves with it
- **Fast** — content is read at build time, never fetched from a database at runtime

### Blog System

Posts are **LaTeX** documents: `content/blog/{slug}.tex`, one file per post, the
filename is the URL. Metadata lives in the preamble as macros — `\title`,
`\date`, `\excerpt`, `\tags`, and optionally `\coverimage`, `\xpost` and
`\paginate`. Reading time is computed from the word count.

At build time `src/lib/blog/` parses the file with `@unified-latex`, resolves
the semantics on the LaTeX AST — labels, captions, footnotes, theorem and
callout environments, citations — converts to HTML, and runs it through KaTeX
and highlight.js. Everything happens server-side; no LaTeX or math JavaScript
ships to the browser.

A post with 6+ `\section`s and 2000+ words splits into one page per section
(`\paginate{always|never}` overrides that). Figure, table and theorem numbers,
and `\ref`s, work across chapter pages.

The site-only macros (`\excerpt`, `\tags`, `\paginate`, the callout
environments, …) are defined for real LaTeX in `content/blog/mitaa.sty`, so a
post also compiles to a PDF. `npm run blog:check <post>` builds it with latexmk
and checks that every figure, equation and citation number matches what the
site prints; `-- --publish` copies the PDF to `public/docs/blog/`.

### Projects System

A project page can come from **two sources**, merged and deduplicated on the
projects list:

1. **Curated projects** — markdown files in `content/projects/`. The frontmatter holds
   `title`, `description`, `category`, `techStack[]`, `github`, `demo`,
   `featured`, `context`, `role`, `goal`, `features[]`, and an optional `pcb`
   block (see [Showcasing a PCB](#showcasing-a-pcb)); the markdown body is the
   optional Overview section. Parsed by `src/lib/projects/index.ts`.
2. **GitHub repos** — every public repo is pulled at build time by
   `scripts/fetch-github-data.mjs` and mapped to a project in `src/lib/projects/github.ts`.
   Title, category, tech stack, languages, commits, contributors, releases and
   dependencies are all derived automatically.

If a curated project and a GitHub repo describe the same thing (same slug or
`github` URL), the curated one wins.

### GitHub Integration

The site runs as a native Next.js app on Vercel, but GitHub data is still
prefetched **at build time** (rather than per-request) for speed and to avoid
hitting rate limits at runtime. `scripts/fetch-github-data.mjs` runs before
every build (`npm run prebuild`) and writes JSON into `public/data/`:

| File | Purpose |
|---|---|
| `public/data/github-contributions.json` | Contribution calendar data (last 52 weeks) |
| `public/data/github-repos.json` | Public repositories (name, description, stars, forks, language, topics, and any PCB assets) |

It reads the GitHub GraphQL API for contributions and the REST API for repos.
The site then reads these JSON files at build time (server-side for repos,
client-side for contributions).

The same pre-build pass also pulls **PCB assets** out of each repo — see below.

### PCB Viewer (schematic · PCB · 3D · BOM)

A project page can show an interactive hardware viewer with tabs —
**Schematic**, **PCB**, **3D** and **BOM** — rendered in the browser:

- **Schematic & PCB** have two render modes:
  - **Static images (Diode-style, preferred when present)** — pre-rendered SVGs
    generated by `scripts/render-kicad-images.mjs` (kicad-cli), shown with pan/zoom
    and a **Top / Bottom / X-ray** toggle for the board (the X-ray overlays all
    copper layers). Since Vercel can't run kicad-cli, these are generated locally
    (or in a hardware-repo's CI) and committed. Run `npm run pcb:render <board.kicad_pcb> [schematic.kicad_sch]`.
  - **Live KiCanvas (fallback)** — when no images exist, the original KiCad files
    are rendered in-browser by [KiCanvas](https://kicanvas.org): pan, zoom, layer
    presets and a sheet selector for hierarchical designs.
- **3D** is rendered with Google's [`<model-viewer>`](https://modelviewer.dev)
  from a `.glb`. STEP files can't be shown by any browser, so a `.step` / `.stp`
  is **converted to `.glb` at build time** (`scripts/step-to-glb.mjs`, powered by
  OpenCascade via `occt-import-js`).
- **BOM** renders a Bill-of-Materials `.csv` as a searchable / sortable table
  (`src/components/pcb/BomTable.tsx`) — the CSV is parsed in the browser, no build
  step. Generate one from KiCad with `kicad-cli sch export bom`.

**All PCB files must live in a `PCB/` folder** — either at the repo root, or
inside your `project/` docs folder (`project/PCB/`). The build looks nowhere
else. If a repo has **both** a `project/` folder (documentation) and a `PCB/`
folder (hardware), the two are **combined on the same project page**: the
`project/` markdown renders as the *Documentation* section and the `PCB/` files
as the *Hardware* section, one below the other. The component `PcbViewer`
(`src/components/pcb/PcbViewer.tsx`) only shows the tabs whose files exist, and each
file is fetched lazily when its tab is first opened.

There are two ways to attach a PCB to a project:

| Source | Where the files go | How they're picked up |
|---|---|---|
| **GitHub repo** (recommended) | a `PCB/` folder in the repo (root, or `project/PCB/`) | `fetch-github-data.mjs` scans that `PCB/` folder at build time, downloads the files into `public/pcb/<repo>/`, converts STEP → GLB, and attaches them to that repo's project automatically — alongside any `project/` docs |
| **Curated project** | `public/pcb/<name>/` in this repo | set the `pcb` block in the project's frontmatter to point at the files |

**What the GitHub scan looks for inside `PCB/`:**
- `*.kicad_sch` — the schematic. **All** sheets are downloaded (plus the
  `.kicad_pro` if present) and fed to KiCanvas, so hierarchical/multi-sheet
  designs resolve fully. When a design has more than one page, a compact **sheet
  selector** appears in the viewer to switch between them (no sidebar needed).
- `*.kicad_pcb` — the board layout
- a board `*.step` / `*.stp` (converted to `.glb`), or an existing `*.glb` /
  `*.gltf`. Per-component model folders (`3d/`, `packages3d/`, `.3dshapes/`, …)
  are ignored so a single capacitor never gets picked as "the board".
- a BOM `*.csv` whose filename mentions "bom" — shown as an interactive table.
- pre-rendered `*.svg` / `*.png` images (Diode-style) — filenames containing
  `schematic`, `top`, `bottom`, or `x-ray`/`xray` are picked up and take
  precedence over the live KiCanvas view.

> **Tip — for a rich 3D board with components**, export the STEP from KiCad with
> its 3D models baked in and commit it to `PCB/`:
> ```bash
> kicad-cli pcb export step PCB/board.kicad_pcb -o PCB/board.step --subst-models
> ```
> A repo with only a `.kicad_pcb` (no STEP/GLB) still gets Schematic + PCB tabs,
> just no 3D.

Files pulled from GitHub are regenerated on every build, so `public/pcb/*`
(except the committed demo) is git-ignored.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (recommended: 20 LTS)
- [npm](https://www.npmjs.com/) 9+ or [pnpm](https://pnpm.io/)

### Installation

```bash
# Clone the repository
git clone https://github.com/mitaadevelop/mitaa.dev.git
cd mitaa.dev

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

`public/data/` is not committed. To see GitHub-sourced projects and the
contribution calendar in development, run `node scripts/fetch-github-data.mjs`
once (or `npm run build`).

Other scripts:

```bash
npm run blog:check <post> [-- --publish]          # latexmk build + numbering check
npm run downloads:build [-- <name> …]             # LaTeX templates + shop ZIPs → public/downloads/ (local)
npm run pcb:render <board.kicad_pcb> [sch]        # kicad-cli → schematic/PCB/X-ray SVGs (local)
npm run pcb:convert <in.step> <out.glb>           # STEP → GLB
npm run pcb:recolor <in.glb> <out.glb> --board "#1b2a4a" [--silk "#fff"] [--finish "#d4af37"]
```

### Build

```bash
# Build for production
npm run build

# Typecheck, lint and test
npx tsc --noEmit && npm run lint && npm test
```

`prebuild` first fetches GitHub data and converts any PCB models, then Next.js
builds the app into `.next/`. Vercel runs this for you on every push.

### Make shortcuts

The `Makefile` wraps all of the above; `make` lists every target.

```bash
make install        # npm ci
make run            # dev server (PORT=4000 for another port)
make build          # full production build, GitHub fetch included
make preview        # build without the GitHub fetch, then serve it
make check          # typecheck + lint + test
make downloads      # rebuild the shop downloads (ONLY="cheatsheet" for one)
make blog-check POST=report-design-showcase
```

---

## Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Required for pre-build GitHub data fetching
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

To create a token:
1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Generate a new token (classic) with **no scopes** required for public data, or `read:user` for private contributions
3. Copy the token into `.env.local`

> The token is only used at build time by `scripts/fetch-github-data.mjs`. It is never exposed to the client bundle. Without it, contributions data will be skipped (repos are public and will still be fetched).

#### Download counts (optional)

The shop counts its free downloads in [Upstash Redis](https://upstash.com). In Vercel, open **Storage → Marketplace → Upstash for Redis**, create a free database and connect it to the project; Vercel then sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you. For `next dev`, copy them into `.env.local` (or use `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` from the Upstash console):

```env
KV_REST_API_URL=https://xxxx.upstash.io
KV_REST_API_TOKEN=xxxxxxxx
```

Without them every download still works; nothing is counted and no count is shown.

---

## Content Guide

### Adding a Blog Post

Create `content/blog/my-new-post.tex` — the filename is the URL slug. Adding the
file is all it takes; it shows up on `/blog`, in `/feed.xml` and in the sitemap.

```latex
\title{My New Post}
\date{2026-09-23}
\excerpt{A short description of this post.}
\tags{Embedded, Tutorial}

\begin{document}

\section{Introduction}

Text with \textbf{bold}, \emph{emphasis} and inline math $E = mc^2$.

\begin{lstlisting}[language=c]
int main(void) { return 0; }
\end{lstlisting}

\begin{figure}
\includegraphics[width=0.4\textwidth]{/images/board.png}
\caption{The board}
\label{fig-board}
\end{figure}

As \ref{fig-board} shows, and as \cite{shannon1948} argued.

\begin{thebibliography}{9}
\bibitem{shannon1948} C. E. Shannon, \emph{A Mathematical Theory of Communication}, 1948.
\end{thebibliography}

\end{document}
```

The three fixture posts in `content/blog/` double as a reference:
`latex-features-showcase.tex` for structure, `katex-math-reference.tex` for
math, and `report-features-reference.tex` for theorems, callouts, footnotes and
references. Run `npm test` after editing the pipeline.

### Adding a Project

You usually don't have to do anything: **every public GitHub repo becomes a
project automatically** at build time. Push a repo and it shows up on `/projects`
with its language, tech stack, commits, contributors and README.

Add a **curated** project only when you want to hand-write the details or feature
something that isn't a repo:

Create `content/projects/my-project.md` (filename = URL slug):

```markdown
---
title: "My Project"
description: "One-line summary shown in the list."
category: "Embedded"
techStack: ["KiCad", "C", "ARM Cortex-M"]
featured: true
context: "Why it exists."
role: "Hardware & Firmware"
goal: "What it set out to do."
features:
  - "First highlight"
  - "Second highlight"
# Optional: interactive PCB viewer (see "Showcasing a PCB")
pcb:
  schematic: /pcb/my-project/board.kicad_sch
  board: /pcb/my-project/board.kicad_pcb
  model3d: /pcb/my-project/board.step   # auto-converted to .glb at build time
---

Optional Overview content in Markdown.
```

### Showcasing a PCB

To add the **Schematic / PCB / 3D** viewer to a project (see the
[PCB Viewer](#pcb-viewer-schematic--pcb--3d--bom) architecture notes):

- **From a GitHub repo (recommended):** put your KiCad files and a board
  `.step` (or `.glb`) in a **`PCB/`** folder in that repo (at the root, or as
  `project/PCB/`). On the next build the site pulls them in and the viewer
  appears on that project's page automatically — no frontmatter needed. If the
  repo also has a `project/` docs folder, both show on the same page.
- **For a curated project:** drop the files under `public/pcb/<name>/` and set
  the `pcb` block in the project frontmatter (shown above). Any of the three
  fields may be omitted; only the tabs with files are shown.

`.step` / `.stp` models are converted to `.glb` before dev and build via the
`predev` / `prebuild` hooks, or on demand:

```bash
npm run pcb:convert PCB/board.step public/pcb/my-project/board.glb
```

### Photos & demo video

A project page can also show a **photo gallery** (thumbnail grid + lightbox) and a
**demo video**:

- **From a GitHub repo:** put photos/screenshots in an `images/`, `media/`,
  `gallery/` or `photos/` folder, and a demo clip (`.mp4` / `.webm`) anywhere in
  the `project/` folder. They're downloaded into `public/media/<repo>/` at build
  time and shown automatically.
- **For a curated project:** set `gallery: [ ... ]` (image paths/URLs) and
  `video:` (a YouTube/Vimeo URL, or a path to an `.mp4`/`.webm`) in the
  frontmatter. Committed media lives in `public/media/curated/<name>/`.

### Measurement charts

Measurement datasets render as interactive multi-series line charts (crosshair +
tooltip, legend, table view, dark-mode aware; `MeasurementChart.tsx`). Each CSV has
the **X value in the first column** and one **Y series per remaining column**.

- **From a GitHub repo:** put `.csv` files in a `measurements/` or `data/` folder.
- **For a curated project:** add a `measurements:` array in frontmatter, each item
  `{ src, title, xLabel, yLabel }`.

Colors use a CVD-validated categorical palette (dataviz skill) in fixed order.

---

## Comments & Social

This website does not host its own comment system. Instead, blog post discussions happen externally on **X (formerly Twitter)**.

### How it works

- Each blog post published on `mitaa.dev` is also shared as a post on **X**
- Readers can reply, quote, or discuss the post directly on that platform
- This keeps the website lightweight while still enabling community interaction

### Where to follow

- **X / Twitter**: Follow [@MITCHEL_Dev](https://x.com/MITCHEL_Dev) for new posts and updates *(replace with your actual handle)*
- **GitHub**: Star and fork the repo at [github.com/mitaadevelop/mitaa.dev](https://github.com/mitaadevelop/mitaa.dev)

> Want to self-host comments instead? The site is built to be extended. You can integrate Disqus, Cusdis, or a custom Supabase backend by adding a client-side comment component to `src/app/blog/[slug]/page.tsx`.

---

## Shop

`/shop` lists digital products from `src/data/shop.ts`; preview images live in
`public/shop/<product>/`, and the sale masters stay outside git
(`private-products/`, ignored). Checkout is not enabled yet — products show as
"Coming soon" until a payment provider is wired up.

---

## Deployment

### Vercel (this site's host)

The site runs as a **native Next.js app on Vercel** — not a static export. Connect
the GitHub repo once and Vercel builds and deploys automatically on every push,
running `npm run build` (which triggers the `prebuild` data-fetch + PCB
conversion).

> Add `GITHUB_TOKEN` as an environment variable in your Vercel project settings
> so the pre-build script can fetch GitHub data. Without it the build still
> succeeds, but GitHub-sourced projects are missing.
>
> Connect an Upstash Redis database (Storage → Marketplace) to show download
> counts in the shop; see [Download counts](#download-counts-optional).

Because it's a native Next.js deployment, server rendering, image optimization,
dynamic routes (`/feed.xml`, `/api`) and the build-time PCB fetch all work
out of the box — none of which a static-export/GitHub Pages setup could do.

---

## Roadmap

- [x] Dark mode with a theme toggle (`ThemeToggle`, `next-themes`)
- [x] RSS feed for blog posts (`/feed.xml`)
- [x] Sitemap.xml generation
- [x] Open Graph image generation
- [x] Estimated reading time calculation (auto)
- [x] Blog posts in LaTeX, with KaTeX math and per-chapter pages
- [x] Snapshot and regression tests for the blog pipeline
- [x] Interactive hardware viewer (schematic / PCB / 3D / BOM + X-ray)
- [ ] True translucent PCB X-ray (stack per-layer renders with opacity)
- [ ] Tag-based blog filtering
- [ ] Set `\xpost` in each post to its real X post URL

---

## License

No `LICENSE` file has been added yet.

Feel free to fork, clone, or use this as a template for your own portfolio. If you do, a shoutout or star on GitHub is always appreciated ⭐

---

<p align="center">
  Built with ❤️ by <a href="https://mitaa.dev">mitaa.dev</a>
</p>
