# AGENTS.md

This file provides guidance to coding agents working in this repository. It is
the single source of truth: `CLAUDE.md` only imports it (`@AGENTS.md`), which is
the layout `create-next-app` scaffolds and the one `next dev` maintains. Edit
this file, not that one.

## Commands

```bash
npm run dev      # Next dev server (predev: converts any curated .step models → .glb)
npm run build    # prebuild fetches GitHub data + converts STEP models, then next build
npm run lint     # eslint (eslint-config-next)
npm test         # node --test via tsx: snapshot + regression tests for the blog pipeline
npm start        # serve a production build
npm run blog:check <post> [-- --publish]   # compile a post with latexmk, compare its numbering with the site's; --publish copies the PDF to public/docs/blog/

# PCB tooling (run locally — kicad-cli / occt run on your machine, not on Vercel):
npm run pcb:convert <in.step> <out.glb>                         # STEP → GLB (occt-import-js)
npm run pcb:render  <board.kicad_pcb> [schematic.kicad_sch]     # kicad-cli → schematic/PCB/X-ray SVGs
npm run pcb:recolor <in.glb> <out.glb> --board "#hex" [--silk "#hex"] [--finish "#hex"]  # recolor a board GLB's materials
```

Typecheck with `npx tsc --noEmit` (strict; keep it green).

### Tests
`tests/blog.test.ts` runs the real LaTeX pipeline over the fixture posts in `tests/fixtures/blog/` — not over `content/blog/`, which holds only what the author publishes (the test sets `BLOG_CONTENT_DIR`, and `BLOG_PUBLIC_DIR` for the fixture PDF in `tests/fixtures/public/`; both are read on every call in `src/lib/blog/source.ts`): twelve HTML snapshots plus regression tests for the things that have actually broken — footnote heading ids, citation numbering, figure labels, cross-chapter counters, forward `\ref`s, swallowed spaces after control symbols, and untranslated macros leaking into the page. Accept intended output changes with `UPDATE_SNAPSHOTS=1 npm test`, and read the diff before you do.

Guards worth keeping whatever else changes: **no `class="macro macro-…"` may reach the HTML** (unified-latex emits one for every macro it cannot translate, which silently swallows the character — that is how `\textbackslash` disappeared from 78 places), **no untranslated `class="environment …"`** (`findUntranslated` in `render.ts`; the same check warns in the `next dev` terminal), and **no `data-ref=` placeholder may survive** (an unresolved cross-reference). A coverage test fails when a name in `SUPPORTED` (`latex.ts`) is used by no fixture.

## Hosting model — important

The site runs as a **native Next.js App Router app on Vercel** (server rendering + static generation + dynamic routes like `/feed.xml`, `/api`). It is **NOT** a static export — do not add `output: "export"`, `trailingSlash`, or GitHub Pages config. `next.config.ts` enables the React Compiler.

## Architecture

### Content: two merged sources
A project page can come from either source, merged + deduplicated on `/projects` (curated wins on matching slug or `github` URL):
- **Curated** — `content/projects/*.md` (YAML frontmatter + markdown body). Parsed by `src/lib/projects/index.ts`.
- **GitHub repos** — every public repo of the configured user, prefetched **at build time** by `scripts/fetch-github-data.mjs` into `public/data/github-repos.json`, then mapped to `Project` objects by `src/lib/projects/github.ts`.

Blog posts are **LaTeX**: `content/blog/*.tex` (none are committed on purpose — the blog is empty until the owner writes one, and `/blog` and the home page handle that), parsed and rendered by the modules in `src/lib/blog/` (map below). Markdown is used elsewhere on the site (projects, bio, GitHub READMEs) but never for the blog.

`templates/` holds the starting points for both, one folder each: `templates/blog/` (a post) and `templates/project/` (a repo skeleton in `repo/`, a curated page in `curated.md`). Each folder's `README.md` lists the folder and file-name rules the build scripts match on. Keep it in sync when those rules change. Under `npm run dev` only (`NODE_ENV === "development"`), the blog template is served as `/blog/template` (`devTemplatePost` in `src/lib/blog/source.ts`). The project template has no preview: copy `templates/project/repo/` into a real repo to see it.

