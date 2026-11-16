#!/usr/bin/env node
/**
 * Pre-build script that fetches GitHub data and writes it to public/data/.
 * This allows the static site to include live GitHub data without API routes.
 *
 * Run manually:   node scripts/fetch-github-data.mjs
 * Or via npm:     npm run prebuild
 */

import fs from "node:fs";
import path from "node:path";
import { convertStepToGlb } from "./step-to-glb.mjs";

const GITHUB_USERNAME = "mitaadevelop";
/** Folder whose markdown files are shown (switchable) on a project page. */
const DOCS_FOLDER = "project";
const CONTRIBUTIONS_TOKEN =
  process.env.GITHUB_TOKEN_CONTRIBUTIONS || process.env.GITHUB_TOKEN;
const REPOS_TOKEN =
  process.env.GITHUB_TOKEN_PUBLIC_REPO || process.env.GITHUB_TOKEN;

const OUT_DIR = path.join(process.cwd(), "public", "data");

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function fetchContributions() {
  if (!CONTRIBUTIONS_TOKEN) {
    console.warn(
      "⚠️  GITHUB_TOKEN_CONTRIBUTIONS not set. Skipping contributions fetch."
    );
    return null;
  }

  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CONTRIBUTIONS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { username: GITHUB_USERNAME },
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const calendar = data.data.user.contributionsCollection.contributionCalendar;

    return {
      totalContributions: calendar.totalContributions,
      weeks: calendar.weeks,
    };
  } catch (error) {
    console.error("❌ Failed to fetch contributions:", error.message);
    return null;
  }
}

async function fetchLanguages(repoName) {
  const headers = { Accept: "application/vnd.github+json" };
  if (REPOS_TOKEN) {
    headers.Authorization = `Bearer ${REPOS_TOKEN}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/languages`,
      { headers }
    );
    if (!response.ok) return {};
    return await response.json(); // { "Rust": 12345, "TypeScript": 678 }
  } catch {
    return {};
  }
}

async function fetchReadme(repoName) {
  const headers = {
    // Raw media type returns the README as plain markdown text.
    Accept: "application/vnd.github.raw+json",
  };
  if (REPOS_TOKEN) {
    headers.Authorization = `Bearer ${REPOS_TOKEN}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/readme`,
      { headers }
    );
    if (!response.ok) return null; // 404 = repo has no README
    return await response.text();
  } catch {
    return null;
  }
}

/** Shared authenticated fetch against the GitHub REST API. */
async function ghFetch(url, accept = "application/vnd.github+json") {
  const headers = { Accept: accept };
  if (REPOS_TOKEN) headers.Authorization = `Bearer ${REPOS_TOKEN}`;
  return fetch(url, { headers });
}

async function fetchContributors(repoName) {
  try {
    const res = await ghFetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/contributors?per_page=12`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : [])
      .filter((c) => c.type === "User")
      .map((c) => ({
        login: c.login,
        avatar_url: c.avatar_url,
        html_url: c.html_url,
        contributions: c.contributions,
      }));
  } catch {
    return [];
  }
}

async function fetchCommits(repoName) {
  try {
    const res = await ghFetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/commits?per_page=5`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map((c) => ({
      sha: (c.sha || "").slice(0, 7),
      message: (c.commit?.message || "").split("\n")[0],
      date: c.commit?.author?.date || c.commit?.committer?.date || null,
      html_url: c.html_url,
      author_login: c.author?.login || c.commit?.author?.name || null,
      author_avatar: c.author?.avatar_url || null,
    }));
  } catch {
    return [];
  }
}

