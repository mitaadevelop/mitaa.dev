# Project template

Two ways to get a project onto mitaa.dev:

| Template | Use it for | Copy to |
| --- | --- | --- |
| [repo/](repo/) | A GitHub repo that should show up as a full project page — **the default** | the root of the new repo |
| [curated.md](curated.md) | A hand-written project page (rarely needed — see the end of this page) | `content/projects/<slug>.md` |

There is no preview of [repo/](repo/) on the dev site: its `PCB/`, `images/` and `measurements/` folders are empty placeholders. Copy it into a GitHub repo, add your files and redeploy.

Everything below describes what `scripts/fetch-github-data.mjs` looks for. Folder names and file names are the interface: get them right and the page assembles itself on the next build.

## The layout

```
my-project/
├── README.md               ← shown only if project/ has no markdown
├── project/                ← documentation tab(s) on the site — lowercase!
│   ├── overview.md         ← always the first tab
│   ├── architecture.md     ← further tabs, alphabetical; tab label = file name
│   ├── getting-started.md
│   ├── datasheet.pdf       ← every .pdf (any depth) becomes a PDF tab
│   └── demo.mp4            ← the shallowest .mp4/.webm becomes the demo video
├── PCB/                    ← hardware viewer (or project/PCB/)
│   ├── my-project.kicad_pro
│   ├── my-project.kicad_sch    ← root sheet = shallowest .kicad_sch
│   ├── power.kicad_sch         ← hierarchical sub-sheets are all picked up
│   ├── my-project.kicad_pcb
│   ├── my-project.step         ← board 3D model, converted to .glb at build
│   ├── bom.csv                 ← file name must contain "bom"
│   └── img/                    ← output of `npm run pcb:render` (commit it!)
│       ├── schematic.svg
│       ├── pcb-top.svg
│       ├── pcb-bottom.svg
│       └── pcb-xray.svg
├── images/                 ← photo gallery (or media/ gallery/ photos/)
│   ├── 01-assembled-board.jpg
│   └── 02-scope-capture.png
├── measurements/           ← line charts (or data/)
│   └── step-response.csv
└── package.json | Cargo.toml | requirements.txt | go.mod   ← dependency list
```

Every part is optional. A repo with only a README still gets a page; each folder you add switches on one more section.

## GitHub settings (not files, but they fill the page header)

| Setting | Becomes |
| --- | --- |
| Visibility **public**, not a fork, not archived | Otherwise the repo is skipped entirely |
| Repo name `my-cool-project` | Title "My Cool Project", URL `/projects/my-cool-project` |
| About → **Description** | Subtitle and the text on the project card |
| About → **Website** | "Demo" button |
| About → **Topics** | Category + tech-stack chips (first 5 topics) |
| **License** | License badge |
| **Releases** | Release tag next to the title |

The category comes from the topics first, the main language second:

| Topic contains | Category |
| --- | --- |
| `embedded` `firmware` `stm32` `esp32` `rtos` | Embedded |
| `iot` `mqtt` `smart-home` | IoT |
| `machine-learning` `ml` `ai` `tensorflow` `pytorch` | ML |
| `devops` `docker` `ci-cd` `kubernetes` | DevOps |
| `cli` `tool` `devtool` | Tools |
| none of the above | language: C/C++ → Embedded, Rust, Python, TS/JS → Web, else Other |

## Rules per folder

**`project/` — documentation**
- Must be lowercase `project/` for markdown. (PDFs and video also accept `Project/`, markdown does not.)
- `overview.md` is always tab 1, then `readme.md`, then the rest alphabetically by path. The tab label is the file name without extension, so name files the way you want the tab to read — `power-budget.md`, not `03_pwr.md`.
- Relative links and images in the markdown work; they are rewritten to point at GitHub.
- **Diagrams**: a fenced block marked `mermaid` is drawn as an SVG when the site is built (by [pele](https://pele.run); light and dark theme, the Mermaid text behind "Show diagram source"). [repo/project/architecture.md](repo/project/architecture.md) has a flowchart, an `architecture-beta` system diagram and a sequence diagram to copy. A typo shows the error and the source on the page, never a failed build. The same goes for a README and a curated page.
- Max 40 markdown files, each under 200 KB.
- PDFs: max 12 per repo, 25 MB each, 60 MB total. The tab label is the file name with `-`/`_` turned into spaces.
- Video: one `.mp4`/`.webm`, max 60 MB. For anything bigger, put it on YouTube and use a curated page.

**`PCB/` — hardware viewer** (either `PCB/` at the root or `project/PCB/`)
- **Pre-rendered images win over the live KiCanvas view.** Vercel has no kicad-cli, so run `npm run pcb:render PCB/my-project.kicad_pcb PCB/my-project.kicad_sch` locally and commit the `img/` folder. Matched by name: `*schematic*`, `pcb-top`/`*-top-*`, `pcb-bottom`/`*-bottom-*`, `*xray*`/`*x-ray*`.
- 3D model: a `.step` is preferred and converted to `.glb`; otherwise an existing `.glb`/`.gltf` is used. Names containing `board`, `assembly`, `pcb` or the repo name win. Anything inside `3d/`, `models/`, `packages3d/`, `*.3dshapes/` or `*.pretty/` is treated as a component library and ignored.
- BOM: the shallowest `.csv` whose file name contains `bom`.
- Ignored: anything matching `-bak`, `-backups`, `_autosave`, `-cache`, `backups/`.
- Limits: schematic/board 25 MB, STEP 60 MB, GLB 40 MB, BOM 5 MB.

**`images/` — gallery**
- Matched **anywhere** in the repo: any folder named `images/`, `media/`, `gallery/` or `photos/`. Keep app assets (logos, icons, UI sprites) in a differently named folder such as `assets/`, or they end up in the gallery.
- Sorted naturally by path, max 24 images, 8 MB each, `png jpg webp gif avif`. Prefix with `01-`, `02-` to control the order.

**`measurements/` — charts**
- Also matched **anywhere**: any `measurements/` or `data/` folder. Test fixtures in `src/data/*.csv` would become charts too — keep those somewhere else.
- Max 12 CSVs, 5 MB each. The first column is the X axis, every other column a series; the header row supplies the axis label and legend, so put the unit in it:
  ```csv
  time_ms,setpoint_V,output_V
  0,0,0
  1,3.3,0.42
  ```
- The chart title is the file name with `-`/`_` turned into spaces.

**Dependencies** — read from the repo root: `package.json` (`dependencies` only), `Cargo.toml` (or `src-tauri/Cargo.toml`), `requirements.txt`, `go.mod`. Max 40.

## When the page updates

Repo data is fetched at **build time**. Push to the repo, then redeploy the site (or wait for the next deploy). A brand-new repo already gets a basic page (description + README) before that, through a live fallback, but the docs, PDFs, PCB, gallery and charts only appear after a build.

## GitHub repo or curated page?

A curated file in `content/projects/` with the same slug or the same `github:` URL **replaces** the GitHub page completely: the docs, PDFs, PCB files, gallery, charts, commits and contributors from the repo are no longer shown, and you have to set them all in frontmatter yourself. So:

- **Default: let the repo be the source.** Put the story in `project/overview.md`.
- Use [curated.md](curated.md) only for something that has no public repo, or that needs `featured: true`, a cover image or the `context` / `role` / `goal` / `features` fields that a repo cannot provide.
