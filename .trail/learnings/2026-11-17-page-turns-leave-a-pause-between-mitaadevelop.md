---
title: Page turns leave a pause between the old text going and the new text coming; the owner twice saw overlap
author: Mitaadevelop
date: 2026-11-17
branch: worktree-blog-transitions
cost: { minutes: 1, tokens: 10420 }
id: l-a9e78ade
scope: repo
status: active
replaces: l-bf4b687b
src: agent
touches:
  - AGENTS.md
  - src/app/globals.css
  - src/lib/view-transition.ts
---

## Decided
The old page leaves (150 ms), there is a 50 ms pause, then the new page comes in (300 ms, delayed by leave plus pause). The owner asked for no overlap at all, and still reported it when the new page started at the exact moment the old one ended, so a pause is built in. The transition box is pinned with a 1 ms group animation, since by default the browser morphs it from the old page's position and size to the new one's.

## Tried and ruled out
Seeing it in a browser: the Chrome extension was never connected and `npm run dev` returns 500 in a worktree with no `node_modules` of its own. Everything here is reasoned from the CSS, not observed. Earlier attempts: new page starting 50 ms in (overlapped), new page starting exactly when the old ends (reported as still overlapping). `animation: none` on the group was dropped: it leaves the box at the old geometry for good.

## Watch out
If overlap is still reported, first check which build the owner is looking at: only the preview of the PR's latest commit has this, the live site and older previews have the overlapping versions. The `page-*` rules are shared with every `swapView` user (document tabs, hardware viewer, chart/table toggle). Ask what exactly overlaps (the text, or the heading and contents changing at once) before changing numbers.

In the code:
- src/app/globals.css, the "Turning a page of a blog post" block (`--page-out`, `--page-gap`, `--page-shift`)
- src/lib/view-transition.ts (`swapView`), src/app/[lang]/blog/[slug]/ChapterBody.tsx
