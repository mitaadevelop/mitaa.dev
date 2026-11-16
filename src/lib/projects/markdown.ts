import { randomUUID } from "node:crypto";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { visit } from "unist-util-visit";
import type { Code, Root } from "mdast";
import { diagramHtml } from "../diagram";

/**
 * Project markdown (curated pages, repo docs and READMEs) to HTML, with every
 * ```mermaid fence drawn as an SVG diagram by pele.
 *
 * remark-html sanitises its output, which is right for a README from anywhere,
 * and that filter would strip an SVG. So a diagram never goes through it: the
 * fence is swapped for a paragraph holding an unguessable token, and the token
 * is replaced with `diagramHtml` once the sanitised HTML exists. The Mermaid
 * text reaches pele, which escapes and filters it, and never the page.
 *
 * `transform` runs on the HTML before the diagrams go in (the repo docs make
 * their relative URLs absolute there), so it cannot touch the SVG.
 */
export async function markdownToHtml(
  markdown: string,
  options: { transform?: (html: string) => string; where?: string } = {}
): Promise<string> {
  const nonce = randomUUID().replaceAll("-", "");
  const sources: string[] = [];

  const swapDiagrams = () => (tree: Root) => {
    visit(tree, "code", (node: Code, index, parent) => {
      if (node.lang?.toLowerCase() !== "mermaid" || !parent || index === undefined) return;
      const id = sources.push(node.value) - 1;
      parent.children[index] = { type: "paragraph", children: [{ type: "text", value: `diagram${nonce}x${id}` }] };
    });
  };

  const processed = await remark().use(remarkGfm).use(swapDiagrams).use(remarkHtml).process(markdown);
  const html = options.transform ? options.transform(processed.toString()) : processed.toString();

  return html.replace(new RegExp(`<p>diagram${nonce}x(\\d+)</p>`, "g"), (_match, id: string) =>
    diagramHtml(sources[Number(id)] ?? "", { where: options.where })
  );
}
