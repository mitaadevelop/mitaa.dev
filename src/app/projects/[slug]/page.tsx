import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { ExternalLink, Tag } from "lucide-react";
import { GitHubIcon } from "@/components/site/icons";
import { getAllProjectSlugs, getProjectBySlug } from "@/lib/projects";
import { getGitHubProjectBySlug, getGitHubProjectSlugs } from "@/lib/projects/github";
import { LanguageBar } from "@/components/project/LanguageBar";
import { MarkdownDocs } from "@/components/project/MarkdownDocs";
import { PcbViewer } from "@/components/pcb/PcbViewer";
import { ProjectVideo } from "@/components/project/ProjectVideo";
import { ProjectGallery } from "@/components/project/ProjectGallery";
import { MeasurementChart } from "@/components/project/MeasurementChart";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import { formatDate } from "@/lib/date";

/** Format an ISO date as e.g. "Jul 2026". */
const formatMonth = (iso?: string) => formatDate(iso, "month");

/** Format an ISO date as a relative time, e.g. "3 days ago". */
function formatRelative(iso?: string): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const seconds = Math.round((Date.now() - then) / 1000);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [2592000, "day"],
    [31536000, "month"],
    [Infinity, "year"],
  ];
  const divisors = [1, 60, 3600, 86400, 2592000, 31536000];
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  for (let i = 0; i < units.length; i++) {
    if (seconds < units[i][0]) {
      return rtf.format(-Math.round(seconds / divisors[i]), units[i][1]);
    }
  }
  return null;
}

const ECOSYSTEM_LABELS: Record<string, string> = {
  npm: "npm",
  cargo: "Cargo",
  pypi: "PyPI",
  go: "Go",
};

/** Resolve a slug to a curated project first, then fall back to a GitHub repo. */
async function resolveProject(slug: string) {
  return (await getProjectBySlug(slug)) ?? (await getGitHubProjectBySlug(slug));
}

