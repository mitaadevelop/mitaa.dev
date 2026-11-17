---
title: "Page turns pin the view-transition box instead of letting it morph, and this was not checked in a browser"
author: Mitaadevelop
date: 2026-11-17
branch: worktree-blog-transitions
cost: { minutes: 3, tokens: 130838 }
id: l-11567dad
scope: repo
status: active
src: agent
touches:
  - AGENTS.md
  - "src/app/[lang]/blog/[slug]/ChapterBody.tsx"
  - src/app/globals.css
  - src/lib/view-transition.ts
---

## Decided
The blog page turn pins the browser's transition box with a 1 ms group animation, so the box lands at its final place at once. The old page fades out in place (110 ms) and the new one slides in 28 px from the reading direction (320 ms, ease-out, starting at 50 ms). The reasoning: by default the browser animates the box from the old page's position and size to the new one's, so pages of another height or scroll position fly or stretch. That is the likely cause of the "transition feels off" complaint.

## Tried and ruled out
Looking at it in a browser. The Chrome extension was not connected, and `npm run dev` returns 500 in a worktree that has no `node_modules` of its own (Next is then resolved from a parent folder). So the cause above is reasoned from how view transitions work, not observed. Setting the group to `animation: none` was also dropped: that leaves the box at the old page's geometry for good.

## Watch out
The `page-forward` / `page-back` / `page-fade` rules are shared with every `swapView` user (document tabs, the hardware viewer, the chart/table toggle), so a change for blog pages changes those too. If the turn still looks wrong, check it on a Vercel preview with a multi-page post, and say which part is wrong (speed, scroll jump, flash) before changing the numbers.

In the code:
- src/app/globals.css, the "Turning a page of a blog post" block (group, old, new rules; `--page-shift`)
- src/lib/view-transition.ts (`swapView`), src/app/[lang]/blog/[slug]/ChapterBody.tsx (the `<ViewTransition>`)
