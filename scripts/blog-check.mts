/**
 * npm run blog:check <post> [-- --publish]
 *
 * Compiles a blog post with real LaTeX and checks that the site numbers it the
 * same way: every \label (sections, figures, tables, equations, theorems,
 * appendices) and every \bibitem, read from the .aux file LaTeX writes,
 * against the numbers the site's pipeline printed.
 *
 * Posts \usepackage{mitaa} (content/blog/mitaa.sty), which turns the site's own
 * macros into LaTeX, so the same file compiles unchanged.
 *
 * --publish copies the PDF to public/docs/blog/<post>.pdf, where \pdf{} can
 * point at it.
 *
 * Runs locally, like pcb:render — there is no TeX on Vercel. Needs latexmk on
 * the PATH, or LATEXMK=/path/to/latexmk.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
// The site's blog code is imported further down, once the environment it reads
// at import time (for a fixture post) has been set.

const LATEXMK = process.env.LATEXMK || "latexmk";
const root = process.cwd();
const args = process.argv.slice(2);
const slug = args.find((arg) => !arg.startsWith("--"));
const publish = args.includes("--publish");

if (!slug) {
  console.error("usage: npm run blog:check <post> [-- --publish]");
  process.exit(2);
}

// `template` is templates/blog/post.tex, as on the dev site; a post is looked
// up in content/blog, then among the test fixtures (tests/fixtures/blog).
const FIXTURES = path.join(root, "tests/fixtures/blog");
const candidates =
  slug === "template"
    ? [path.join(root, "templates/blog/post.tex")]
    : [path.join(root, "content/blog", `${slug}.tex`), path.join(FIXTURES, `${slug}.tex`)];
const source = candidates.find((file) => existsSync(file));
if (!source) {
  console.error(`no such post: content/blog/${slug}.tex or tests/fixtures/blog/${slug}.tex`);
  process.exit(2);
}
if (source.startsWith(FIXTURES)) {
  // The override only applies under NODE_ENV=test (see postsDirectory in source.ts).
  (process.env as Record<string, string>).NODE_ENV = "test";
  process.env.BLOG_CONTENT_DIR = FIXTURES;
  process.env.BLOG_PUBLIC_DIR = path.join(root, "tests/fixtures/public");
}

const outDir = path.join(root, "node_modules/.cache/blog-check", slug);
mkdirSync(outDir, { recursive: true });

console.log(`Compiling ${slug}.tex …`);
try {
  execFileSync(
    LATEXMK,
    ["-pdf", "-interaction=nonstopmode", "-halt-on-error", `-outdir=${outDir}`, source],
    {
      // mitaa.sty lives next to the posts; images are named from the site root.
      env: {
        ...process.env,
        TEXINPUTS: `${path.join(root, "content/blog")}//:${path.join(root, "public")}/:`,
      },
      stdio: ["ignore", "ignore", "inherit"],
    }
  );
} catch {
  const log = path.join(outDir, `${path.basename(source, ".tex")}.log`);
  const errors = existsSync(log)
    ? readFileSync(log, "utf8").split("\n").filter((line) => line.startsWith("!"))
    : [];
  console.error(`LaTeX failed${errors.length ? ":\n  " + errors.join("\n  ") : ""}\nSee ${log}`);
  process.exit(1);
}

const base = path.basename(source, ".tex");
const aux = readFileSync(path.join(outDir, `${base}.aux`), "utf8");
const log = readFileSync(path.join(outDir, `${base}.log`), "utf8");

// \newlabel{key}{{number}{page}{title}{anchor}{}} — cleveref adds key@cref twins.
const latexLabels = new Map<string, string>();
for (const match of aux.matchAll(/^\\newlabel\{([^}]+)\}\{\{([^{}]*)\}/gm)) {
  if (!match[1].endsWith("@cref")) latexLabels.set(match[1], match[2]);
}
const latexCitations = new Map<string, number>();
for (const match of aux.matchAll(/^\\bibcite\{([^}]+)\}\{([^}]*)\}/gm)) {
  latexCitations.set(match[1], Number(match[2]));
}

// The template is only served under `npm run dev`.
if (slug === "template") (process.env as Record<string, string>).NODE_ENV = "development";
const { getPostNumbering } = await import("../src/lib/blog/index.ts");
const site = await getPostNumbering(slug);
if (!site) {
  console.error(`the site does not render ${slug}`);
  process.exit(1);
}

const problems: string[] = [];
const compare = (kind: string, latex: Map<string, string | number>, web: Record<string, string | number>) => {
  for (const [key, number] of latex) {
    if (!(key in web)) problems.push(`${kind} ${key}: LaTeX ${number}, missing on the site`);
    else if (String(web[key]) !== String(number)) {
      problems.push(`${kind} ${key}: LaTeX ${number}, site ${web[key]}`);
    }
  }
  for (const key of Object.keys(web)) {
    if (!latex.has(key)) problems.push(`${kind} ${key}: site ${web[key]}, unknown to LaTeX`);
  }
};
compare("label", latexLabels, site.labels);
compare("citation", latexCitations, site.citations);

for (const line of log.split("\n")) {
  if (/undefined references|Reference `[^']+' on page \d+ undefined|Citation `[^']+' on page \d+ undefined/.test(line)) {
    problems.push(`LaTeX: ${line.trim()}`);
  }
}

console.log(`  ${latexLabels.size} labels, ${latexCitations.size} citations compared`);
if (problems.length > 0) {
  console.error(`\n${problems.length} difference(s):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("  ✓ the site and LaTeX agree on every number");

if (publish) {
  const target = path.join(root, "public/docs/blog", `${slug}.pdf`);
  mkdirSync(path.dirname(target), { recursive: true });
  copyFileSync(path.join(outDir, `${base}.pdf`), target);
  console.log(`  PDF → public/docs/blog/${slug}.pdf  (\\pdf{/docs/blog/${slug}.pdf})`);
}
