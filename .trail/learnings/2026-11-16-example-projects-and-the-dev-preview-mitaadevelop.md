---
title: Example projects and the dev preview of the project template were removed on purpose; do not bring them back
author: Mitaadevelop
date: 2026-11-16
branch: worktree-update-templates
cost: { minutes: 3, tokens: 30753 }
id: l-1fea6e73
scope: repo
status: active
src: agent
touches:
  - AGENTS.md
  - README.md
---

## Decided
The site shows no example projects. The curated "RTOS Dev Board" page, the dev-only `project-template` preview and the demo hardware and photo assets behind them were all removed at the owner's request. `/projects` now lists only real GitHub repos plus any curated page the owner writes. The project template stays as a starting point, but is not rendered on the dev site.

## Tried and ruled out
Removing only the curated page and keeping the demo assets for the preview. That was the first step, and the owner then asked for the dev setup to go as well. Nothing else used those assets.

## Watch out
- The README folder rules for the project template are the only documentation of it now, so keep them in step with `scripts/fetch-github-data.mjs`. Nothing renders them, so nothing will show a mistake.
- `public/pcb/*` is fully git-ignored again, with no committed exception.
- `content/projects/` no longer exists in git. The reader returns an empty list when the folder is missing, so do not treat that as a bug.

In the code:
- `readTemplateRepo` is gone from `src/lib/projects/github.ts`.
- `templates/project/repo/` and `templates/project/curated.md` are unchanged.