#### Where things live
```
src/lib/blog/
  index.ts       public API: getAllPosts, getAllSlugs, getChapterOutline, getPostChapter, getPostShell
  source.ts      reading .tex files, splitting chapters, pagination rules
  latex.ts       LaTeX AST → semantic transform (labels, captions, footnotes, environments)
  render.ts      the unified pipeline: latex → hast → KaTeX → highlight → HTML
  hast.ts        rehype plugins adapting unified-latex's output (headings, math, tables)
  references.ts  citation numbering, \ref/\cite resolution, bibliography
  katex.ts       KaTeX options and site-wide macros (+ the mhchem side-effect import)
  i18n.ts        every word around a post, per language (en, nl) — no fs, client-safe
  text.ts        slugify, word counts, reading time, HTML escaping
  types.ts       shared types — no fs/path, safe to import from client components

content/blog/mitaa.sty   the site's own macros/environments as real LaTeX, so a post compiles to a PDF
scripts/blog-check.mts   npm run blog:check — latexmk + .aux comparison against getPostNumbering

src/lib/projects/
  index.ts       curated projects (content/projects/*.md) — parsing, getAllProjects, slugs
  github.ts      GitHub repos → Project objects, reading public/data/github-repos.json
  types.ts       Project, PcbAssets, Measurement, … — no fs/path

src/lib/          date.ts (UTC date formatting), bio.ts, pcb.ts, site.ts, utils.ts (cn)

src/components/
  blog/     post chrome: TOC, chapter nav/meta, keyboard nav, progress bar
  pcb/      hardware viewer: schematic/PCB/3D/BOM
  project/  project pages: docs, gallery, video, charts, language bar, contributions
  shop/     shop gallery
  site/     global chrome: footer, theme provider/toggle, icons
```

**Client components import types from `@/lib/blog/types` and `@/lib/projects/types`, never from the index** — both indexes pull in `fs`. Today every such import is `import type` and gets erased, so nothing leaks; the separate modules exist so that one careless edit to a value import cannot drag Node built-ins into the browser bundle.

**Dates go through `formatDate` in `src/lib/date.ts`.** `new Date("2026-09-18")` is midnight UTC, so a bare `toLocaleDateString` shows the previous day anywhere west of UTC — and in a client component that is also a hydration mismatch. `tests/date.test.ts` pins this.

#### The LaTeX pipeline
`@unified-latex` parses the `.tex` and translates the structural parts (sectioning, emphasis, lists, `tabular`, `verbatim`) on its own. It deliberately leaves semantics alone: `\label`, `\ref`, `\caption`, `\footnote` and `\cite` come out of its HTML converter as raw `macro` spans. `src/lib/blog/latex.ts` resolves all of that **on the LaTeX AST**, before conversion, using unified-latex's `\html-tag:` / `\html-attr:` escape hatch (attribute values must be JSON-encoded). The result goes through the hast plugins in `hast.ts` and then rehype-katex → rehype-highlight → rehype-stringify.

Supported subset (the list is `SUPPORTED` in `latex.ts`) — metadata macros `\title \date \excerpt \tags \coverimage \xpost \paginate \author \subtitle \affiliation \version \keywords \kind \pdf \lang \draft`, and the language from `\usepackage[dutch]{babel}`; `\section`/`\subsection`/`\subsubsection`, `\section*`, `\appendix`, `\clearpage`; `itemize`/`enumerate`/`quote[attribution]`; `figure` + `\includegraphics[width=0.4\textwidth]` or `barchart` + `\caption` + `\label`; `table` + `tabular` (booktabs rules too) + `\caption`; `lstlisting[language=c, title=file.c]`/`minted[filename=…]`/`verbatim`; `abstract`; callouts `note tip warning important caution`; theorem environments `theorem lemma proposition corollary definition example proof`; numbered `equation`; `\footnote`; `\ref`/`\Cref`/`\cref`/`\autoref`/`\eqref`/`\cite[note]`; `thebibliography`/`\bibitem`; and all of KaTeX's math.

**The site prints what LaTeX prints.** `content/blog/mitaa.sty` defines every site-only macro for real LaTeX, and `npm run blog:check <post>` compiles a post with latexmk and compares every `\label` and `\bibitem` number in the `.aux` with what the pipeline printed (`getPostNumbering`). Keep the two in step (the macros in `KATEX_MACROS`, `src/lib/blog/katex.ts`, have a twin in the Maths section of `mitaa.sty`; change both): `\ref` is the number alone, `\Cref`/`\autoref` add the word, `\eqref` gives "(3)"; captions read "Figure 3:" and sit where `\caption` is written; citations are numbered in `\bibitem` order and grouped "[2, 3]"; the bibliography is printed where `thebibliography` stands; footnotes, equations and sections number through the whole document. The control symbols (`\% \& \# \$ \_ \,` …) become plain text in `latex.ts`, because unified-latex's converter drops the space after them.

