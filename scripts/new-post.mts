/**
 * npm run new:post <slug> ["Title"]
 *
 * Starts a blog post: copies templates/blog/post.tex to content/blog/<slug>.tex
 * and makes public/blog/<slug>/ for its images. The file name is the URL
 * (/blog/<slug>).
 *
 * The new post is a draft: it shows under `npm run dev` and stays out of the
 * production site until you delete its `\draft` line. Its cover image and X
 * post link start commented out, so the template's placeholders never go live.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** lower-case words joined by single dashes: `can-bus-sniffer`. */
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** `can-bus-sniffer` → `Can Bus Sniffer`. */
export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** The characters LaTeX reads as commands, written so they print. */
function escapeTex(value: string): string {
  return value
    .replaceAll("\\", "\\textbackslash{}")
    .replace(/[&%$#_{}]/g, (char) => `\\${char}`)
    .replaceAll("~", "\\textasciitilde{}")
    .replaceAll("^", "\\textasciicircum{}");
}

/** `2026-11-16`, in the local time zone: the day the author is writing on. */
function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Replace one line of the template, and fail loudly if the template has changed shape. */
function replaceLine(source: string, pattern: RegExp, replacement: string, what: string): string {
  if (!pattern.test(source)) {
    throw new Error(`templates/blog/post.tex has no ${what} line to fill in (it has changed shape?)`);
  }
  // A function, so a `$` in the text (a title like "$5") is not read as a replacement pattern.
  return source.replace(pattern, () => replacement);
}

export interface NewPost {
  /** Absolute path of the new .tex file. */
  file: string;
  /** Absolute path of the folder for the post's images. */
  assets: string;
  title: string;
}

export function createPost(root: string, slug: string, title?: string, now: Date = new Date()): NewPost {
  if (!SLUG.test(slug)) {
    throw new Error(`"${slug}" is not a usable name: use lower-case words joined by dashes, like can-bus-sniffer`);
  }
  if (slug === "template") {
    throw new Error('"template" is the name of the dev-only template post; pick another name');
  }

  const file = path.join(root, "content/blog", `${slug}.tex`);
  const assets = path.join(root, "public/blog", slug);
  if (existsSync(file)) throw new Error(`content/blog/${slug}.tex exists already`);

  const templateFile = path.join(root, "templates/blog/post.tex");
  if (!existsSync(templateFile)) throw new Error("templates/blog/post.tex is missing");
  let source = readFileSync(templateFile, "utf8");

  const postTitle = title?.trim() || titleFromSlug(slug);

  // Everything above \documentclass is the template's own instructions.
  const header = [
    `% content/blog/${slug}.tex — the file name is the URL (/blog/${slug}).`,
    "% Started with `npm run new:post`: this is the template that shows every feature of the",
    "% blog, so delete what your post does not use (the same post is at /blog/template under",
    "% npm run dev). Everything before \\begin{document} is metadata.",
    "%",
    "% \\draft below keeps the post out of the production site; it still shows under npm run dev.",
    "% Delete that line to publish.",
    `% Put images in public/blog/${slug}/ and reference them from the site root: /blog/${slug}/diagram.png.`,
    "%",
    "% The same file compiles with latexmk (mitaa.sty supplies the site's macros):",
    `%   npm run blog:check ${slug}              compare the site's numbering with LaTeX's`,
    `%   npm run blog:check ${slug} -- --publish also copy the PDF to public/docs/blog/`,
    "",
  ].join("\n");

  source = replaceLine(source, /^\\title\{.*\}$/m, `\\title{${escapeTex(postTitle)}}`, "\\title");
  source = replaceLine(source, /^\\date\{.*\}$/m, `\\date{${isoDate(now)}}`, "\\date");
  source = replaceLine(
    source,
    /^\\coverimage\{.*$/m,
    `% \\coverimage{/blog/${slug}/cover.png}  % the index card and social image; put the file in public/blog/${slug}/`,
    "\\coverimage"
  );
  source = replaceLine(
    source,
    /^\\xpost\{.*$/m,
    '% \\xpost{https://x.com/<handle>/status/<id>}  % the "Discuss on X" link; set it once the post is shared',
    "\\xpost"
  );
  source = replaceLine(
    source,
    /^% \\draft\b.*$/m,
    "\\draft  % hidden in production, shown under npm run dev; delete this line to publish",
    "\\draft"
  );
  source = replaceLine(
    source,
    /^% \\pdf\{.*$/m,
    `% \\pdf{/docs/blog/${slug}.pdf}  % a "Download as PDF" button; npm run blog:check ${slug} -- --publish puts the file there`,
    "\\pdf"
  );

  // Last, on purpose: the header's own text mentions `\draft`, and the lines
  // above must find the template's metadata line, not this comment.
  source = replaceLine(source, /^[\s\S]*?(?=\\documentclass)/, header, "\\documentclass");

  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, source);
  mkdirSync(assets, { recursive: true });
  writeFileSync(path.join(assets, ".gitkeep"), "");

  return { file, assets, title: postTitle };
}

/* Run from the command line, not when a test imports createPost. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [slug, ...titleWords] = process.argv.slice(2);
  if (!slug) {
    console.error('usage: npm run new:post <slug> ["Title"]   e.g. npm run new:post can-bus-sniffer "A CAN bus sniffer"');
    process.exit(2);
  }
  try {
    const root = process.cwd();
    const post = createPost(root, slug, titleWords.join(" "));
    const rel = (p: string) => path.relative(root, p);
    console.log(`Created ${rel(post.file)}  ("${post.title}")`);
    console.log(`        and ${rel(post.assets)}/  for its images\n`);
    console.log("Next:");
    console.log(`  1. npm run dev, then open http://localhost:3000/blog/${slug} (saving the file refreshes it)`);
    console.log("  2. write the post; delete the template sections you do not need");
    console.log("  3. delete the \\draft line when it is ready to be public");
    console.log("  4. git add content/blog public/blog && git commit && git push");
  } catch (error) {
    console.error(`new:post: ${(error as Error).message}`);
    process.exit(1);
  }
}
