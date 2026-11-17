---
title: The home page heatmap read a file the build only wrote with a token; the build falls back to the public profile calendar
author: Mitaadevelop
date: 2026-11-17
branch: worktree-github-activity
cost: { minutes: 1, tokens: 1936 }
id: l-3f7dd20b
scope: repo
status: active
src: agent
touches:
  - scripts/contributions-html.mjs
  - scripts/fetch-github-data.mjs
  - src/components/project/GitHubContributions.tsx
---

## Decided
The GitHub activity heatmap on the home page fetches `/data/github-contributions.json`, a file the build writes. The Vercel project `mitaa-dev` had no environment variables, so no token, so no file: a 404 and the heatmap's "unavailable" message. When there is no token (or the GraphQL call fails) the build reads the public contribution calendar from the profile page instead. That holds public contributions only; a token adds the private ones.

## Tried and ruled out
Creating or reusing a token for Vercel: a token is the owner's to make, and reusing the `gh` login's token as a build secret would move a broad credential somewhere it was not meant to go. A third-party contributions API: it sends the username to another service for no gain.

## Watch out
The fallback reads HTML, so a change in GitHub's markup makes the build warn "no calendar on the page" and the file goes missing again; `parseContributionsHtml` returns null for that. The data is written at build time, so the heatmap is as fresh as the build that made it.

In the code:
- scripts/contributions-html.mjs, scripts/fetch-github-data.mjs (`fetchContributions`)
- src/components/project/GitHubContributions.tsx (the reader)
