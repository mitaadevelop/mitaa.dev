---
title: "Page turns: text goes first, then the page chrome changes in the pause, then the new text; measured in headless Chrome"
author: Mitaadevelop
date: 2026-11-17
branch: worktree-blog-transitions
cost: { minutes: 12, tokens: 135410 }
id: l-9c8d5a65
scope: repo
status: active
replaces: l-a9e78ade
src: agent
touches:
  - src/components/blog/useCurrentChapter.ts
  - src/app/globals.css
  - src/components/blog/TableOfContents.tsx
---

## Decided
Three steps in a row: the old text leaves (150 ms), a 50 ms pause, the new text comes in (300 ms). The page chrome (page counter, contents, previous / next cards) is live DOM that changes the moment the new page renders, i.e. on top of the leaving text; that was the overlap the owner kept seeing, even once the text itself was sequential. So the chrome reads `useShownChapter`, the current page 200 ms late, and changes in the pause. The keyboard navigation stays on `useCurrentChapter` (never late), or two quick arrow presses would go to the same page.

## Tried and ruled out
Holding the `::view-transition-old/new(root)` layers to swap the chrome in one step: with the whole root group hidden the screenshots did not change, so the chrome is not drawn through those layers; the rules did nothing and were removed. Pinning the group box (1 ms) matters little: the old and new text are separate groups. Judging by eye: use a headless Chrome over the DevTools protocol, sample per frame the opacity of the pseudo-elements and the page counter in the DOM. In slow motion (`Animation.setPlaybackRate`) JS timers do not slow down, so the timing of `useShownChapter` can only be checked in real time.

## Watch out
`PAGE_SWAP_MS` (JS) and `--page-out` + `--page-gap` (CSS) are one number in two places. The `page-*` rules are shared with every `swapView` user (document tabs, hardware viewer, chart/table toggle). Dev server in a worktree: Turbopack refuses a `node_modules` symlink; `npx next dev --webpack` works with one (git does not ignore the symlink, remove it before committing).

In the code:
- src/components/blog/useCurrentChapter.ts (`useShownChapter`, `PAGE_SWAP_MS`), used by ChapterMeta, ChapterNav, TableOfContents
- src/app/globals.css, "Turning a page of a blog post"
