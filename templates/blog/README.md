# Blog template

Copy [post.tex](post.tex) to `content/blog/<slug>.tex`. The file name is the URL: `content/blog/can-bus-sniffer.tex` → `/blog/can-bus-sniffer`.

- **Metadata** goes before `\begin{document}`: `\title`, `\date{YYYY-MM-DD}`, `\excerpt` (card text and meta description), `\tags{A, B}`, and optionally `\subtitle`, `\author`, `\affiliation`, `\version{v2}{YYYY-MM-DD}`, `\kind{Report}`, `\keywords{a, b}`, `\pdf{/docs/blog/<slug>.pdf}`, `\coverimage`, `\xpost`, `\paginate` and `\draft` (dev only).
- **Language**: `\usepackage[dutch]{babel}` (or `\lang{nl}`) gives the post Dutch labels — Figuur, Tabel, Definitie, Inhoud, Pagina 2 van 5. Without it the post is English.
- **Abstract**: an `abstract` before the first `\section` is shown in the header, with the keywords under it.
- **Images** go in `public/blog/<slug>/` and are referenced from the site root: `\includegraphics[width=0.6\textwidth]{/blog/<slug>/scope.png}`.
- **Pages**: with `\paginate{auto}` (the default) a post is split into one page per `\section` only when it has 6+ sections *and* 2000+ words; force it with `always` or `never`. Or decide yourself: `\clearpage` between sections sets the pages, and one page may hold several sections. Pages after `\appendix` are called "Appendices", and their sections are lettered A, B, …
- **References print what LaTeX prints**: `\ref` the number alone (write `Figure~\ref{x}`), `\Cref` / `\autoref` the word and the number, `\cref` the word in lower case, `\eqref` "(3)". Sections, figures, tables, numbered `equation`s, theorems and listings with a `caption=` can all be labelled. Forward references work.
- **Citations**: `\cite{a,b}` gives "[1, 2]", `\cite[p.~12]{a}` "[1, p. 12]", numbered in `\bibitem` order. The bibliography is printed where `thebibliography` stands. A key that is neither a label nor a bibitem shows up as `[?key]` — search the page for that before publishing.
- **The PDF**: `npm run blog:check <slug>` compiles the post with latexmk (via `content/blog/mitaa.sty`) and checks that every number on the site matches the PDF; `-- --publish` copies the PDF to `public/docs/blog/<slug>.pdf` for `\pdf{}`. `npm run blog:check template` checks this template.
- The full supported subset is in `AGENTS.md`; the fixtures in `content/blog/` show every feature rendered, `report-design-showcase.tex` every report feature in one post.
- Check it with `npm run dev` — untranslated macros and environments are logged to the terminal — then `npm test`.

Preview under `npm run dev`: [/blog/template](http://localhost:3000/blog/template) renders [post.tex](post.tex) through the real pipeline.
