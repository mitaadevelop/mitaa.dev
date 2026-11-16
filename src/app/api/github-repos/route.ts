import { NextResponse } from "next/server";
import { fetchGitHubRepos, mapReposToProjects } from "@/lib/projects/github";

// Re-check GitHub for new repos at most once per window (protects rate limits).
// The projects list fetches this on load, so newly-added repos appear on refresh
// without waiting for a rebuild. Full detail (docs, PDFs, PCB assets) fills in next build.
// Must be a literal — Next statically analyses segment configs, so an imported
// constant (LIVE_REVALIDATE_SECONDS in @/lib/projects/github) fails the build. Keep in sync.
export const revalidate = 60;

export async function GET() {
  try {
    const repos = await fetchGitHubRepos();
    // No curated list here — the client dedups against what it already shows.
    const projects = mapReposToProjects(repos, []);
    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json({ projects: [] });
  }
}
