---
title: Diagrams are drawn at build time by pele; keep the post folder path static or the build traces the whole project
author: Mitaadevelop
date: 2026-11-16
branch: worktree-update-templates
cost: { minutes: 18, tokens: 543201 }
id: l-92b74a92
scope: repo
status: active
src: agent
touches:
  - AGENTS.md
  - README.md
  - content/blog/mitaa.sty
  - package-lock.json
  - package.json
  - scripts/blog-check.mts
  - src/app/globals.css
  - src/lib/blog/hast.ts
  - src/lib/blog/i18n.ts
  - src/lib/blog/latex.ts
---

## Decided
Mermaid diagrams are drawn to SVG while the site builds, by pele, which renders synchronously in plain Node (checked, not assumed). The page gets plain SVG and no client script. Blog posts and project pages share one function for it.

## Tried and ruled out
- Making the post folder switchable by an environment variable read inside a function: the build then warned about tracing the whole project, 5 new warnings on top of 2 old ones. A module-level constant gated on the test environment brought it back to 2.
- Turning off sanitising of project markdown so the SVG passes: READMEs come from anywhere. The diagram goes in after sanitising instead.

## Watch out
- Count the "Dynamic filesystem access" build warnings (2 before this work); do not only look for them.
- The tests set their folders in a preloaded setup file, because the constant is read at import.
- Label fit was checked with a system font, not Inter.

In the code:
- `src/lib/diagram.ts`, `src/lib/projects/markdown.ts`, `rehypeDiagrams` in `src/lib/blog/hast.ts`, `tests/setup.ts`.
