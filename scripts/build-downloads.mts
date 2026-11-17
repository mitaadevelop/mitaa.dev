/**
 * npm run downloads:build [-- <name> …]
 *
 * Builds the free downloads in the shop into public/downloads/:
 *
 * - every LaTeX template in content/shop/latex-templates/<slug>/: compiled
 *   with latexmk into an example PDF, its preview pages rendered to PNG, and
 *   its sources (plus a generated README.txt) zipped;
 * - the LaTeX cheat sheet in content/shop/latex-cheatsheet/: compiled to a
 *   PDF, both pages rendered to PNG;
 * - the Signal No. 01 wallpaper pack, zipped from the git-ignored
 *   private-products/signal-no-01/delivery/Signal-No-01/ when it is present.
 *
 * Pass names (essay, report, research, cheatsheet, signal-no-01) to build
 * only those.
 *
 * The output is committed, like the blog PDFs from blog:check --publish: it
 * runs locally, because there is no TeX on Vercel. It is reproducible — a fixed
 * date for LaTeX and fixed timestamps in the ZIPs — so rebuilding unchanged
 * sources leaves git clean. Needs latexmk (with biber), pdftoppm and zip on
 * the PATH, or LATEXMK / PDFTOPPM / ZIP.
 */
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  latexCheatsheet,
  latexTemplates,
  TEMPLATE_LICENSE,
  templateFiles,
  type LatexTemplate,
} from "../src/data/latex-templates.ts";
import { shopProduct } from "../src/data/shop.ts";
import { SITE_URL } from "../src/lib/site.ts";

const LATEXMK = process.env.LATEXMK || "latexmk";
const PDFTOPPM = process.env.PDFTOPPM || "pdftoppm";
const ZIP = process.env.ZIP || "zip";

/** The date LaTeX prints for \today and stamps into the PDFs and ZIPs. */
const BUILD_DATE = new Date("2026-10-01T00:00:00Z");

const root = process.cwd();
const publicDir = path.join(root, "public");
const templatesDir = path.join(root, "content/shop/latex-templates");
const cheatsheetDir = path.join(root, "content/shop/latex-cheatsheet");
const wallpaperDir = path.join(root, "private-products/signal-no-01/delivery/Signal-No-01");

const only = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const wanted = (name: string) => only.length === 0 || only.includes(name);

const work = mkdtempSync(path.join(tmpdir(), "mitaa-downloads-"));
// Biber unpacks itself into a cache that can go stale between TeX Live
// updates ("failed to find unicore/version"); a fresh one per run avoids it.
const parCache = path.join(work, "par");
mkdirSync(parCache);

