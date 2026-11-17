"use client";

import { useEffect, useState } from "react";
import Link from "@/components/site/LocaleLink";
import { useDictionary } from "@/components/site/LangProvider";
import { ExternalLink, Search, Star, GitFork, ArrowLeft } from "lucide-react";
import { GitHubIcon } from "@/components/site/icons";
import type { Project } from "@/lib/projects/types";
import { LanguageBar } from "@/components/project/LanguageBar";
import { PcbPreview } from "@/components/pcb/PcbPreview";
import { Blur } from "@/components/animate-ui/primitives/effects/blur";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";

interface Props {
  curatedProjects: Project[];
  initialGithubProjects: Project[];
}

export default function ProjectsList({ curatedProjects, initialGithubProjects }: Readonly<Props>) {
  const { projects: words } = useDictionary();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [githubProjects, setGithubProjects] = useState<Project[]>(initialGithubProjects);

  // On load, re-check GitHub for repos added since the last build and append any
  // new ones so they show up on refresh (their full detail fills in next build).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/github-repos")
      .then((r) => r.json())
      .then((data: { projects?: Project[] }) => {
        if (cancelled || !Array.isArray(data.projects)) return;
        const known = new Set(
          [...curatedProjects, ...initialGithubProjects].map((p) => p.slug),
        );
        const extras = data.projects.filter((p) => !known.has(p.slug));
        if (extras.length) setGithubProjects((prev) => [...prev, ...extras]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [curatedProjects, initialGithubProjects]);

  const curatedWithSource = curatedProjects.map((p) => ({ ...p, source: "curated" as const }));
  const allProjects = [...curatedWithSource, ...githubProjects];

  const dynamicCategories = new Set(allProjects.map((p) => p.category));
  const allCategories = ["All", ...Array.from(dynamicCategories)];

  const filtered = allProjects.filter((p) => {
    const matchCategory =
      activeCategory === "All" || p.category === activeCategory;
    const matchSearch =
      search === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.techStack.some((t) =>
        t.toLowerCase().includes(search.toLowerCase())
      );
    return matchCategory && matchSearch;
  });

  return (
    <div className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-20 py-20">
      {/* Back */}
      <Blur delay={0}>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft size={14} /> mitaa.dev
        </Link>
      </Blur>

      {/* Header */}
      <Blur delay={50}>
        <h1 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-8">
          {words.title}
        </h1>
      </Blur>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted hover:text-foreground"
              }`}
            >
              {cat === "All" ? words.all : cat === "Other" ? words.other : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-date"
          />
          <input
            type="text"
            placeholder={words.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56 pl-8 pr-3 py-1.5 rounded-full bg-secondary border-none text-[13px] text-foreground placeholder:text-date focus:outline-none focus:ring-1 focus:ring-foreground/10 transition-colors"
          />
        </div>
      </div>

      {/* Project grid */}
      <div className="divide-y divide-divider">
        {filtered.map((project, i) => {
          const isCurated = project.source === "curated";
          // Both curated and GitHub projects open their own detail page
          // (GitHub projects show their README there instead of jumping to GitHub).
          const projectHref = `/projects/${project.slug}`;

          const CardContent = (
            <div className="group py-5 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-[15px] font-medium text-foreground group-hover:text-muted transition-colors">
                      {project.title}
                    </h3>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted">
                      {project.category}
                    </span>
                    {!isCurated && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-date">
                        GitHub
                      </span>
                    )}
                  </div>
                  <p className="text-[14px] text-muted line-clamp-1 max-w-xl mb-2">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.slice(0, 5).map((tech) => (
                      <span
                        key={tech}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  {project.languages && project.languages.length > 0 && (
                    <div className="mt-2.5 max-w-[240px]">
                      <LanguageBar languages={project.languages} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {!isCurated && project.stars ? (
                    <span className="flex items-center gap-1 text-[13px] text-date">
                      <Star size={12} /> {project.stars}
                    </span>
                  ) : null}
                  {!isCurated && project.forks ? (
                    <span className="flex items-center gap-1 text-[13px] text-date">
                      <GitFork size={12} /> {project.forks}
                    </span>
                  ) : null}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {project.github && <GitHubIcon size={14} className="text-muted" />}
                    {project.demo && <ExternalLink size={14} className="text-muted" />}
                  </div>
                  {/* Instant 3D preview for hardware projects */}
                  {project.pcb?.model3d && (
                    <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-lg overflow-hidden border border-divider bg-secondary">
                      <PcbPreview model3d={project.pcb.model3d} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );

          return (
            <Fade key={project.slug} inView delay={i * 40}>
              {/* "Forward": the project page slides in the reading direction. */}
              <Link href={projectHref} transitionTypes={["page-forward"]}>
                {CardContent}
              </Link>
            </Fade>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted text-[14px]">{words.noResults}</p>
          <button
            onClick={() => {
              setActiveCategory("All");
              setSearch("");
            }}
            className="mt-3 text-foreground hover:underline text-[13px]"
          >
            {words.clearFilters}
          </button>
        </div>
      )}
    </div>
  );
}