async function fetchLatestRelease(repoName) {
  try {
    const res = await ghFetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/releases/latest`
    );
    if (!res.ok) return null; // 404 = no releases
    const r = await res.json();
    return {
      tag_name: r.tag_name,
      name: r.name || null,
      published_at: r.published_at || null,
      html_url: r.html_url,
    };
  } catch {
    return null;
  }
}

/** Read a single file from the repo (raw text), or null if it doesn't exist. */
async function fetchFile(repoName, filePath) {
  const encoded = filePath.split("/").map(encodeURIComponent).join("/");
  try {
    const res = await ghFetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/contents/${encoded}`,
      "application/vnd.github.raw+json"
    );
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Fetch the repo's recursive git tree once; returns the blob/tree entries (or []). */
async function fetchTree(repoName, branch) {
  try {
    const res = await ghFetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/git/trees/${branch || "HEAD"}?recursive=1`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.tree) ? data.tree : [];
  } catch {
    return [];
  }
}

/**
 * From a pre-fetched git tree, take the markdown files inside DOCS_FOLDER and
 * fetch their contents. Returns [] if the folder has none, in which case the
 * caller falls back to the repo's README.
 */
async function fetchMarkdownFiles(repoName, tree) {
  const MARKDOWN = /\.(md|markdown|mdoc)$/i;
  const folderPrefix = `${DOCS_FOLDER}/`;

  const files = tree
    .filter(
      (t) =>
        t.type === "blob" &&
        t.path.startsWith(folderPrefix) &&
        MARKDOWN.test(t.path) &&
        (t.size ?? 0) < 200000
    )
    .slice(0, 40);

  const withContent = await Promise.all(
    files.map(async (f) => ({
      path: f.path,
      content: await fetchFile(repoName, f.path),
    }))
  );
  return withContent.filter((f) => f.content && f.content.trim());
}

// --- Interactive PCB assets (schematic / board / 3D) pulled straight from the repo ---

const PUBLIC_PCB_DIR = path.join(process.cwd(), "public", "pcb");
const PUBLIC_DOCS_DIR = path.join(process.cwd(), "public", "docs");
/**
 * Where hardware files live in a repo: a `PCB/` folder at the repo root, or a
 * `PCB/` folder inside the `project/` docs folder. Either way its files are
 * combined with the `project/` documentation on the same project page.
 */
const PCB_ROOT = new RegExp(`^(pcb|${DOCS_FOLDER}/pcb)/`, "i");
/** Backup / auto-save / cache artifacts we never want to surface. */
const PCB_BACKUP = /(-bak|-backups?|_autosave|_saved|-cache|\/backups?\/)/i;
/** Directories that hold per-footprint 3D models, not a whole-board model. */
const COMPONENT_MODEL_DIR =
  /(^|\/)(3d|3dmodels|3d_models|models|packages3d|shapes3d)(\/|$)|\.3dshapes\/|\.pretty\//i;

/** Download a repo blob (binary-safe) to a local file. Returns the byte length. */
async function downloadRepoFile(repoName, branch, repoPath, destPath) {
  const encoded = repoPath.split("/").map(encodeURIComponent).join("/");
  const url = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${repoName}/${branch || "HEAD"}/${encoded}`;
  const headers = {};
  if (REPOS_TOKEN) headers.Authorization = `Bearer ${REPOS_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`download ${res.status} for ${repoPath}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
  return buf.length;
}

/** Pick the shortest-path blob matching `extRe`, under `maxBytes`, excluding backups. */
function pickShortest(tree, extRe, maxBytes) {
  return (
    tree
      .filter(
        (t) =>
          t.type === "blob" &&
          extRe.test(t.path) &&
          !PCB_BACKUP.test(t.path) &&
          (t.size ?? 0) <= maxBytes
      )
      .sort(
        (a, b) => a.path.split("/").length - b.path.split("/").length || a.path.length - b.path.length
      )[0]?.path ?? null
  );
}

/** Choose the whole-board 3D model: skip component-library dirs, prefer board-like names. */
function pickBoardModel(tree, repoName, extRe, maxBytes) {
  const repoKey = repoName.toLowerCase().replace(/[-_]/g, "");
  const cands = tree.filter(
    (t) =>
      t.type === "blob" &&
      extRe.test(t.path) &&
      !PCB_BACKUP.test(t.path) &&
      !COMPONENT_MODEL_DIR.test(t.path) &&
      (t.size ?? 0) <= maxBytes
  );
  const score = (p) => {
    const base = p.toLowerCase();
    let s = p.split("/").length; // shallower = better
    if (/(board|assembly|pcb)/.test(base)) s -= 5;
    if (base.replace(/[-_]/g, "").includes(repoKey)) s -= 5;
    return s;
  };
  return cands.sort((a, b) => score(a.path) - score(b.path))[0]?.path ?? null;
}

/**
 * Detect a KiCad schematic + board and a 3D model (STEP → converted to GLB, else
 * an existing GLB/glTF) inside the repo's top-level `PCB/` folder, download them
 * into /public/pcb/<repo>/ with their repo-relative structure preserved (so
 * hierarchical sheets resolve), and return the public web paths. Returns null if
 * the repo has no `PCB/` folder or it contains no recognised hardware files.
 */
async function fetchPcbAssets(repoName, tree, branch) {
  const MB = 1024 * 1024;
  // Convention: all hardware files live in a `PCB/` folder (root, or under project/).
  const pcbTree = tree.filter((t) => PCB_ROOT.test(t.path));
  if (!pcbTree.length) return null;

  // All schematic sheets (hierarchical designs reference sibling .kicad_sch files).
  const schPaths = pcbTree
    .filter((t) => t.type === "blob" && /\.kicad_sch$/i.test(t.path) && !PCB_BACKUP.test(t.path) && (t.size ?? 0) <= 25 * MB)
    .map((t) => t.path);
  const pcbPath = pickShortest(pcbTree, /\.kicad_pcb$/i, 25 * MB);
  const stepPath = pickBoardModel(pcbTree, repoName, /\.(step|stp)$/i, 60 * MB);
  const glbPath = stepPath ? null : pickBoardModel(pcbTree, repoName, /\.(glb|gltf)$/i, 40 * MB);
  // A BOM: a .csv whose filename mentions "bom".
  const bomPath = pcbTree
    .filter(
      (t) =>
        t.type === "blob" &&
        /\.csv$/i.test(t.path) &&
        /bom/i.test(t.path.split("/").pop()) &&
        !PCB_BACKUP.test(t.path) &&
        (t.size ?? 0) <= 5 * MB,
    )
    .sort((a, b) => a.path.split("/").length - b.path.split("/").length || a.path.length - b.path.length)[0]
    ?.path ?? null;

  const hasImages = pcbTree.some((t) => t.type === "blob" && /\.(svg|png)$/i.test(t.path));
  if (!schPaths.length && !pcbPath && !stepPath && !glbPath && !bomPath && !hasImages) return null;

  const outDir = path.join(PUBLIC_PCB_DIR, repoName);
  const web = (repoRelative) => `/pcb/${repoName}/${repoRelative}`;
  const assets = {};

  try {
    if (schPaths.length) {
      for (const p of schPaths) await downloadRepoFile(repoName, branch, p, path.join(outDir, p));
      // The .kicad_pro (if any) gives KiCanvas the project settings + page order.
      const proPath = pickShortest(pcbTree, /\.kicad_pro$/i, 5 * MB);
      const sources = [];
      if (proPath) {
        await downloadRepoFile(repoName, branch, proPath, path.join(outDir, proPath));
        sources.push(proPath);
      }
      sources.push(...schPaths);
      // Root sheet = the shallowest schematic path.
      const root = [...schPaths].sort(
        (a, b) => a.split("/").length - b.split("/").length || a.length - b.length
      )[0];
      assets.schematic = web(root);
      assets.schematicSheets = sources.map(web);
    }
    if (pcbPath) {
      await downloadRepoFile(repoName, branch, pcbPath, path.join(outDir, pcbPath));
      assets.board = web(pcbPath);
    }
    if (stepPath) {
      const localStep = path.join(outDir, stepPath);
      await downloadRepoFile(repoName, branch, stepPath, localStep);
      const glbRel = stepPath.replace(/\.(step|stp)$/i, ".glb");
      await convertStepToGlb(localStep, path.join(outDir, glbRel));
      assets.model3d = web(glbRel);
    } else if (glbPath) {
      await downloadRepoFile(repoName, branch, glbPath, path.join(outDir, glbPath));
      assets.model3d = web(glbPath);
    }
    if (bomPath) {
      await downloadRepoFile(repoName, branch, bomPath, path.join(outDir, bomPath));
      assets.bom = web(bomPath);
    }
    // Diode-style pre-rendered images committed in the PCB/ folder take precedence
    // over the live KiCanvas view (Vercel can't run kicad-cli, so images must exist).
    const findImg = (re) =>
      pcbTree
        .filter((t) => t.type === "blob" && /\.(svg|png)$/i.test(t.path) && re.test(t.path.split("/").pop()))
        .sort((a, b) => a.path.split("/").length - b.path.split("/").length || a.path.length - b.path.length)[0]
        ?.path ?? null;
    const imgFields = {
      schematicImage: findImg(/schematic/i),
      pcbImage: findImg(/pcb[-_]?top|(^|[-_])top([-_]|\.)/i),
      pcbBackImage: findImg(/pcb[-_]?bottom|(^|[-_])bottom([-_]|\.)/i),
      pcbXrayImage: findImg(/x[-_]?ray/i),
    };
    for (const [key, p] of Object.entries(imgFields)) {
      if (p) {
        await downloadRepoFile(repoName, branch, p, path.join(outDir, p));
        assets[key] = web(p);
      }
    }
  } catch (err) {
    console.warn(`⚠️  PCB assets for ${repoName}: ${err.message}`);
  }

  return Object.keys(assets).length ? assets : null;
}

// --- PDF documents from the docs folder, shown as extra tabs next to the markdown ---

/** Any depth inside the `project/` folder; case-insensitive since repos use `Project/` too. */
const DOCS_ROOT = new RegExp(`^${DOCS_FOLDER}/`, "i");
const PDF_MAX_BYTES = 25 * 1024 * 1024; // per file
const PDF_MAX_TOTAL = 60 * 1024 * 1024; // per repo
const PDF_MAX_COUNT = 12;

/** Turn "project/specs/power-budget.pdf" into "power budget". */
function pdfLabel(p) {
  const base = (p.split("/").pop() ?? p).replace(/\.pdf$/i, "");
  return base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() || "PDF";
}

/**
 * Download every .pdf inside the repo's `project/` folder (sub-folders included,
 * `project/PCB/` excluded — that subtree belongs to the hardware viewer) into
 * /public/docs/<repo>/ with the repo-relative structure preserved, and return the
 * public web paths. They surface as extra tabs next to the markdown docs.
 */
async function fetchPdfDocs(repoName, tree, branch) {
  const candidates = tree
    .filter(
      (t) =>
        t.type === "blob" &&
        DOCS_ROOT.test(t.path) &&
        /\.pdf$/i.test(t.path) &&
        !PCB_ROOT.test(t.path) &&
        !PCB_BACKUP.test(t.path) &&
        (t.size ?? 0) <= PDF_MAX_BYTES
    )
    .sort(
      (a, b) => a.path.split("/").length - b.path.split("/").length || a.path.localeCompare(b.path)
    )
    .slice(0, PDF_MAX_COUNT);
  if (!candidates.length) return null;

  const outDir = path.join(PUBLIC_DOCS_DIR, repoName);
  // Unlike the PCB assets, PDF exports routinely contain spaces (and a `#` would
  // truncate the URL), so every segment is encoded for the public path.
  const web = (repoRelative) =>
    `/docs/${encodeURIComponent(repoName)}/${repoRelative.split("/").map(encodeURIComponent).join("/")}`;

  const docs = [];
  let total = 0;
  for (const t of candidates) {
    const size = t.size ?? 0;
    if (total + size > PDF_MAX_TOTAL) break;
    try {
      // One bad blob shouldn't cost us the rest of the repo's documents.
      await downloadRepoFile(repoName, branch, t.path, path.join(outDir, t.path));
      total += size;
      docs.push({ src: web(t.path), path: t.path, label: pdfLabel(t.path), size });
    } catch (err) {
      console.warn(`⚠️  PDF ${t.path} for ${repoName}: ${err.message}`);
    }
  }

  return docs.length ? docs : null;
}

// --- Media: photo gallery + demo video ---

const PUBLIC_MEDIA_DIR = path.join(process.cwd(), "public", "media");
/** Gallery images live in an `images/`, `media/`, `gallery/` or `photos/` folder. */
const GALLERY_ROOT = /(^|\/)(images|media|gallery|photos)\//i;
const IMG_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;
const VIDEO_EXT = /\.(mp4|webm)$/i;
const IMG_MAX_BYTES = 8 * 1024 * 1024;
const GALLERY_MAX_COUNT = 24;
const VIDEO_MAX_BYTES = 60 * 1024 * 1024;

/** Download real photos/screenshots from a media folder into /public/media/<repo>/. */
async function fetchGallery(repoName, tree, branch) {
  const imgs = tree
    .filter(
      (t) =>
        t.type === "blob" &&
        GALLERY_ROOT.test(t.path) &&
        IMG_EXT.test(t.path) &&
        !PCB_ROOT.test(t.path) &&
        !PCB_BACKUP.test(t.path) &&
        (t.size ?? 0) <= IMG_MAX_BYTES,
    )
    .sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }))
    .slice(0, GALLERY_MAX_COUNT);
  if (!imgs.length) return null;

  const outDir = path.join(PUBLIC_MEDIA_DIR, repoName);
  const web = (repoRelative) =>
    `/media/${encodeURIComponent(repoName)}/${repoRelative.split("/").map(encodeURIComponent).join("/")}`;

  const paths = [];
  for (const t of imgs) {
    try {
      await downloadRepoFile(repoName, branch, t.path, path.join(outDir, t.path));
      paths.push(web(t.path));
    } catch (err) {
      console.warn(`⚠️  gallery ${t.path} for ${repoName}: ${err.message}`);
    }
  }
  return paths.length ? paths : null;
}

