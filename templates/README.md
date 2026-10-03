# Templates

Starting points for the two kinds of content on mitaa.dev, one folder each:

| Folder | Contains | Guide |
| --- | --- | --- |
| [blog/](blog/) | `post.tex` — a LaTeX post to copy into `content/blog/` | [blog/README.md](blog/README.md) |
| [project/](project/) | `repo/` — the layout for a GitHub repo; `curated.md` — a hand-written project page | [project/README.md](project/README.md) |

Under `npm run dev` both are rendered on the site, through the same code as real content: [/blog/template](http://localhost:3000/blog/template) and [/projects/project-template](http://localhost:3000/projects/project-template). They are never part of a production build.
