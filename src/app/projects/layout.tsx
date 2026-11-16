import { getAllProjects } from "@/lib/projects";
import { mapReposToProjects, readGitHubRepos } from "@/lib/projects/github";
import ProjectFrame from "@/components/project/ProjectFrame";

/**
 * The frame around a project page (back links, previous / next project).
 *
 * It sits here rather than in `[slug]/layout.tsx` because Next remounts a
 * dynamic segment's layout whenever its value changes — a frame there would be
 * rebuilt for every project. One level up it survives the move from project
 * to project, and only the page underneath is swapped.
 */
export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  // The same order as the list at /projects: curated first, then GitHub repos.
  const curated = getAllProjects();
  const projects = [...curated, ...mapReposToProjects(readGitHubRepos(), curated)].map(
    ({ slug, title, category }) => ({ slug, title, category })
  );

  return <ProjectFrame projects={projects}>{children}</ProjectFrame>;
}