/** Find a demo video (.mp4/.webm) in the project/ folder and download it. */
async function fetchVideo(repoName, tree, branch) {
  const vid = tree
    .filter(
      (t) =>
        t.type === "blob" &&
        DOCS_ROOT.test(t.path) &&
        VIDEO_EXT.test(t.path) &&
        !PCB_ROOT.test(t.path) &&
        (t.size ?? 0) <= VIDEO_MAX_BYTES,
    )
    .sort((a, b) => a.path.split("/").length - b.path.split("/").length || a.path.localeCompare(b.path))[0];
  if (!vid) return null;

  const outDir = path.join(PUBLIC_MEDIA_DIR, repoName);
  try {
    await downloadRepoFile(repoName, branch, vid.path, path.join(outDir, vid.path));
    return `/media/${encodeURIComponent(repoName)}/${vid.path.split("/").map(encodeURIComponent).join("/")}`;
  } catch (err) {
    console.warn(`⚠️  video ${vid.path} for ${repoName}: ${err.message}`);
    return null;
  }
}

/** Measurement CSVs live in a `measurements/` or `data/` folder (not the PCB BOM). */
const MEASUREMENTS_ROOT = /(^|\/)(measurements|data)\//i;
const CSV_MAX_BYTES = 5 * 1024 * 1024;
const MEASUREMENTS_MAX_COUNT = 12;

