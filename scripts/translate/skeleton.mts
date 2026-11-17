/**
 * What a translation must not change. `latexSkeleton` and `markdownSkeleton`
 * reduce a text to the list of things that are structure, not prose: commands,
 * environments, labels and citation keys, maths, code. A translation is accepted
 * only when its skeleton equals the original's — a model that drops a `\label`,
 * rewrites a formula or "translates" a code comment fails here, not on the page.
 */

/** Environments whose body is code: kept exactly. */
const VERBATIM_ENVIRONMENTS = ["lstlisting", "minted", "verbatim"];

/** Commands whose argument is an identifier or a path, not prose: kept exactly. */
const EXACT_ARGUMENT = new Set([
  "label", "ref", "Cref", "cref", "autoref", "eqref", "cite", "bibitem", "includegraphics",
  "coverimage", "pdf", "date", "draft", "xpost", "tags", "paginate", "kind", "version",
  "url", "href", "input", "include",
]);

/** `{…}` starting at `from` (which must be the opening brace), or null. */
function braced(text: string, from: number): { value: string; end: number } | null {
  if (text[from] !== "{") return null;
  let depth = 0;
  for (let index = from; index < text.length; index++) {
    const character = text[index];
    if (character === "\\") { index++; continue; }
    if (character === "{") depth++;
    else if (character === "}" && --depth === 0) return { value: text.slice(from + 1, index), end: index + 1 };
  }
  return null;
}

/** Text with `%` comments removed (a comment is prose too, but never structure). */
function withoutComments(text: string): string {
  return text.replace(/(^|[^\\])%.*$/gm, "$1");
}

export function latexSkeleton(source: string): string[] {
  const text = withoutComments(source);
  const skeleton: string[] = [];
  const verbatim = new RegExp(
    `\\\\begin\\{(${VERBATIM_ENVIRONMENTS.join("|")})\\}(\\[[^\\]]*\\])?([\\s\\S]*?)\\\\end\\{\\1\\}`,
    "g"
  );

  // Code blocks first: their body is compared whole and then hidden from the rest.
  const codeBlocks: string[] = [];
  const rest = text.replace(verbatim, (_match, name: string, options: string | undefined, body: string) => {
    codeBlocks.push(`code:${name}${options ?? ""}:${body}`);
    return `\\codeblock`;
  });

  // Maths: compared whole, then hidden.
  const maths: string[] = [];
  const prose = rest
    .replace(/\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\)|(?<!\\)\$(?:\\.|[^$\\])+\$/g, (match) => {
      maths.push(`math:${match.replace(/\s+/g, " ")}`);
      return " \\mathblock ";
    })
    .replace(/\\begin\{(equation|align|gather|multline|eqnarray)(\*?)\}([\s\S]*?)\\end\{\1\2\}/g, (_m, name, star, body) => {
      maths.push(`math:${name}${star}:${String(body).replace(/\s+/g, " ")}`);
      return " \\mathblock ";
    });

  const token = /\\(begin|end)\{([^}]*)\}(\[[^\]]*\])?|\\([a-zA-Z]+)\*?/g;
  let match: RegExpExecArray | null;
  while ((match = token.exec(prose))) {
    if (match[1]) {
      skeleton.push(`${match[1]}:${match[2]}${match[1] === "begin" ? (match[3] ?? "") : ""}`);
      continue;
    }
    const name = match[4];
    if (name === "codeblock" || name === "mathblock") continue;
    skeleton.push(`cmd:${name}`);
    if (EXACT_ARGUMENT.has(name)) {
      let at = match.index + match[0].length;
      while (prose[at] === "[") at = prose.indexOf("]", at) + 1 || prose.length;
      const argument = braced(prose, at);
      if (argument) skeleton.push(`arg:${name}:${argument.value}`);
    }
  }
  return [...skeleton, ...codeBlocks, ...maths];
}

/** Markdown: code (fenced and inline), links, images and the number of headings. */
export function markdownSkeleton(text: string): string[] {
  const skeleton: string[] = [];
  const withoutFences = text.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm, (block) => {
    skeleton.push(`fence:${block}`);
    return "";
  });
  for (const match of withoutFences.matchAll(/`[^`\n]+`/g)) skeleton.push(`code:${match[0]}`);
  for (const match of withoutFences.matchAll(/!?\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)) skeleton.push(`${match[0][0] === "!" ? "img" : "link"}:${match[1]}`);
  for (const match of withoutFences.matchAll(/<(https?:[^>\s]+)>|\bhttps?:\/\/[^\s)>\]]+/g)) skeleton.push(`url:${match[1] ?? match[0]}`);
  for (const match of withoutFences.matchAll(/^(#{1,6})\s/gm)) skeleton.push(`heading:${match[1].length}`);
  return skeleton;
}
