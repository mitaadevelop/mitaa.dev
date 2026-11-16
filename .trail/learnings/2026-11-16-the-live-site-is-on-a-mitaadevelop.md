---
title: The live site is on a Vercel team this CLI login cannot reach; test deploys go to a separate mitaa-dev project
author: Mitaadevelop
date: 2026-11-16
branch: worktree-deploy-all
cost: { minutes: 30, tokens: 532120 }
id: l-e58857cf
scope: repo
status: active
src: agent
touches:
  - AGENTS.md
  - Makefile
  - README.md
  - content/shop/latex-cheatsheet/main.tex
  - content/shop/latex-templates/essay/main.tex
  - content/shop/latex-templates/essay/references.bib
  - content/shop/latex-templates/essay/setup.tex
  - content/shop/latex-templates/report/main.tex
  - content/shop/latex-templates/report/references.bib
  - content/shop/latex-templates/report/setup.tex
---

## Decided
The real site (mitaa.dev, redirecting to www) runs on Vercel, project project-58ymk in team mitaa, deployed through the GitHub integration from main. The Vercel CLI on the owner's Mac is logged in as another account (mitaadevelop), which is not a member of that team. For a look at unmerged work, a separate project, mitaa-dev, was created under mitaadevelop and deployed from a clean copy. The live domain was not touched.

## Tried and ruled out
- Deploying to the linked project: the link in `.vercel/` points at the mitaa team, the CLI says "Not authorized".
- Pushing a branch to trigger a preview: the GitHub integration did not build the branches or the draft PR.

## Watch out
- The test project has no environment variables: no GitHub token (public rate limit) and no Redis store, so download counts stay hidden. Canonical URLs and the feed still say mitaa.dev because `NEXT_PUBLIC_SITE_URL` is unset.
- It is not connected to git; update it with `vercel deploy --prod --scope mitaadevelop` from a clean copy without `node_modules`, `.next`, `.env*` and `private-products/`.
- Remove the `.env.local` that `vercel link` writes before deploying.

In the code:
- `vercel.json` (framework only), `src/lib/site.ts` (`SITE_URL`).
