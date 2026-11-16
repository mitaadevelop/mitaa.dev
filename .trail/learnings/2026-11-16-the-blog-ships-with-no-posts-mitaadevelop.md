---
title: The blog ships with no posts; tests render their own fixture posts and the template shows every feature
author: Mitaadevelop
date: 2026-11-16
branch: worktree-update-templates
cost: { minutes: 11, tokens: 150370 }
id: l-fe998889
scope: repo
status: active
src: agent
touches:
  - AGENTS.md
  - README.md
  - content/blog/mitaa.sty
  - scripts/blog-check.mts
  - src/app/blog/page.tsx
  - src/app/page.tsx
  - src/lib/blog/source.ts
---

## Decided
The published blog is empty on purpose: the owner removed every post. The one example an author copies is the blog template post, which shows every feature. The posts the tests render are test fixtures and live under the tests folder, not with the content. With no posts the blog page says "No posts yet." and the home page drops its blog section.

## Tried and ruled out
- Deleting the feature posts along with the real ones. Twelve snapshots and the regression tests render them, so the suite would have lost its safety net.
- Keeping them in the content folder as drafts. Drafts still show up in the dev blog list, which is not the empty blog the owner asked for.
- Leaving the fixture PDF in the public folder. The site shows a PDF button only when the file exists, so the test needs a PDF, but it would ship unused to production.

## Watch out
- A test that asks for a post that no longer exists can pass quietly: the chapter outline of an unknown post is empty, so "this post must stay one page" stayed green after its posts were deleted. Check that the post exists first.
- The site's KaTeX macros exist twice, in the KaTeX settings and in the LaTeX style file. Change both, or the template stops compiling to a PDF the way the site renders it.
- A literal bracketed-question-mark key in the template's prose looks like an unresolved reference when you search the page. Describe it in words instead.
- A production build was not run, because Turbopack needs `node_modules` inside the worktree. The Next docs say an empty list of static params is fine when Cache Components is off.

In the code:
- `BLOG_CONTENT_DIR` and `BLOG_PUBLIC_DIR` replace `content/blog` and `public/` for the posts and their PDFs. They are read on every call in `src/lib/blog/source.ts`, so a test can set them after importing.
- `tests/blog.test.ts` sets both to `tests/fixtures/blog` and `tests/fixtures/public`; `scripts/blog-check.mts` does the same when a post is found among the fixtures, so `npm run blog:check report-design-showcase` works.
- `templates/blog/post.tex` is the example, checked with `npm run blog:check template`.
