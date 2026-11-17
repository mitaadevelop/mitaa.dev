# Content: where things go

Everything you write for the site lives in this folder. The site reads it when it
is built; there is no database.

| I want to add… | Do this |
| --- | --- |
| **A blog post** | `npm run new:post <name>` — see below |
| **A project** | Push a public GitHub repo: it shows up by itself. Put its write-up in the repo's `project/` folder (start from [`templates/project/`](../templates/project/)). Only a project *without* a public repo needs a file here: `content/projects/<name>.md` |
| **The bio on the home page** | Edit [`bio.md`](bio.md) (Dutch). The English version is [`bio.en.md`](bio.en.md): write it yourself, or leave it out and the build translates `bio.md` for you (see below) |
| **A free download in the shop** | Sources are in `content/shop/` (the LaTeX templates and the cheat sheet); then `npm run downloads:build` |

## Writing a blog post

A post is one LaTeX file in `content/blog/`; its file name is its address
(`content/blog/can-bus-sniffer.tex` is `/blog/can-bus-sniffer`). Its images go in
`public/blog/<name>/` and are referred to from the site root:
`\includegraphics{/blog/can-bus-sniffer/scope.png}`.

### Ways to make one

1. **Write it yourself, with a live preview** (the usual way).

   ```bash
   npm run new:post can-bus-sniffer "A CAN bus sniffer"
   npm run dev
   ```

   `new:post` makes `content/blog/can-bus-sniffer.tex` from the template, which shows every feature of the blog (headings, maths, code, figures, tables, callouts, diagrams): delete what you do not need. It also makes the folder `public/blog/can-bus-sniffer/` for the images. Then open <http://localhost:3000/blog/can-bus-sniffer>: the page refreshes by itself each time you save the `.tex` file (on save, not on every keystroke), in the site's real layout. To see what is possible first, open `/blog/template` while `npm run dev` runs; it is never part of the production site.

2. **Let a coding agent write it.** Give Claude Code your notes, a list of points or a rough text and ask for a post in `content/blog/`. It writes the `.tex`; you read it with the live preview from way 1 and ask for changes.

3. **A preview at a real address before you publish.** Take `\draft` out, put the post on its own branch and push it. Vercel builds a preview link for that branch alone, which you can open on any device. Drafts are left out of every production build, previews included, so the line has to go for a post to show there.

Writing it in Overleaf works for the text, but you only see the site's layout once the file is in `content/blog/`.

### Publishing

1. A new post is a **draft**: it shows on your machine only. Delete the `\draft` line near the top when it should be public.
2. Commit and push (`git add content/blog public/blog && git commit && git push`). When the repository is connected to Vercel, the site updates by itself; otherwise see [Deployment](../README.md#deployment).
3. Write in one language; the other is made at build time (see [The other language](#the-other-language)).

### Good to know

- Run `npm run dev` in the folder that has `node_modules` (the main checkout). In a Git worktree without its own `node_modules` the dev server does not start.
- `npm run blog:check <name>` also compiles the post to a PDF with `latexmk` (which has to be installed) and checks that the numbering of sections, figures, equations and references matches the site. It is optional.
- `mitaa.sty` in `content/blog/` is not a post: it holds the site's own macros as real LaTeX, so a post can compile to a PDF. Leave it where it is.

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

## The other language

You write in one language. At build time `npm run translate` (it also runs before `npm run build`) translates the bio and every published post into the other one, with the Claude API, and the site shows the result with a note that it is automatic. It needs `ANTHROPIC_API_KEY`; without it the other language shows your original with a note. The results go to `.translations/` (git-ignored): do not edit them, change the original instead. Drafts are not translated.