/** Download measurement CSVs into /public/media/<repo>/ and return chart specs. */
async function fetchMeasurements(repoName, tree, branch) {
  const csvs = tree
    .filter(
      (t) =>
        t.type === "blob" &&
        MEASUREMENTS_ROOT.test(t.path) &&
        /\.csv$/i.test(t.path) &&
        !PCB_ROOT.test(t.path) &&
        !PCB_BACKUP.test(t.path) &&
        (t.size ?? 0) <= CSV_MAX_BYTES,
    )
    .sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }))
    .slice(0, MEASUREMENTS_MAX_COUNT);
  if (!csvs.length) return null;

  const outDir = path.join(PUBLIC_MEDIA_DIR, repoName);
  const web = (repoRelative) =>
    `/media/${encodeURIComponent(repoName)}/${repoRelative.split("/").map(encodeURIComponent).join("/")}`;
  const title = (p) => p.split("/").pop().replace(/\.csv$/i, "").replace(/[-_]/g, " ");

  const out = [];
  for (const t of csvs) {
    try {
      await downloadRepoFile(repoName, branch, t.path, path.join(outDir, t.path));
      out.push({ src: web(t.path), title: title(t.path) });
    } catch (err) {
      console.warn(`⚠️  measurement ${t.path} for ${repoName}: ${err.message}`);
    }
  }
  return out.length ? out : null;
}

