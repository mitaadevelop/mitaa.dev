---
title: "Page turns run in sequence with the transition box pinned, and this was not checked in a browser"
author: Mitaadevelop
date: 2026-11-17
branch: worktree-blog-transitions
cost: { minutes: 1, tokens: 6334 }
id: l-bf4b687b
scope: repo
status: active
replaces: l-11567dad
src: agent
touches:
  - src/app/globals.css
  - src/lib/view-transition.ts
---

## Decided
The old page slides 20 px out and fades away completely (170 ms); only then does the new page slide in 20 px from the other side (300 ms). The new page's delay is the old one's duration (`--page-out`), so they are never on screen together; keep the two in step. The transition box is pinned with a 1 ms group animation, because by default the browser morphs it from the old page's position and size to the new one's, and a page of another height or scroll flies or stretches.

## Tried and ruled out
Seeing it in a browser: the Chrome extension was not connected and `npm run dev` returns 500 in a worktree with no `node_modules` of its own. So the morph as the cause of the bad feel is reasoned, not observed. An overlapping version (new page starting 50 ms in) was the first attempt; the owner asked for sequential. `animation: none` on the group was dropped: it leaves the box at the old geometry for good.

## Watch out
These `page-*` rules are shared with every `swapView` user (document tabs, hardware viewer, chart/table toggle), so changing them changes those too. If it still looks wrong, check a multi-page post on a Vercel preview and say what is wrong (speed, scroll jump, flash) before changing numbers.

In the code:
- src/app/globals.css, the "Turning a page of a blog post" block
- src/lib/view-transition.ts (`swapView`), src/app/[lang]/blog/[slug]/ChapterBody.tsx