/** Every file under `dir`, relative to it, sorted so ZIPs list them in a fixed order. */
function listFiles(dir: string, prefix = ""): string[] {
  return readdirSync(path.join(dir, prefix), { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .flatMap((entry) => {
      const rel = path.join(prefix, entry.name);
      return entry.isDirectory() ? listFiles(dir, rel) : [rel];
    })
    .sort();
}

/** Zip `files` (relative to `cwd`) into `out` with fixed timestamps and no extra attributes. */
function zipFiles(cwd: string, files: string[], out: string) {
  for (const file of files) utimesSync(path.join(cwd, file), BUILD_DATE, BUILD_DATE);
  rmSync(out, { force: true });
  mkdirSync(path.dirname(out), { recursive: true });
  execFileSync(ZIP, ["-X", "-D", "-q", "-9", out, ...files], { cwd });
}

/** `text` broken into lines of at most `width` characters, each indented. */
function wrap(text: string, indent = "  ", width = 72): string {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && indent.length + line.length + 1 + word.length > width) {
      lines.push(indent + line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  return [...lines, indent + line].join("\n");
}

/**
 * Compile main.tex from `source` in a scratch copy, so no build files land next
 * to the sources, and copy the PDF to `pdfUrl` under public/.
 */
function compile(name: string, source: string, pdfUrl: string): string {
  if (!existsSync(path.join(source, "main.tex"))) {
    throw new Error(`${name}: no main.tex in ${path.relative(root, source)}`);
  }
  const build = path.join(work, name);
  cpSync(source, build, { recursive: true });
  try {
    execFileSync(LATEXMK, ["-pdf", "-interaction=nonstopmode", "-halt-on-error", "main.tex"], {
      cwd: build,
      stdio: "pipe",
      env: {
        ...process.env,
        PAR_GLOBAL_TEMP: parCache,
        SOURCE_DATE_EPOCH: String(BUILD_DATE.getTime() / 1000),
        FORCE_SOURCE_DATE: "1",
      },
    });
  } catch {
    throw new Error(`${name}: LaTeX failed; see ${path.join(build, "main.log")}`);
  }
  const pdf = path.join(publicDir, pdfUrl);
  mkdirSync(path.dirname(pdf), { recursive: true });
  copyFileSync(path.join(build, "main.pdf"), pdf);
  return pdf;
}

/** Render `pages` of `pdf` to the PNGs at `urls`, 900 pixels wide. */
function renderPreviews(pdf: string, pages: readonly number[], urls: readonly string[], width = 900) {
  pages.forEach((page, i) => {
    const out = path.join(publicDir, urls[i]).replace(/\.png$/, "");
    execFileSync(PDFTOPPM, [
      "-png", "-singlefile", "-f", String(page), "-l", String(page),
      "-scale-to-x", String(width), "-scale-to-y", "-1", pdf, out,
    ]);
  });
}

const size = (url: string) => `${Math.round(statSync(path.join(publicDir, url)).size / 1024)} kB`;

const readme = (template: LatexTemplate) => `${template.title.en} — LaTeX template by mitaa.dev

CONTENTS
  main.tex         the text; fill in your details at the top
  setup.tex        the styling: font, colour and margins
  references.bib   your sources, in APA 7 style

IN OVERLEAF
  Go to overleaf.com, choose New Project > Upload Project and select
  this ZIP file. Overleaf compiles it straight away.

LOCALLY
  Install MacTeX, TeX Live or MiKTeX and run:
    latexmk -pdf main.tex
  latexmk runs Biber for the references by itself.
${template.slug === "essay" ? "" : `
IMAGES
  Put your images in a figures/ folder next to main.tex and include
  them with \\includegraphics{name}.
`}
LICENSE
${wrap(TEMPLATE_LICENSE.en)}

A two-page LaTeX cheat sheet and more templates:
  ${SITE_URL}/shop/latex-templates
`;

function buildTemplate(template: LatexTemplate) {
  const source = path.join(templatesDir, template.slug);
  const files = templateFiles(template);
  const pdf = compile(template.slug, source, files.pdf);
  renderPreviews(pdf, template.previewPages, files.previews);

  // The ZIP holds the sources at its root, as Overleaf expects, plus a README.
  const stage = path.join(work, `${template.slug}-zip`);
  cpSync(source, stage, { recursive: true });
  writeFileSync(path.join(stage, "README.txt"), readme(template));
  zipFiles(stage, listFiles(stage), path.join(publicDir, files.zip));

  console.log(`✓ ${template.slug}  zip ${size(files.zip)} · pdf ${size(files.pdf)}`);
}

function buildCheatsheet() {
  const { files } = latexCheatsheet;
  const pdf = compile("cheatsheet", cheatsheetDir, files.pdf);
  // Landscape pages: render them wider than the portrait templates.
  renderPreviews(pdf, [1, 2], files.previews, 1400);
  console.log(`✓ cheatsheet  pdf ${size(files.pdf)}`);
}

function buildWallpapers() {
  const { id, file } = shopProduct.download;
  if (!existsSync(wallpaperDir)) {
    console.log(`– ${id}: ${path.relative(root, wallpaperDir)} not found, skipped`);
    return;
  }
  // Keep the pack in its own folder inside the ZIP, as delivered.
  const stage = path.join(work, id);
  const folder = path.basename(wallpaperDir);
  cpSync(wallpaperDir, path.join(stage, folder), { recursive: true });
  const files = listFiles(stage);
  for (const dir of new Set(files.map((f) => path.dirname(f)))) {
    utimesSync(path.join(stage, dir), BUILD_DATE, BUILD_DATE);
  }
  zipFiles(stage, files, path.join(publicDir, file));
  console.log(`✓ ${id}  ${Math.round(statSync(path.join(publicDir, file)).size / 1024 / 1024)} MB`);
}

try {
  for (const template of latexTemplates) {
    if (wanted(template.slug)) buildTemplate(template);
  }
  if (wanted("cheatsheet")) buildCheatsheet();
  if (wanted(shopProduct.download.id)) buildWallpapers();
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exitCode = 1;
} finally {
  if (process.exitCode !== 1) rmSync(work, { recursive: true, force: true });
}
