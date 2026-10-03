import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import type { Project, Measurement, PcbAssets, MarkdownDoc, PdfDoc, LanguageStat, Release, Commit, Contributor, Dependency, ProjectWithHtml } from "./types";

export type { Project, Measurement, PcbAssets, MarkdownDoc, PdfDoc, LanguageStat, Release, Commit, Contributor, Dependency, ProjectWithHtml };

const projectsDirectory = path.join(process.cwd(), "content/projects");
/** Curated projects are markdown files with YAML frontmatter. */
const PROJECT_EXTENSIONS = [".md"];

interface ParsedProject {
  slug: string;
  data: Record<string, unknown>;
  body: string;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

/** Read and frontmatter-parse every project file in the directory. */
function readAllProjectFiles(): ParsedProject[] {
  if (!fs.existsSync(projectsDirectory)) return [];
  return fs
    .readdirSync(projectsDirectory)
    .filter((file) => PROJECT_EXTENSIONS.includes(path.extname(file)))
    .map((file) => {
      const slug = file.replace(/\.[^.]+$/, "");
      const raw = fs.readFileSync(path.join(projectsDirectory, file), "utf8");
      const { data, content } = matter(raw);
      return { slug, data, body: content };
    });
}

function toProject({ slug, data }: ParsedProject): Project {
  return {
    slug,
    title: str(data.title) ?? slug,
    description: str(data.description) ?? "",
    category: str(data.category) ?? "Other",
    techStack: strArray(data.techStack),
    image: str(data.image),
    github: str(data.github),
    demo: str(data.demo),
    featured: data.featured === true,
    context: str(data.context),
    role: str(data.role),
    goal: str(data.goal),
    features: Array.isArray(data.features) ? (data.features as string[]) : undefined,
    pcb: toPcbAssets(data.pcb),
    pdfs: toPdfDocs(data.pdfs),
    gallery: toGallery(data.gallery),
    video: str(data.video),
    measurements: toMeasurements(data.measurements),
  };
}

/** Normalise a frontmatter measurements array (drops entries without a src). */
function toMeasurements(value: unknown): Measurement[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: Measurement[] = [];
  for (const v of value) {
    if (!v || typeof v !== "object") continue;
    const o = v as Record<string, unknown>;
    const src = str(o.src);
    if (!src) continue;
    out.push({ src, title: str(o.title), xLabel: str(o.xLabel), yLabel: str(o.yLabel) });
  }
  return out.length > 0 ? out : undefined;
}

/** Normalise a frontmatter gallery array to a list of non-empty image paths/URLs. */
function toGallery(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const imgs = value.filter((s): s is string => typeof s === "string" && s.length > 0);
  return imgs.length > 0 ? imgs : undefined;
}

/** Basename without the .pdf extension, dashes/underscores turned into spaces. */
export function pdfLabel(src: string): string {
  const base = (src.split("/").pop() ?? src).replace(/\.pdf$/i, "");
  return decodeURIComponent(base).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() || "PDF";
}

/** Normalise the raw `pdfs` frontmatter array; entries without a path are dropped. */
function toPdfDocs(value: unknown): PdfDoc[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const docs = (value as unknown[]).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const v = entry as Record<string, unknown>;
    const src = str(v.src);
    if (!src) return [];
    return [{ src, path: src, label: str(v.label) ?? pdfLabel(src) }];
  });
  return docs.length > 0 ? docs : undefined;
}

/** Normalise the raw `pcb` frontmatter object; returns undefined if no asset paths are set. */
function toPcbAssets(value: unknown): PcbAssets | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;
  const sheets = Array.isArray(v.schematicSheets)
    ? (v.schematicSheets as unknown[]).filter((s): s is string => typeof s === "string" && s.length > 0)
    : undefined;
  const assets: PcbAssets = {
    schematic: str(v.schematic),
    schematicSheets: sheets && sheets.length > 0 ? sheets : undefined,
    board: str(v.board),
    model3d: str(v.model3d),
    bom: str(v.bom),
    schematicImage: str(v.schematicImage),
    pcbImage: str(v.pcbImage),
    pcbBackImage: str(v.pcbBackImage),
    pcbXrayImage: str(v.pcbXrayImage),
  };
  const any =
    assets.schematic ||
    assets.board ||
    assets.model3d ||
    assets.bom ||
    assets.schematicImage ||
    assets.pcbImage ||
    assets.pcbXrayImage;
  return any ? assets : undefined;
}

/** Get all curated projects. */
export function getAllProjects(): Project[] {
  return readAllProjectFiles().map(toProject);
}

/** Get all slugs for static generation. */
export function getAllProjectSlugs(): string[] {
  return readAllProjectFiles().map((entry) => entry.slug);
}

/** Resolve the on-disk path for a slug, trying each supported extension. */
function resolveProjectPath(slug: string): string | null {
  for (const ext of PROJECT_EXTENSIONS) {
    const p = path.join(projectsDirectory, `${slug}${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** Get a single project by slug, with HTML-rendered markdown content. */
export async function getProjectBySlug(slug: string): Promise<ProjectWithHtml | null> {
  const filePath = resolveProjectPath(slug);
  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const meta = toProject({ slug, data, body: content });

  let contentHtml = "";
  if (content.trim()) {
    const processed = await remark().use(remarkGfm).use(remarkHtml).process(content);
    contentHtml = processed.toString();
  }

  return { ...meta, contentHtml };
}