/** Extract dependency names from a Cargo.toml [dependencies] table. */
function parseCargoDeps(content) {
  const names = new Set();
  let inSection = false;
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("[")) {
      const header = line.replace(/[[\]]/g, "").trim();
      if (header === "dependencies") {
        inSection = true;
      } else if (header.startsWith("dependencies.")) {
        names.add(header.slice("dependencies.".length).split(".")[0]);
        inSection = false;
      } else {
        inSection = false;
      }
      continue;
    }
    if (inSection && line && !line.startsWith("#")) {
      const name = line.split("=")[0].trim();
      if (name) names.add(name);
    }
  }
  return [...names];
}

/** Extract module paths from a go.mod require block. */
function parseGoMod(content) {
  const names = [];
  let inBlock = false;
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("require (")) {
      inBlock = true;
      continue;
    }
    if (inBlock && line === ")") {
      inBlock = false;
      continue;
    }
    if (inBlock && line && !line.startsWith("//")) {
      names.push(line.split(/\s+/)[0]);
    } else if (line.startsWith("require ") && !line.includes("(")) {
      names.push(line.replace("require ", "").split(/\s+/)[0]);
    }
  }
  return names;
}

/** Build a deduped dependency list from the repo's manifest files. */
function parseDependencies(files) {
  const deps = [];
  const push = (name, ecosystem) => {
    const trimmed = (name || "").trim();
    if (trimmed && !deps.some((d) => d.name === trimmed && d.ecosystem === ecosystem)) {
      deps.push({ name: trimmed, ecosystem });
    }
  };

  if (files["package.json"]) {
    try {
      const pkg = JSON.parse(files["package.json"]);
      for (const name of Object.keys(pkg.dependencies || {})) push(name, "npm");
    } catch {
      /* malformed package.json */
    }
  }
  if (files["Cargo.toml"]) {
    for (const name of parseCargoDeps(files["Cargo.toml"])) push(name, "cargo");
  }
  if (files["requirements.txt"]) {
    for (const raw of files["requirements.txt"].split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const name = line.split(/[=<>!~ ;[]/)[0].trim();
      if (name) push(name, "pypi");
    }
  }
  if (files["go.mod"]) {
    for (const name of parseGoMod(files["go.mod"])) push(name, "go");
  }

  return deps.slice(0, 40);
}

async function fetchRepos() {
  const headers = {
    Accept: "application/vnd.github+json",
  };

  if (REPOS_TOKEN) {
    headers.Authorization = `Bearer ${REPOS_TOKEN}`;
  }

  const repos = [];
  let page = 1;

  try {
    while (true) {
      const response = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}&sort=updated&type=public`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      repos.push(...data.filter((r) => !r.fork && !r.archived));

      if (data.length < 100) break;
      page++;
    }

    // Pick the fields we need, plus README, languages, contributors, commits,
    // the latest release, and dependencies parsed from manifest files.
    return await Promise.all(
      repos.map(async (r) => {
        // One recursive tree fetch feeds the docs list, the PDFs and PCB detection.
        const tree = await fetchTree(r.name, r.default_branch);
        const [
          readme,
          languages,
          contributors,
          commits,
          release,
          markdownFiles,
          pdfDocs,
          pcb,
          gallery,
          video,
          measurements,
          packageJson,
          cargoToml,
          requirementsTxt,
          goMod,
        ] = await Promise.all([
          fetchReadme(r.name),
          fetchLanguages(r.name),
          fetchContributors(r.name),
          fetchCommits(r.name),
          fetchLatestRelease(r.name),
          fetchMarkdownFiles(r.name, tree),
          fetchPdfDocs(r.name, tree, r.default_branch),
          fetchPcbAssets(r.name, tree, r.default_branch),
          fetchGallery(r.name, tree, r.default_branch),
          fetchVideo(r.name, tree, r.default_branch),
          fetchMeasurements(r.name, tree, r.default_branch),
          fetchFile(r.name, "package.json"),
          // Root Cargo.toml, or the Tauri convention under src-tauri/.
          fetchFile(r.name, "Cargo.toml").then(
            (c) => c ?? fetchFile(r.name, "src-tauri/Cargo.toml")
          ),
          fetchFile(r.name, "requirements.txt"),
          fetchFile(r.name, "go.mod"),
        ]);

        const dependencies = parseDependencies({
          "package.json": packageJson,
          "Cargo.toml": cargoToml,
          "requirements.txt": requirementsTxt,
          "go.mod": goMod,
        });

        return {
          name: r.name,
          description: r.description,
          html_url: r.html_url,
          homepage: r.homepage,
          language: r.language,
          topics: r.topics,
          stargazers_count: r.stargazers_count,
          forks_count: r.forks_count,
          created_at: r.created_at,
          updated_at: r.updated_at,
          default_branch: r.default_branch,
          license: r.license
            ? { spdx_id: r.license.spdx_id, name: r.license.name }
            : null,
          languages,
          contributors,
          commits,
          release,
          dependencies,
          markdownFiles,
          pdfDocs,
          pcb,
          gallery,
          video,
          measurements,
          readme,
        };
      })
    );
  } catch (error) {
    console.error("❌ Failed to fetch repos:", error.message);
    return null;
  }
}

async function main() {
  console.log("🔧 Fetching GitHub data for static export...\n");

  // Fetch contributions
  const contributions = await fetchContributions();
  if (contributions) {
    fs.writeFileSync(
      path.join(OUT_DIR, "github-contributions.json"),
      JSON.stringify(contributions, null, 2)
    );
    console.log(`✅ Contributions saved (${contributions.totalContributions} total)`);
  }

  // Fetch repos
  const repos = await fetchRepos();
  if (repos) {
    fs.writeFileSync(
      path.join(OUT_DIR, "github-repos.json"),
      JSON.stringify(repos, null, 2)
    );
    console.log(`✅ Repos saved (${repos.length} repos)`);
  }

  console.log("\n🎉 Done! GitHub data is ready for static build.");
}

main();
