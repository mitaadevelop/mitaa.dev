import fs from "node:fs";
import path from "node:path";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import type { MarkdownDoc, Measurement, PcbAssets, PdfDoc, Project, ProjectWithHtml } from "./types";

const GITHUB_USERNAME = "mitaadevelop";

/** Read pre-fetched GitHub repos from the static data file. */
export function readGitHubRepos() {
  const filePath = path.join(process.cwd(), "public", "data", "github-repos.json");
  return fs.existsSync(filePath)
    ? (JSON.parse(fs.readFileSync(filePath, "utf8")) as GitHubRepo[])
    : [];
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  created_at?: string;
  updated_at: string;
  fork: boolean;
  archived: boolean;
  default_branch?: string;
  license?: { spdx_id: string | null; name: string } | null;
  languages?: Record<string, number>;
  contributors?: {
    login: string;
    avatar_url: string;
    html_url: string;
    contributions: number;
  }[];
  commits?: {
    sha: string;
    message: string;
    date?: string | null;
    html_url: string;
    author_login?: string | null;
    author_avatar?: string | null;
  }[];
  release?: {
    tag_name: string;
    name?: string | null;
    published_at?: string | null;
    html_url: string;
  } | null;
  dependencies?: { name: string; ecosystem: string }[];
  markdownFiles?: { path: string; content: string | null }[];
  /** PDFs from the repo's project/ folder, downloaded into /public/docs/<repo>/. */
  pdfDocs?: PdfDoc[] | null;
  /** Interactive PCB assets pulled from the repo into /public/pcb/<repo>/. */
  pcb?: PcbAssets | null;
  /** Photo/screenshot paths pulled from the repo's media folder into /public/media/<repo>/. */
  gallery?: string[] | null;
  /** Demo video path pulled from the repo's project/ folder into /public/media/<repo>/. */
  video?: string | null;
  /** Measurement CSV charts pulled from the repo's measurements/ or data/ folder. */
  measurements?: Measurement[] | null;
  readme?: string | null;
}

/** GitHub's brand colors for common languages (fallback: neutral gray). */
const LANGUAGE_COLORS: Record<string, string> = {
  Rust: "#dea584",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Go: "#00ADD8",
  Java: "#b07219",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#663399",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Dart: "#00B4AB",
  Lua: "#000080",
  Zig: "#ec915c",
};

function languageColor(name: string): string {
  return LANGUAGE_COLORS[name] ?? "#8b949e";
}

/** Convert a raw languages byte-map to sorted percentage stats (top 6). */
function toLanguageStats(
  languages: Record<string, number> | undefined
): { name: string; percentage: number; color: string }[] {
  if (!languages) return [];
  const total = Object.values(languages).reduce((sum, n) => sum + n, 0);
  if (total === 0) return [];
  return Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, bytes]) => ({
      name,
      percentage: Math.round((bytes / total) * 1000) / 10,
      color: languageColor(name),
    }));
}

/** How long a live GitHub list/README fetch is cached (seconds) before re-checking. */
export const LIVE_REVALIDATE_SECONDS = 60;

