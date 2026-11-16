---
title: "New worktrees start from an outdated main, so reset them to the working branch before editing"
author: Mitaadevelop
date: 2026-11-16
branch: worktree-update-templates
cost: { minutes: 4, tokens: 111333 }
id: l-0dcdb114
scope: repo
status: active
src: agent
touches:
  - templates/blog/README.md
  - templates/blog/post.tex
  - templates/project/README.md
  - templates/project/curated.md
  - src/lib/blog/source.ts
  - src/lib/blog/index.ts
---

## Decided
Work on the blog and templates in a worktree, but first point the worktree's branch at the feature branch the work belongs to.

## Tried and ruled out
Editing straight after the worktree was created. It starts from the remote main, which still has the old markdown blog: no LaTeX pipeline, no `templates/blog/`, no `mitaa.sty`. Nothing there could be checked.

## Watch out
- The worktree has no `node_modules`. A symlink to the main checkout's one works for `tsx` and `npm run blog:check`. Keep it out of the commit: `.gitignore` ignores `node_modules/` but not a symlink with that name.
- Uncommitted work in the main checkout is not in the worktree either.

In the code:
- `git reset --hard fix/vercel-nextjs-deploy` inside the fresh worktree, which has no commits of its own yet.
- `npm run blog:check template` compiles `templates/blog/post.tex` and compares its numbering with the site's.