Things that will bite:
- **`\section` comes out as `<h3>`** and there is no option to change it; `rehypeLatexFixups` retags h3→h2/h4→h3/h5→h4 and is also where heading ids, the TOC and the `.heading-label` are assigned. **Heading numbers are text in the HTML**, counted on `RenderContext.counters` across chapters (letters after `\appendix`), not CSS counters. `\appendix` and a `\label` that follows a heading reach that walk as marker spans (`data-appendix`, `data-label`) from `latex.ts`.
- **Math comes out as `.inline-math` / `.display-math`**; rehype-katex looks for `.math-inline` / `.math-display`. A `\label` inside display math is stripped there too — KaTeX has no cross-reference machinery and would error on it. A numbered `equation` is handled before that, in `latex.ts`: it takes the next number on the post's counter, which is handed to KaTeX as `\tag{N}` (KaTeX's own `equation` numbering restarts at 1 for every formula).
- **`tabular` has no header semantics.** `\hline` leaves blank rows, which are dropped, and the first surviving row is promoted to `<thead>`/`<th>` by convention.
- **Two copies of `@types/hast`.** unified-latex-to-hast pins v2 while the project is on v3; the two `Root` types are structurally identical but nominally unrelated. The casts are confined to two statements in `renderLatex` (`render.ts`). Forcing one version through an override moves the errors inside unified-latex's own declarations.
- **Exactly one `katex` must be installed.** `rehype-katex@7` requires `katex@^0.16` while `katex@latest` is 0.18.x; two copies means `katex/contrib/mhchem` patches the wrong instance and every `\ce{}` silently renders as a red error. Check with `npm ls katex`. KaTeX's CSS is imported in `src/app/blog/[slug]/layout.tsx`, not in `globals.css` — Tailwind v4 inlines `@import` and would break the relative font URLs.

#### Chapters and numbering
Chapters come from `\section` (not `\section*`) — or, when a post has top-level `\clearpage`s, from those, so one page can hold several sections; the page is named after its first section, and pages after `\appendix` are "Appendices"/"Bijlagen". Splitting partitions the AST node array rather than slicing source, so a `\section` inside a verbatim block cannot split a post. `\paginate{auto|always|never}`; `auto` needs 6+ chapters *and* 2000+ words, explicit page breaks always paginate. `getChapterOutline` is sync (sitemap / `generateStaticParams`); `getPostChapter` renders. `\draft` posts are left out of everything when `NODE_ENV === "production"`.

