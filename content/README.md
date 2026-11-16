# Content: where things go

Everything you write for the site lives in this folder. The site reads it when it
is built; there is no database.

| I want to add… | Do this |
| --- | --- |
| **A blog post** | `npm run new:post <name>` — see below |
| **A project** | Push a public GitHub repo: it shows up by itself. Put its write-up in the repo's `project/` folder (start from [`templates/project/`](../templates/project/)). Only a project *without* a public repo needs a file here: `content/projects/<name>.md` |
| **The bio on the home page** | Edit [`bio.md`](bio.md) |
| **A free download in the shop** | Sources are in `content/shop/` (the LaTeX templates and the cheat sheet); then `npm run downloads:build` |

## Writing a blog post

```bash
npm run new:post can-bus-sniffer "A CAN bus sniffer"
```

This makes two things:

- `content/blog/can-bus-sniffer.tex` — the post, in LaTeX. The file name is the URL (`/blog/can-bus-sniffer`). It starts as the template that shows every feature of the blog, so delete what you do not need.
- `public/blog/can-bus-sniffer/` — put its images here and refer to them from the site root: `\includegraphics{/blog/can-bus-sniffer/scope.png}`.

Then:

1. `npm run dev` and open <http://localhost:3000/blog/can-bus-sniffer>. Saving the `.tex` file refreshes the page.
2. The new post is a **draft**: it shows on your machine only. Delete the `\draft` line near the top when it should be public.
3. Commit and push (`git add content/blog public/blog && git commit && git push`). When the repository is connected to Vercel, the site updates by itself; otherwise see [Deployment](../README.md#deployment).

The template post is also on screen at `/blog/template` while `npm run dev` runs. It is never part of the production site.

`mitaa.sty` in `content/blog/` is not a post: it holds the site's own macros as real LaTeX, so a post also compiles to a PDF (`npm run blog:check <name>`). Leave it where it is.

## Where *not* to put things

| Folder | What it is |
| --- | --- |
| `tests/fixtures/` | Posts the tests render. They never appear on the site. |
| `templates/` | Starting points to copy from; not content. |
| `public/data`, `public/pcb`, `public/media`, `public/docs/<repo>` | Filled in by the build from your GitHub repos. Do not edit them. |
| `public/downloads` | The built shop downloads. Made by `npm run downloads:build`. |
| `private-products/` | Your sale-ready masters. It is never committed or deployed. |

Static files that belong to one post (images) go in `public/blog/<name>/`. Anything
else the site should serve as a plain file goes in `public/`, and is reached from the
site root (`public/blog-example.png` is `/blog-example.png`).
