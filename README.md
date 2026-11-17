# mitaa.dev

> Personal portfolio and blog of a Junior Embedded Systems Engineer & Software Developer.
> Built with Next.js, TypeScript, Tailwind CSS, and a love for clean, minimal design.

---

## Quick start: where does my content go?

| I want to add… | Do this |
| --- | --- |
| **A blog post** | `npm run new:post <name>`, write it, delete its `\draft` line, push |
| **A project** | Push a public GitHub repo; add a `project/` folder for the write-up |
| **The home page bio** | Edit `content/bio.md` |
| **A free download in the shop** | Edit its sources in `content/shop/`, then `npm run downloads:build` |

Everything you write lives in `content/` (plus images in `public/blog/<name>/`).
[`content/README.md`](content/README.md) explains each of these and which folders
you should not touch. To see the site while you write: `npm run dev`.

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
| **Animations** | [Motion](https://motion.dev/) for single-element entrances, [GSAP](https://gsap.com/) for the home intro and scroll effects |
| **Blog** | LaTeX via [@unified-latex](https://github.com/siefkenj/unified-latex) → [Rehype](https://github.com/rehypejs/rehype), math via [KaTeX](https://katex.org/) |
| **Markdown** | [Remark](https://remark.js.org/) — projects, bio and GitHub READMEs |
| **Diagrams** | [Mermaid](https://mermaid.js.org) text drawn to SVG at build time by [pele](https://pele.run) — blog posts and project docs |
| **Syntax Highlighting** | [highlight.js](https://highlightjs.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Font** | [Inter](https://rsms.me/inter/) (Google Fonts) |
| **Hardware viewer** | [KiCanvas](https://kicanvas.org) (live schematic/PCB) + [`<model-viewer>`](https://modelviewer.dev) (3D) + [occt-import-js](https://github.com/kovacsv/occt-import-js) (STEP→GLB) + [kicad-cli](https://docs.kicad.org) (pre-rendered SVGs) |
| **Download counts** | [Upstash Redis](https://upstash.com) over its REST API (optional) |
| **Hosting** | [Vercel](https://vercel.com/) — native Next.js (SSR + static) |

---

## Features

### General
- ⚡ **Pre-rendered** — content baked in at build time for instant page loads
- 🎨 **Minimalist light and dark theme** — clean whites and grays, green accents, a theme toggle
- 📱 **Responsive** — optimized for mobile, tablet, and desktop
- 🔤 **Inter font** — crisp, modern typography with tight tracking
- ✨ **Animations** — blur and fade entrances via `animate-ui`, an intro and scroll effects via GSAP, which check `prefers-reduced-motion` themselves
- 📊 **Scroll progress bar** — subtle indicator at the top of the viewport
- 🧭 **Sticky table of contents** — auto-highlighting active section on blog posts

### Home Page (`/`)
- Bio section with an animated intro
- **GitHub Activity** — a contribution heatmap for the last year
- Latest blog posts list with date and primary tag (the section is left out while there are no posts)

### Shop (`/shop`)
- Free downloads: three **LaTeX templates** (essay, report, research report), a two-page **LaTeX cheat sheet** and a wallpaper pack
- Every download goes through `/api/download/<id>`, which counts it (once per visitor, per file, per day; no IP stored) and redirects to the file
- "Open in Overleaf" for the templates

### Languages (`/` in Dutch, `/en` in English)
- The site is written in **Dutch**; every page also exists in **English** under `/en/…`, and a button next to the light/dark toggle (**EN** / **NL**) switches to the same page in the other language.
- The words of the interface are in `src/lib/i18n/dictionary.ts` (both languages side by side, so a missing translation is a type error). Texts of the shop are `{ nl, en }` pairs in `src/data/`.
- The bio: `content/bio.md` is Dutch, `content/bio.en.md` is the English version (written by hand; without it the English page shows the Dutch text and says so).
- A blog post says which language it is written in (`\usepackage[dutch]{babel}` or `\lang{nl}`; English without it). On the other language's page it shows the same text with a short note, and search engines are pointed at the address in its own language.
- The LaTeX templates and the cheat sheet in the shop stay English; the shop says so.
- **Automatic translation.** You write in one language; at build time `scripts/translate-content.mts` translates the bio and the blog posts into the other one with the Claude API and the site shows them with the note "Automatically translated from … View the original". Put `ANTHROPIC_API_KEY` in the environment (Vercel: Settings → Environment Variables). Without it nothing breaks: the other language shows the original with a note. Each piece of text is cached, so only what you changed is translated (and paid for) again. A hand-written `content/bio.en.md` always wins. Run it yourself with `npm run translate`.

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
- **Diagrams** — architecture, flowcharts, sequence diagrams and more, from
  Mermaid text, drawn at build time and themed light/dark
- SEO-friendly metadata per post and per chapter

### GitHub Integration
- Contribution calendar heatmap (via GitHub GraphQL API)
- Public repo listing with metadata (stars, forks, language, topics)

---

## Project Structure

```
mitaa.dev/
├── content/
│   ├── blog/                   # Your posts (*.tex) — none are committed; mitaa.sty = the site's macros as LaTeX
│   ├── projects/*.md           # Curated projects — YAML frontmatter + markdown (optional)
│   ├── shop/                   # Sources of the free LaTeX templates and cheat sheet
│   └── bio.md                  # Home page bio
├── public/
│   ├── data/                   # Pre-fetched GitHub data (git-ignored; generated at build time)
│   ├── docs/                   # PDFs: blog/ committed, <repo>/ pulled at build time
│   ├── downloads/              # Built shop downloads (ZIPs, PDFs, previews) — committed output of `downloads:build`
│   ├── media/                  # Gallery/video/CSV: curated/ committed, <repo>/ pulled at build time
│   ├── pcb/                    # PCB assets: <repo>/ pulled at build time
│   └── shop/                   # Shop preview images
├── scripts/
│   ├── fetch-github-data.mjs   # Pre-build: GitHub data + PCB/doc/media assets
│   ├── convert-step-models.mjs # predev/prebuild: convert curated .step models → .glb
│   ├── step-to-glb.mjs         # STEP → GLB converter (OpenCascade / occt-import-js)
│   ├── render-kicad-images.mjs # kicad-cli → schematic/PCB SVGs + X-ray (run locally)
│   ├── recolor-glb.mjs         # Recolor soldermask/silkscreen/finish of a board GLB
│   ├── build-downloads.mts     # Compile the LaTeX templates and zip the shop downloads (run locally)
│   └── blog-check.mts          # Compile a post with latexmk and compare numbering
├── templates/                  # Starting points: a blog post (shows every feature) and a project repo
├── src/
│   ├── proxy.ts                # Dutch without a prefix, English under /en (rewrite + redirect)
│   ├── app/                    # Next.js App Router routes; every page is under [lang]/
│   │   ├── api/github-repos/   # Live repo list (revalidates every 60 s)
│   │   ├── api/download/[id]/  # Counts a shop download, then redirects to the file
│   │   ├── api/blog-watch/     # Dev only: live preview of .tex saves (404 in production)
│   │   ├── blog/[slug]/        # layout.tsx = post chrome, page.tsx = chapter text
│   │   ├── feed.xml/           # RSS feed
│   │   ├── projects/           # Project list & detail pages
│   │   ├── shop/               # Shop, product and LaTeX template pages
│   │   └── globals.css         # Global styles + .prose-blog
│   ├── components/
│   │   ├── animate-ui/         # Animation primitives (Blur, Fade, ScrollProgress)
│   │   ├── blog/               # Table of contents, chapter nav, progress bar, live preview
│   │   ├── pcb/                # Schematic / PCB / 3D / BOM viewer
│   │   ├── project/            # Docs, gallery, video, charts, contributions
│   │   ├── shop/               # Shop gallery, download counts
│   │   └── site/               # Footer, theme toggle, icons, home hero, scroll reveal
│   ├── hooks/                  # Hooks used by the animation primitives
│   ├── lib/
│   │   ├── blog/               # The LaTeX pipeline (see Blog System)
│   │   ├── projects/           # Curated + GitHub-sourced projects, markdown → HTML, shared types
│   │   └── date.ts, diagram.ts, downloads.ts, gsap.ts, bio.ts, pcb.ts, site.ts, utils.ts
│   ├── data/                   # shop.ts (catalogue), latex-templates.ts (free templates + cheat sheet)
│   └── types/                  # JSX types for <model-viewer> and KiCanvas elements
└── tests/                      # node --test: blog snapshots + regressions; fixtures/blog = the posts they render
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

- [Node.js](https://nodejs.org/) 20.6+ (the GitHub fetch below uses `node --env-file`; Vercel builds on Node 24)
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
contribution calendar in development, fetch them once with your tokens:

```bash
make data     # runs: node --env-file=.env.local scripts/fetch-github-data.mjs
```

`--env-file` matters: only Next.js reads `.env.local` by itself, and this script
is plain Node, so without the flag it runs without a token — repos still arrive
(at GitHub's public rate limit), but the contribution calendar is skipped. See
[Environment Variables](#environment-variables).

Under `npm run dev`, saving a `.tex` file in `content/blog/` refreshes the open
post, and `/blog/template` shows the template post that demonstrates every feature
of the blog (it exists in development only).

Other scripts:

```bash
npm run blog:check <post> [-- --publish]          # latexmk build + numbering check
npm run downloads:build [-- <name> …]             # LaTeX templates + shop ZIPs → public/downloads/ (local)
npm run icons:build                               # favicon.ico + apple-icon.png from src/app/icon.svg (local, needs Chrome)
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
builds the app into `.next/`. On Vercel the same command runs for every build;
see [Deployment](#deployment).

### Make shortcuts

The `Makefile` wraps all of the above; `make` lists every target.

```bash
make install        # npm ci
make run            # dev server (PORT=4000 for another port)
make build          # full production build, GitHub fetch included
make preview        # build without the GitHub fetch, then serve it
make check          # typecheck + lint + test
make data           # fetch GitHub repos and contributions, tokens from .env.local
make new-post POST=can-bus-sniffer TITLE="A CAN bus sniffer"   # start a blog post
make downloads      # rebuild the shop downloads (ONLY="cheatsheet" for one)
make blog-check POST=report-design-showcase
```

---

## Configuration

### Environment Variables

Create a `.env.local` file in the project root (it is git-ignored):

```env
# GitHub tokens for the pre-build fetch (scripts/fetch-github-data.mjs).
# Either set the one GITHUB_TOKEN, or the two specific ones; the specific
# names win when both are set.
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_TOKEN_CONTRIBUTIONS=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # the contribution heatmap
GITHUB_TOKEN_PUBLIC_REPO=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx     # repos, READMEs, PCB files, media

# Optional: machine translation of the bio and the posts at build time (scripts/translate-content.mts).
ANTHROPIC_API_KEY=sk-ant-...
# TRANSLATE_MODEL=claude-sonnet-5-5   # the default
# TRANSLATE=off                       # skip the step
```

To create a token:
1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Generate a new token (classic) with **no scopes** for public data, or `read:user` to also count private contributions (and switch on *Private contributions* in your GitHub profile)
3. Copy the token into `.env.local`

How the tokens are used:

- **On Vercel** the same names go in the project's *Settings → Environment Variables*; the build reads them from there.
- **Locally**, `.env.local` is read by Next.js, but not by the fetch script, which is plain Node. Run it as `node --env-file=.env.local scripts/fetch-github-data.mjs`.
- The tokens are only used at build time by that script. They never reach the client bundle.
- **Without the contributions token** the heatmap is skipped: `public/data/github-contributions.json` is not written, and the home page shows "Contribution data isn't available right now". An existing file is kept. Repos are public and still arrive without any token, within GitHub's public rate limit (60 requests per hour per IP).
- The heatmap is a **snapshot of the moment of the build**. It only refreshes when the fetch runs again, so rebuild after you want newer activity.

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

```bash
npm run new:post can-bus-sniffer "A CAN bus sniffer"   # or: make new-post POST=can-bus-sniffer
```

This makes `content/blog/can-bus-sniffer.tex` (the file name is the URL,
`/blog/can-bus-sniffer`) and `public/blog/can-bus-sniffer/` for its images. The post
starts as [`templates/blog/post.tex`](templates/blog/post.tex), which shows every
feature of the blog (it is also at `/blog/template` under `npm run dev`), so delete
what you do not need. It is a **draft**: open it with `npm run dev` and it shows on
your machine only. Delete the `\draft` line to publish it; it then appears on
`/blog`, in `/feed.xml` and in the sitemap. The full walk-through is in
[`content/README.md`](content/README.md).

The test fixtures in `tests/fixtures/blog/` go further: `katex-math-reference.tex`
for math and `report-features-reference.tex` for theorems, callouts, footnotes
and references. Run `npm test` after editing the pipeline.

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

### Architecture and other diagrams

Write the diagram as [Mermaid](https://mermaid.js.org) text; the site draws it
to an SVG when it is built, with [pele](https://pele.run) (no JavaScript in the
browser, and it follows the light/dark theme).

- **On a project page** (a repo's `project/*.md`, its README, or a curated page):
  a fenced block marked `mermaid`. `templates/project/repo/project/architecture.md`
  has a flowchart, an `architecture-beta` system diagram and a sequence diagram.
- **In a blog post:** a listing in the language `mermaid`, inside a `figure` for a
  number and a caption; `title=` is the accessible name.
  `templates/blog/post.tex` shows both a flowchart and an architecture diagram.

```latex
\begin{figure}
\begin{lstlisting}[language=mermaid, title={Signal path of the controller}]
flowchart LR
  A[Sensor] --> B[Controller] --> C[Actuator]
\end{lstlisting}
\caption{From the sensor to the actuator}
\end{figure}
```

The Mermaid text stays behind "Show diagram source". A diagram with a typo shows
pele's error and its source instead of failing the build, and `npm run dev` logs
it. In the PDF (`npm run blog:check`) a diagram is printed as its source.

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

> Want to self-host comments instead? The site is built to be extended. You can integrate Disqus, Cusdis, or a custom Supabase backend by adding a client-side comment component to `src/app/[lang]/blog/[slug]/page.tsx`.

---

## Shop

`/shop` lists the digital products. They are all **free**: the Signal No. 01
wallpaper pack (`src/data/shop.ts`), three LaTeX templates — essay, report and
research report — and a two-page LaTeX cheat sheet (`src/data/latex-templates.ts`).
Preview images live in `public/shop/<product>/`; the sale masters stay outside git
(`private-products/`, ignored).

- **Sources:** the templates are in `content/shop/latex-templates/<slug>/` and the cheat sheet in `content/shop/latex-cheatsheet/`. `npm run downloads:build` (or `make downloads`) compiles them with LaTeX and writes the ZIPs, PDFs and preview images to `public/downloads/`. It runs locally, and its output is committed.
- **Downloads and counts:** every link goes through `/api/download/<id>`, which counts the download and redirects to the file. Counts live in Upstash Redis (see [Download counts](#download-counts-optional)) and are hidden until it is connected.
- **Overleaf:** `?open=overleaf` sends the visitor to Overleaf, which fetches the ZIP itself.

---

## Deployment

### Vercel (this site's host)

The site runs as a **native Next.js app on Vercel** — not a static export. Vercel
runs `npm run build`, which triggers the `prebuild` data-fetch + PCB conversion,
and `vercel.json` only names the framework.

Two ways to get a version live:

1. **Through Git.** Connect the GitHub repo to the Vercel project and every push
   builds and deploys. Check in the project's *Deployments* tab that pushes are
   actually picked up: a branch or pull request is only previewed when the
   integration builds it.
2. **From your machine with the Vercel CLI**, for a version that is not on `main`
   yet. Deploy from a clean copy: leave out `node_modules`, `.next`, every `.env*`
   file and `private-products/`, because the CLI uploads what is in the folder.

   ```bash
   vercel link --yes --project <project> --scope <team>   # once; this writes .env.local, delete it
   vercel deploy --prod --yes --scope <team>
   ```

   A CLI deploy does not need the GitHub tokens in Vercel: run the fetch locally
   (`node --env-file=.env.local scripts/fetch-github-data.mjs`) and the files it
   writes to `public/data/`, `public/pcb/`, `public/docs/` and `public/media/` go up
   with the deploy. The build then skips the contributions fetch and keeps them. Those
   four folders are git-ignored in the repo, so in the upload folder use a
   `.vercelignore` (`node_modules`, `.next`, `.env*`) instead of the `.gitignore`.

> Add the GitHub tokens ([Environment Variables](#environment-variables)) to the
> Vercel project settings so the pre-build script can fetch GitHub data itself.
> Without them the build still succeeds, but the contribution heatmap is missing
> and repos come in at GitHub's public rate limit.
>
> Connect an Upstash Redis database (Storage → Marketplace) to show download
> counts in the shop; see [Download counts](#download-counts-optional).
>
> The canonical URLs, sitemap and feed use `https://mitaa.dev`. Set
> `NEXT_PUBLIC_SITE_URL` in the project when a deployment lives elsewhere.

A domain belongs to one Vercel project: a deployment of that project answers on
it as soon as it is aliased. Check which project a domain is attached to before a
production deploy, because that is the version the visitors get.

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
- [x] Free shop downloads (LaTeX templates, cheat sheet) with a daily-deduplicated download count
- [x] Mermaid diagrams (architecture, flowchart, sequence …) in blog posts and project docs
- [x] One blog template post that shows every feature, with a live preview under `npm run dev`
- [x] Home intro and scroll effects with GSAP
- [ ] Refresh the contribution heatmap on a schedule (it is a snapshot of each build)
- [ ] True translucent PCB X-ray (stack per-layer renders with opacity)
- [ ] Tag-based blog filtering
- [ ] Write the first blog post and set its `\xpost` to the real X post URL

---

## License

No `LICENSE` file has been added yet.

Feel free to fork, clone, or use this as a template for your own portfolio. If you do, a shoutout or star on GitHub is always appreciated ⭐

---

<p align="center">
  Built with ❤️ by <a href="https://mitaa.dev">mitaa.dev</a>
</p>