- **Counters cross chapter boundaries** via `RenderContext.counters`: sections, one shared by theorem/lemma/proposition/corollary/definition (amsthm's default), and separate ones for example, figure, table, equation, listing and footnote. Each chapter's first heading id is forced to match its URL slug.
- **`\ref` and `\cite` resolve identically**: a key naming a `\label` is a cross-reference, anything else is looked up in `thebibliography`. Both become `<span data-ref data-macro>` placeholders and are resolved by `resolveRefs` only after every chapter has rendered, because a chapter may point forwards. A key that is neither renders visibly as `[?key]` rather than silently taking a citation number.
- **The abstract before the first `\section`** is lifted into the header (`PostShell.abstract`); one inside a section stays in the text.
- **Callout type is signalled by the rail colour, not the title colour** — several `--syn-*` tokens fall below 4.5:1 on `--code-bg`, and a 10px bold label is not large text.

#### Only the text swaps between chapters
All post chrome — back link, header (with the "Page N of M" pill), table of contents, pagination, progress bar, citation block, author card, previous/next post — lives in `src/app/blog/[slug]/layout.tsx`, in the site's own style: Tailwind tokens for the chrome, `.prose-blog` in `globals.css` for the body (shared with project pages; the LaTeX-only blocks — listings, bar chart, run-in theorem heads — are styled there too). The `[slug]` segment does not change when the reader moves from `/blog/<post>` to `/blog/<post>/<chapter>`, so Next keeps that subtree mounted and re-renders only the child page, which renders nothing but `ChapterBody`. The header never flashes and the sidebar keeps its scroll position.

The consequence: **nothing in the layout can receive the active chapter as a prop.** `ChapterMeta`, `ChapterNav`, `ChapterKeyboardNav` and `TableOfContents` are client components that derive it from the URL via `useCurrentChapter(outline)`. Whatever exists on some pages only — the abstract on page 1, the citation block and other-post links on the last — is part of the page's text in `ChapterBody`, not the layout, so nothing outside the text changes size when the reader turns a page.

**Turning a page animates only the text.** `ChapterBody` wraps it in React's `<ViewTransition>` (keyed by chapter, in the page — a layout never unmounts, so enter/exit would never fire there). Links carry `transitionTypes` `page-forward` / `page-back` (`pageTransition()` in `useCurrentChapter.ts`; `router.push` in `ChapterKeyboardNav`), which the `::view-transition-*` rules in `globals.css` turn into a short fade with a 12px nudge; anything else fades. `prefers-reduced-motion` swaps instantly. Copy buttons in the injected HTML work through one delegated listener (`CopyButtons`). The layout therefore needs every chapter's data up front, which is what `getPostShell(slug)` returns (memoized alongside `getPostChapter`, so it costs one render). If you add chapter-dependent chrome, follow the same pattern — moving it back into the page would undo the whole point.

`TableOfContents` keeps a module-level `NO_ITEMS` constant: the scroll-spy effect depends on `items`, and a fresh `[]` fallback per render would restart the `IntersectionObserver` on every render.

`templates/blog/post.tex` is the one post that shows every feature to an author (served as `/blog/template` under `npm run dev`; `npm run blog:check template`). The test fixtures in `tests/fixtures/blog/` — `latex-features-showcase.tex`, `katex-math-reference.tex` and `report-features-reference.tex` for the three feature groups — are what the snapshots render; `blog:check` finds them by name too. `report-design-showcase.tex` (a Dutch `\draft`, paged with `\clearpage`) exercises every report feature end to end, and compiles with `npm run blog:check`.

### Build-time data pipeline (the non-obvious part)
`prebuild` / `predev` run Node scripts that generate files into `public/` before Next builds:
- `scripts/fetch-github-data.mjs` — GitHub REST + GraphQL (repos, contributions, commits, contributors, releases, dependency manifests) **and** per-repo PCB assets and `project/**/*.pdf` documents (see below). Needs `GITHUB_TOKEN` (or `GITHUB_TOKEN_PUBLIC_REPO` / `GITHUB_TOKEN_CONTRIBUTIONS`); degrades to public-rate-limited fetches without one.
- `scripts/convert-step-models.mjs` → `scripts/step-to-glb.mjs` — converts curated `.step` models referenced in project frontmatter to `.glb` (OpenCascade via `occt-import-js`, WASM — runs on Vercel).

`public/pcb/*`, `public/docs/*`, `public/media/*` and `public/data/` are build artifacts. `.gitignore` ignores all of `public/data/` (readers fall back to empty data when it is missing — run `node scripts/fetch-github-data.mjs` to populate it for `next dev`), `public/pcb/*`, `public/docs/*` except `curated/` (hand-added PDFs) and `blog/` (PDFs from `blog:check --publish`), and `public/media/*` except `curated/`. Design files (`*.pen`) stay out of git.

### The PCB viewer subsystem (most distinctive area)
A project's optional `pcb` block (`PcbAssets` in `src/lib/projects/types.ts`) drives a tabbed hardware viewer rendered by `src/components/pcb/PcbViewer.tsx` (Schematic / PCB / 3D / BOM). Where assets come from:
- **GitHub repos:** files live in the repo's top-level **`PCB/` folder** (or `project/PCB/`). `fetch-github-data.mjs::fetchPcbAssets` scans that folder, downloads files into `public/pcb/<repo>/` (repo structure preserved so hierarchical schematics resolve), and converts STEP→GLB.
- **Curated:** files in `public/pcb/<name>/`, paths set in the `pcb:` frontmatter block.

Each tab has two possible renderers, and **pre-rendered images win when present**:
- **Schematic / PCB** — either static SVGs (Diode-style; `PcbImageView.tsx`, with pan/zoom and a Top/Bottom/X-ray toggle) generated by `render-kicad-images.mjs`, **or** live in-browser rendering via **KiCanvas** (`kicanvas-embed`, loaded from CDN). kicad-cli isn't available on Vercel, so image mode requires images committed to the repo / generated locally; otherwise it falls back to KiCanvas.
- **3D** — Google `<model-viewer>` from a `.glb` (KiCanvas can't do 3D). `render-kicad-images.mjs` and `step-to-glb.mjs` normalize orientation so boards lie flat (KiCad STEP is Z-up, glTF is Y-up).
- **BOM** — a `.csv` rendered as a searchable/sortable table (`BomTable.tsx`), parsed client-side.

`src/components/pcb/PcbPreview.tsx` shows a small auto-rotating 3D thumbnail on the projects list.

**KiCanvas coupling:** the layer presets and hierarchical-sheet selector reach into KiCanvas's shadow DOM internals (`getBoardViewer` / `getSchematicProject` in `PcbViewer.tsx`) because KiCanvas exposes no public API. This is intentionally defensive — feature-detected and wrapped in try/catch, so if KiCanvas (alpha) changes shape the controls just disappear instead of crashing. Custom-element JSX types live in `src/types/pcb-elements.d.ts`.

**Moving between projects swaps only the content.** The back links and the previous / next project cards are `ProjectFrame`, rendered by `src/app/projects/layout.tsx` — above `[slug]`, because Next remounts a dynamic segment's layout whenever its value changes. The project page wraps its content in the same `<ViewTransition>` as a blog page (`page-forward` / `page-back` / `page-fade`, CSS in `globals.css`). `ProjectFrame` renders its wrapping `<div>` on the list too: a ViewTransition only animates when its parent DOM node survives the navigation.

### PDF documents
Any `.pdf` in a repo's top-level `project/` folder (sub-folders included, `project/PCB/` excluded — that subtree belongs to the hardware viewer) is downloaded by `fetch-github-data.mjs::fetchPdfDocs` into `public/docs/<repo>/` with the repo path preserved, and surfaces as an extra tab in the **Documentation** section next to the markdown docs (`src/components/project/MarkdownDocs.tsx`). Curated projects declare PDFs via the `pdfs:` frontmatter array (`PdfDoc` in `src/lib/projects/types.ts`).

Switching documents fades like a blog page — as do the hardware viewer's tabs, its Top/Bottom/X-ray toggle and a measurement's Chart/Table toggle. All go through `swapView` in `src/lib/view-transition.ts` (a Transition tagged `page-forward`/`page-back`; a plain `setState` would not animate). The hardware views stay mounted so zoom and camera survive, so `PcbViewer` uses the ViewTransition's `update` animation rather than enter/exit. Rendering is a native `<object type="application/pdf">` embed with a fallback block plus an always-visible open/download link — **deliberately no pdf.js / react-pdf dependency**. Caps: 25 MB per file, 60 MB and 12 files per repo.

### Media: photo gallery + demo video
`fetch-github-data.mjs::fetchGallery` pulls images from a repo's `images/`/`media/`/`gallery/`/`photos/` folder and `fetchVideo` grabs a `.mp4`/`.webm` from `project/`, both into `public/media/<repo>/` (git-ignored except `curated/`). Curated projects set `gallery: []` and `video:` in frontmatter. Rendered by `ProjectGallery.tsx` (thumbnail grid + dependency-free lightbox) and `ProjectVideo.tsx` (YouTube/Vimeo iframe or native `<video>`) on the detail page.

### Measurement charts
`fetchMeasurements` pulls `.csv` files from a repo's `measurements/`/`data/` folder into `public/media/<repo>/`; curated projects set a `measurements:` frontmatter array (`Measurement` in `src/lib/projects/types.ts`). `MeasurementChart.tsx` draws a dependency-free multi-series SVG line chart (first CSV column = X, rest = Y series) with crosshair+tooltip, legend, table-view toggle, and a **CVD-validated categorical palette** (validated per the dataviz skill for both light `#fcfcfb` and dark `#1a1a19` surfaces; light has a contrast WARN relieved by the legend + table view). Dark-mode series steps come from `next-themes` `resolvedTheme`, not an auto-flip.

### Conventions
- Reference files/lines as clickable markdown links (`[file.tsx:42](path#L42)`), not backticks (see repo `.md` conventions).
- `Date.now()` / non-deterministic values are fine in app code but the workflow/scripts avoid them where reproducibility matters.
- Env: `GITHUB_TOKEN*` (build-time GitHub fetch), `KICAD_CLI` (override kicad-cli path for `pcb:render`), `NEXT_PUBLIC_SITE_URL` (canonical URLs / feeds).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
