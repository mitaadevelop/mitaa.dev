---
title: A fresh worktree fails typecheck on RouteContext until Next generates its route types
author: Mitaadevelop
date: 2026-11-17
branch: worktree-translate
cost: { minutes: 1, tokens: 1693 }
id: l-5a270093
scope: repo
status: active
src: agent
touches:
  - "src/app/[lang]/layout.tsx"
  - src/components/site/Footer.tsx
---

## Decided
In a fresh worktree, `tsc --noEmit` reports "Cannot find name 'RouteContext'" for the download route. That is not a code error: Next generates the global type itself, and a worktree that has never run `next dev` or `next build` does not have it yet. Generate the types, then typecheck.

## Tried and ruled out
Editing the route handler or adding a local `RouteContext` type. The route is fine; a hand-written copy would drift from what Next generates.

## Watch out
`npx next typegen` writes into the git-ignored `.next/` folder, so it leaves the working tree clean. Run it before `npx tsc --noEmit` in any new worktree, or the check fails for a reason that has nothing to do with your change.

In the code:
- src/app/api/download/[id]/route.ts uses RouteContext (lines 28 and 39)
- fix: `npx next typegen && npx tsc --noEmit`