export function generateStaticParams() {
  const slugs = new Set([...getAllProjectSlugs(), ...getGitHubProjectSlugs()]);
  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await resolveProject(slug);
  if (!project) {
    return { title: "Project Not Found" };
  }
  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "website",
      title: project.title,
      description: project.description,
      url: `/projects/${project.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
    },
  };
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await resolveProject(slug);

  if (!project) {
    notFound();
  }

  // Markdown docs and PDFs share the one Documentation switcher.
  const docCount = (project.docs?.length ?? 0) + (project.pdfs?.length ?? 0);
  const singleDocLabel =
    project.docs?.[0]?.label ?? project.pdfs?.[0]?.label ?? "Documentation";

  // The back links and previous / next project are in the /projects layout
  // (ProjectFrame), which stays mounted; this is only the part that changes.
  // The ViewTransition fades it in and out — sliding a few pixels the way the
  // reader is going when the link says so — with the same animations as a
  // blog page (globals.css). It replaces the entrance animations the header
  // used to replay on every load.
  return (
    <ViewTransition
      key={project.slug}
      enter={{ "page-forward": "page-forward", "page-back": "page-back", default: "page-fade" }}
      exit={{ "page-forward": "page-forward", "page-back": "page-back", default: "page-fade" }}
      default="none"
    >
      <div>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted">
              {project.category}
            </span>
          </div>
          <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-[-1.5px] leading-tight text-foreground">
            {project.title}
          </h1>
          <p className="mt-3 text-[15px] text-muted leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Languages + meta (GitHub repos) */}
        {project.source === "github" && (
          <div className="mb-10 space-y-4">
            {project.languages && project.languages.length > 0 && (
              <LanguageBar languages={project.languages} showLegend />
            )}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-date">
              {project.release && (
                <a
                  href={project.release.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-foreground hover:bg-border transition-colors"
                >
                  <Tag size={11} /> {project.release.tag}
                </a>
              )}
              {formatMonth(project.createdAt) && (
                <span>Created {formatMonth(project.createdAt)}</span>
              )}
              {formatMonth(project.updatedAt) && (
                <span>Updated {formatMonth(project.updatedAt)}</span>
              )}
              {project.license && <span>{project.license} License</span>}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="flex gap-3 mb-10">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-foreground text-[13px] font-medium hover:bg-border transition-colors"
            >
              <GitHubIcon size={14} /> Source
            </a>
          )}
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-colors"
            >
              <ExternalLink size={14} /> Demo
            </a>
          )}
        </div>

        {/* Details grid */}
        <Fade inView>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {project.context && (
              <div>
                <h3 className="text-[12px] font-medium tracking-[0.5px] uppercase text-date mb-2">
                  Context
                </h3>
                <p className="text-[14px] text-foreground">{project.context}</p>
              </div>
            )}
            {project.role && (
              <div>
                <h3 className="text-[12px] font-medium tracking-[0.5px] uppercase text-date mb-2">
                  Role
                </h3>
                <p className="text-[14px] text-foreground">{project.role}</p>
              </div>
            )}
            {project.goal && (
              <div>
                <h3 className="text-[12px] font-medium tracking-[0.5px] uppercase text-date mb-2">
                  Goal
                </h3>
                <p className="text-[14px] text-foreground">{project.goal}</p>
              </div>
            )}
          </div>
        </Fade>

        {/* Docs switcher (GitHub repos) — README + every markdown file and PDF */}
        {project.source === "github" && docCount > 0 && (
          <Fade inView>
            <div className="mb-10">
              <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-4">
                {docCount > 1 ? "Documentation" : singleDocLabel}
              </h2>
              <MarkdownDocs docs={project.docs ?? []} pdfs={project.pdfs} />
            </div>
          </Fade>
        )}

        {/* Overview (curated markdown content) */}
        {project.source !== "github" && project.contentHtml && (
          <Fade inView>
            <div className="mb-10">
              <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-4">
                Overview
              </h2>
              <div
                className="prose-blog max-w-none"
                dangerouslySetInnerHTML={{ __html: project.contentHtml }}
              />
            </div>
          </Fade>
        )}

        {/* Curated PDF documents declared in frontmatter */}
        {project.source !== "github" && project.pdfs && project.pdfs.length > 0 && (
          <Fade inView>
            <div className="mb-10">
              <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-4">
                {project.pdfs.length > 1 ? "Documentation" : project.pdfs[0].label}
              </h2>
              <MarkdownDocs docs={[]} pdfs={project.pdfs} />
            </div>
          </Fade>
        )}

        {/* Demo video */}
        {project.video && (
          <Fade inView>
            <div className="mb-10">
              <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-4">
                Demo
              </h2>
              <ProjectVideo src={project.video} />
            </div>
          </Fade>
        )}

        {/* Interactive PCB viewer (schematic / board / 3D) */}
        {project.pcb && (
          <Fade inView>
            <div className="mb-10">
              <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-4">
                Hardware
              </h2>
              <PcbViewer pcb={project.pcb} />
            </div>
          </Fade>
        )}

        {/* Measurement charts */}
        {project.measurements && project.measurements.length > 0 && (
          <Fade inView>
            <div className="mb-10">
              <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-4">
                Measurements
              </h2>
              <div className="space-y-4">
                {project.measurements.map((mset) => (
                  <MeasurementChart
                    key={mset.src}
                    src={mset.src}
                    title={mset.title}
                    xLabel={mset.xLabel}
                    yLabel={mset.yLabel}
                  />
                ))}
              </div>
            </div>
          </Fade>
        )}

        {/* Photo gallery */}
        {project.gallery && project.gallery.length > 0 && (
          <Fade inView>
            <div className="mb-10">
              <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-4">
                Gallery
              </h2>
              <ProjectGallery images={project.gallery} />
            </div>
          </Fade>
        )}

        {/* Tech Stack */}
        <Fade inView>
          <div className="mb-10">
            <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-4">
              Tech Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="text-[13px] px-3 py-1.5 rounded-full bg-secondary text-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </Fade>

        {/* Dependencies (GitHub repos) */}
        {project.dependencies && project.dependencies.length > 0 && (
          <Fade inView>
            <div className="mb-10">
              <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-4">
                Dependencies
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.dependencies.map((dep) => (
                  <span
                    key={`${dep.ecosystem}-${dep.name}`}
                    className="inline-flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-full bg-secondary text-foreground"
                  >
                    {dep.name}
                    <span className="text-[11px] text-date">
                      {ECOSYSTEM_LABELS[dep.ecosystem] ?? dep.ecosystem}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </Fade>
        )}

        {/* Recent commits (GitHub repos) */}
        {project.commits && project.commits.length > 0 && (
          <Fade inView>
            <div className="mb-10">
              <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-4">
                Recent Commits
              </h2>
              <ul className="divide-y divide-divider">
                {project.commits.map((commit) => (
                  <li key={commit.sha} className="py-2.5">
                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start justify-between gap-3"
                    >
                      <span className="text-[14px] text-foreground group-hover:text-muted transition-colors line-clamp-1">
                        {commit.message}
                      </span>
                      <span className="flex items-center gap-2 shrink-0 text-[12px] text-date">
                        {formatRelative(commit.date)}
                        <code className="text-[11px] font-mono text-muted">
                          {commit.sha}
                        </code>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Fade>
        )}

        {/* Contributors (GitHub repos) */}
        {project.contributors && project.contributors.length > 0 && (
          <Fade inView>
            <div className="mb-10">
              <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-4">
                Contributors
              </h2>
              <div className="flex flex-wrap gap-3">
                {project.contributors.map((c) => (
                  <a
                    key={c.login}
                    href={c.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${c.login} · ${c.contributions} commits`}
                    className="flex items-center gap-2 rounded-full bg-secondary py-1 pl-1 pr-3 hover:bg-border transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.avatarUrl}
                      alt=""
                      className="h-6 w-6 rounded-full"
                      loading="lazy"
                    />
                    <span className="text-[13px] text-foreground">{c.login}</span>
                  </a>
                ))}
              </div>
            </div>
          </Fade>
        )}

        {/* Features */}
        {project.features && (
          <Fade inView>
            <div className="mb-10">
              <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-4">
                Key Features
              </h2>
              <ul className="space-y-3">
                {project.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-[14px] text-foreground"
                  >
                    <span className="mt-2 w-1 h-1 rounded-full bg-date shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Fade>
        )}
      </div>
    </ViewTransition>
  );
}