/** Fetches all public repos for the configured user. Safe to call at request time. */
export async function fetchGitHubRepos(
  revalidate: number = LIVE_REVALIDATE_SECONDS,
): Promise<GitHubRepo[]> {
  const token = process.env.GITHUB_TOKEN_PUBLIC_REPO || process.env.GITHUB_TOKEN;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&page=${page}&sort=updated&type=public`,
      { headers, next: { revalidate } }
    );

    if (!res.ok) break;

    const data: GitHubRepo[] = await res.json();
    repos.push(...data.filter((r) => !r.fork && !r.archived));

    if (data.length < 100) break;
    page++;
  }

  return repos;
}

/** Convert repo name to readable title: "my-cool-project" → "My Cool Project" */
export function repoNameToTitle(name: string): string {
  return name
    .replaceAll(/[-_]/g, " ")
    .replaceAll(/\b\w/g, (c) => c.toUpperCase());
}

/** Map GitHub language/topics to a project category */
export function inferCategory(language: string | null, topics: string[]): string {
  const topicSet = new Set(topics.map((t) => t.toLowerCase()));

  if (topicSet.has("embedded") || topicSet.has("firmware") || topicSet.has("stm32") || topicSet.has("esp32") || topicSet.has("rtos"))
    return "Embedded";
  if (topicSet.has("iot") || topicSet.has("mqtt") || topicSet.has("smart-home"))
    return "IoT";
  if (topicSet.has("machine-learning") || topicSet.has("ml") || topicSet.has("ai") || topicSet.has("tensorflow") || topicSet.has("pytorch"))
    return "ML";
  if (topicSet.has("devops") || topicSet.has("docker") || topicSet.has("ci-cd") || topicSet.has("kubernetes"))
    return "DevOps";
  if (topicSet.has("cli") || topicSet.has("tool") || topicSet.has("devtool"))
    return "Tools";

  const lang = language?.toLowerCase();
  if (lang === "c" || lang === "c++") return "Embedded";
  if (lang === "rust") return "Rust";
  if (lang === "python") return "Python";
  if (lang === "typescript" || lang === "javascript") return "Web";

  return "Other";
}

/** Map raw GitHub repos to Project objects, deduplicating against curated projects. */
export function mapReposToProjects(
  repos: GitHubRepo[],
  curatedProjects: Project[]
): Project[] {
  const curatedSlugs = new Set(curatedProjects.map((p) => p.slug));
  const curatedGitHubUrls = new Set(
    curatedProjects
      .filter((p) => p.github)
      .map((p) => p.github!.toLowerCase().replace(/\/$/, ""))
  );

  return repos
    .filter((repo) => {
      const slug = repo.name.toLowerCase();
      const url = repo.html_url.toLowerCase().replace(/\/$/, "");
      return !curatedSlugs.has(slug) && !curatedGitHubUrls.has(url);
    })
    .map(repoToProject);
}

/** Map a single GitHub repo to a Project object. */
function repoToProject(repo: GitHubRepo): Project {
  return {
    slug: repo.name.toLowerCase(),
    title: repoNameToTitle(repo.name),
    description: repo.description || "No description provided.",
    category: inferCategory(repo.language, repo.topics),
    techStack: [
      ...(repo.language ? [repo.language] : []),
      ...repo.topics.slice(0, 5),
    ],
    github: repo.html_url,
    demo: repo.homepage || undefined,
    featured: false,
    source: "github" as const,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
    license: repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION"
      ? repo.license.spdx_id
      : undefined,
    languages: toLanguageStats(repo.languages),
    pcb: repo.pcb ?? undefined,
    pdfs: repo.pdfDocs ?? undefined,
    gallery: repo.gallery ?? undefined,
    video: repo.video ?? undefined,
    measurements: repo.measurements ?? undefined,
  };
}

/** Slugs for every pre-fetched GitHub repo (used for static generation). */
export function getGitHubProjectSlugs(): string[] {
  return readGitHubRepos().map((repo) => repo.name.toLowerCase());
}

/** Normalize a path with ./ and ../ segments, resolved from a base dir. */
function resolveRepoPath(dir: string, rel: string): string {
  // A leading slash means repo-root relative.
  const combined = rel.startsWith("/") ? rel.slice(1) : dir + rel;
  const stack: string[] = [];
  for (const part of combined.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

/**
 * Rewrite relative markdown links/images to absolute URLs so they resolve
 * outside of GitHub. Images point at raw.githubusercontent.com, other links at
 * the repo's blob view. `dir` is the directory of the source file (e.g.
 * "docs/") so relative paths resolve correctly.
 */
function absolutizeMarkdownUrls(html: string, repo: GitHubRepo, dir: string): string {
  const branch = repo.default_branch || "HEAD";
  const rawBase = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${repo.name}/${branch}/`;
  const blobBase = `https://github.com/${GITHUB_USERNAME}/${repo.name}/blob/${branch}/`;

  const isAbsolute = (url: string) => /^(https?:|mailto:|#|\/\/)/i.test(url);

  return html
    .replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/gi, (m, pre, url, post) =>
      isAbsolute(url) ? m : `${pre}${rawBase}${resolveRepoPath(dir, url)}${post}`
    )
    .replace(/(<a\b[^>]*\bhref=")([^"]+)(")/gi, (m, pre, url, post) =>
      isAbsolute(url) ? m : `${pre}${blobBase}${resolveRepoPath(dir, url)}${post}`
    );
}

