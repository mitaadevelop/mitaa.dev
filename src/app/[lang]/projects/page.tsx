import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllProjects } from "@/lib/projects";
import { readGitHubRepos, mapReposToProjects } from "@/lib/projects/github";
import { isLang } from "@/lib/i18n";
import { dictionary } from "@/lib/i18n/dictionary";
import { languageAlternates } from "@/lib/i18n/metadata";
import ProjectsList from "./ProjectsList";

type Props = Readonly<{ params: Promise<{ lang: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const words = dictionary(lang).projects;
  return {
    title: words.title,
    description: words.description,
    alternates: languageAlternates(lang, "/projects"),
  };
}

export default async function ProjectsPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const projects = getAllProjects();

  // Read pre-fetched GitHub repos for static export
  const rawRepos = readGitHubRepos();
  const githubProjects = mapReposToProjects(rawRepos, projects);

  return (
    <ProjectsList
      curatedProjects={projects}
      initialGithubProjects={githubProjects}
    />
  );
}
