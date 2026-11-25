---
title: "The reference list always prints on the last page, above Cite this post, wherever the author wrote it"
author: Mitaadevelop
date: 2026-11-25
branch: worktree-bibliography-last-page
cost: { minutes: 3, tokens: 131052 }
id: l-92e227e2
scope: repo
status: active
src: agent
touches:
  - AGENTS.md
  - content/blog/mitaa.sty
  - src/app/globals.css
  - src/lib/blog/index.ts
  - src/lib/blog/latex.ts
  - src/lib/blog/references.ts
  - templates/blog/README.md
  - templates/blog/post.tex
  - tests/__snapshots__/report-design-showcase--discussie.html
  - tests/__snapshots__/report-design-showcase.html
---

## Decided
The site prints the reference list at the very end of the post, on the last page, directly above the "Cite this post" block, whatever page the author wrote `thebibliography` on. Authors are told to write it last so the PDF prints it in the same place; numbering never depended on its position.

## Tried and ruled out
Keeping the list where the environment stands (the old rule): in a paged post the list landed on a middle page while "Cite this post" is always on the last, so the two were apart.

## Watch out
- The list is on one page, so a `\cite` on any other page must link across to that page; a bare `#ref-key` link only works on the last page.
- `trail check` flags this change against two unrelated learnings by keyword ("post", "environment"); they are false positives.

In the code:
- `parseLatex` in `src/lib/blog/latex.ts` drops the environment and appends one `printbibliography` macro at the end of the body.
- `resolveRefs` in `src/lib/blog/references.ts` takes `bibliographyHref`; `getRenderedPost` passes the last page's href.
- `tests/blog.test.ts` covers the move and the cross-page links.