/** Render markdown to HTML with repo-relative URLs made absolute. */
async function renderRepoMarkdown(
  markdown: string,
  repo: GitHubRepo,
  filePath: string
): Promise<string> {
  const processed = await remark().use(remarkGfm).use(remarkHtml).process(markdown);
  const dir = filePath.includes("/")
    ? filePath.slice(0, filePath.lastIndexOf("/") + 1)
    : "";
  return absolutizeMarkdownUrls(processed.toString(), repo, dir);
}

/** Derive a short button label from a file path (basename without extension). */
function docLabel(filePath: string): string {
  const base = filePath.split("/").pop() ?? filePath;
  return base.replace(/\.(md|markdown|mdoc)$/i, "");
}

/** Sort weight so Overview/README come first, everything else after. */
function docSortKey(filePath: string): number {
  const name = docLabel(filePath).toLowerCase();
  if (name === "overview") return 0;
  if (name === "readme") return 1;
  return 2;
}

/** Fetch a repo's root README (raw markdown) live. Returns null if it has none. */
async function fetchLiveReadme(
  name: string,
  revalidate: number = LIVE_REVALIDATE_SECONDS,
): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN_PUBLIC_REPO || process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { Accept: "application/vnd.github.raw+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    // `/readme` returns the repository's root README.
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${name}/readme`,
      { headers, next: { revalidate } },
    );
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Get a single GitHub-sourced project by slug, with its README rendered to HTML.
 * Prefers the pre-fetched (build-time, enriched) repo; for a repo added since the
 * last build it falls back to a live fetch of the repo + its root README so the
 * page works before the next rebuild. Returns null if no such public repo exists.
 */
export async function getGitHubProjectBySlug(
  slug: string
): Promise<ProjectWithHtml | null> {
  let repo = readGitHubRepos().find(
    (r) => r.name.toLowerCase() === slug.toLowerCase()
  );
  if (!repo) {
    // Not in the build-time data yet — resolve it live (basic info + root README).
    const live = await fetchGitHubRepos();
    const found = live.find((r) => r.name.toLowerCase() === slug.toLowerCase());
    if (!found) return null;
    found.readme = await fetchLiveReadme(found.name);
    repo = found;
  }

  const meta = repoToProject(repo);

  // Prefer the markdown files from the docs folder; if the repo has none,
  // fall back to the repo README as a single doc.
  const folderFiles = (repo.markdownFiles ?? []).filter(
    (f) => f.content && f.content.trim()
  );
  folderFiles.sort((a, b) => docSortKey(a.path) - docSortKey(b.path) || a.path.localeCompare(b.path));

  const docs: MarkdownDoc[] = [];
  if (folderFiles.length > 0) {
    for (const file of folderFiles) {
      docs.push({
        path: file.path,
        label: docLabel(file.path),
        html: await renderRepoMarkdown(file.content!, repo, file.path),
      });
    }
  } else if (repo.readme && repo.readme.trim()) {
    docs.push({
      path: "README.md",
      label: "README",
      html: await renderRepoMarkdown(repo.readme, repo, "README.md"),
    });
  }

  return {
    ...meta,
    contentHtml: docs[0]?.html ?? "",
    docs,
    release: repo.release
      ? {
          tag: repo.release.tag_name,
          name: repo.release.name ?? undefined,
          url: repo.release.html_url,
          publishedAt: repo.release.published_at ?? undefined,
        }
      : undefined,
    commits: (repo.commits ?? []).map((c) => ({
      sha: c.sha,
      message: c.message,
      date: c.date ?? undefined,
      url: c.html_url,
      authorLogin: c.author_login ?? undefined,
      authorAvatar: c.author_avatar ?? undefined,
    })),
    contributors: (repo.contributors ?? []).map((c) => ({
      login: c.login,
      avatarUrl: c.avatar_url,
      htmlUrl: c.html_url,
      contributions: c.contributions,
    })),
    dependencies: repo.dependencies ?? [],
  };
}
