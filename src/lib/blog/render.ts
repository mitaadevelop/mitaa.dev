import { unified } from "unified";
import { VFile } from "vfile";
import { unifiedLatexToHast } from "@unified-latex/unified-latex-to-hast";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { common } from "lowlight";
import latexLanguage from "highlight.js/lib/languages/latex";
import rehypeStringify from "rehype-stringify";
import type { Root } from "hast";
import type { TocItem } from "./types";
import { prepareLatex, type LatexNode, type RenderContext } from "./latex";
import { KATEX_MACROS, KATEX_OPTIONS } from "./katex";
import { rehypeCodeLines, rehypeDiagrams, rehypeLatexFixups, rehypeWrapDisplayMath } from "./hast";
import { strings } from "./i18n";

export interface RenderResult {
  html: string;
  toc: TocItem[];
}

/**
 * Environments unified-latex passes through as `<div class="environment x">`
 * on purpose. Any other name there is an environment this blog does not
 * translate — its content survives, but its meaning does not.
 */
const PASSTHROUGH_ENVIRONMENTS = new Set([
  "quote", "quotation", "verse", "center", "flushleft", "flushright", "itemize",
  "enumerate", "description", "tabular", "document",
]);

/**
 * Names of macros and environments in rendered HTML that the pipeline did not
 * translate. unified-latex emits an empty `<span class="macro macro-x">` for an
 * unknown macro, silently swallowing it, so anything here is lost content.
 */
export function findUntranslated(html: string): { macros: string[]; environments: string[] } {
  const macros = [...html.matchAll(/class="macro macro-([^"\s]+)"/g)].map((m) => m[1]);
  const environments = [...html.matchAll(/class="environment ([^"\s]+)"/g)]
    .map((m) => m[1])
    .filter((name) => !PASSTHROUGH_ENVIRONMENTS.has(name));
  if (html.includes("unknown-directive")) environments.push("unknown-directive");
  return { macros: [...new Set(macros)], environments: [...new Set(environments)] };
}

/** Render a prepared LaTeX fragment to HTML. */
export async function renderLatex(
  nodes: LatexNode[],
  opts: { ctx: RenderContext; firstHeadingId?: string; source?: string }
): Promise<RenderResult> {
  const toc: TocItem[] = [];
  const words = strings(opts.ctx.lang);
  const prepared = prepareLatex(nodes, opts.ctx);

  // @unified-latex/unified-latex-to-hast depends on @types/hast v2 while this
  // project is on v3. The trees are structurally identical, but TypeScript
  // treats the two `Root`s as unrelated, and forcing a single version through
  // an override would move the errors inside unified-latex's own declarations.
  // The casts are confined to these two statements.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const hast = (unified() as any)
    .use(unifiedLatexToHast)
    .runSync({ type: "root", content: prepared }) as Root;

  const processor = (unified() as any)
    .use(rehypeLatexFixups, { toc, firstHeadingId: opts.firstHeadingId, ctx: opts.ctx })
    // KaTeX mutates `macros` to store \gdef definitions and rehype-katex hands
    // the same settings object to every render, so clone it or a \gdef in one
    // post leaks into the next.
    .use(rehypeKatex, { ...KATEX_OPTIONS, macros: { ...KATEX_MACROS } })
    .use(rehypeWrapDisplayMath)
    // `latex` is not in highlight.js's common set, and a blog written in LaTeX
    // shows LaTeX in its listings more than anything else. `languages`
    // replaces the default set rather than extending it, so spread `common`
    // back in — without it nothing but LaTeX was ever highlighted. Detection
    // stays limited to LaTeX, as before: a `verbatim` block of LaTeX source is
    // still coloured, and nothing else gets guessed at.
    .use(rehypeHighlight, {
      detect: true,
      subset: ["latex"],
      languages: { ...common, latex: latexLanguage },
    })
    .use(rehypeCodeLines)
    // Last, so highlighting and code lines never see the diagram's own <pre>.
    .use(rehypeDiagrams, {
      words: {
        diagram: words.diagram,
        showSource: words.showDiagramSource,
        failed: words.diagramFailed,
      },
      where: opts.source,
    })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const file = new VFile();
  const tree = await processor.run(hast, file);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // rehype-katex reports broken formulas as non-fatal messages and renders them
  // red rather than throwing, so surface them during development.
  if (process.env.NODE_ENV !== "production") {
    for (const message of file.messages) console.warn(`[blog] ${message.reason}`);
  }
  const html: string = processor.stringify(tree);

  if (process.env.NODE_ENV !== "production") {
    const { macros, environments } = findUntranslated(html);
    const where = opts.source ? ` in ${opts.source}` : "";
    for (const name of macros) console.warn(`[blog] \\${name} is not translated${where}`);
    for (const name of environments) console.warn(`[blog] environment "${name}" is not translated${where}`);
  }

  return { html, toc };
}
