// Side-effect import: registers \ce{} and \pu{} on the KaTeX instance that
// rehype-katex renders with. Must stay the first import — and there must be
// exactly one copy of katex in the tree (`npm ls katex`), or it patches the
// wrong instance and every \ce{} renders as a red error.
import "katex/contrib/mhchem";

/**
 * KaTeX render settings. Note that `throwOnError` is deliberately absent:
 * rehype-katex hardcodes it to true, catches the error itself, files a vfile
 * message and re-renders with throwOnError:false. Passing it has no effect.
 */
export const KATEX_OPTIONS = {
  strict: "warn" as const,
  trust: false,
  maxExpand: 1000,
  maxSize: 50,
  output: "htmlAndMathml" as const,
  errorColor: "#cc0000",
};

/** Macros available in every post. Cloned per render — see renderLatex. */
export const KATEX_MACROS: Record<string, string> = {
  "\\R": "\\mathbb{R}",
  "\\C": "\\mathbb{C}",
  "\\Z": "\\mathbb{Z}",
  "\\N": "\\mathbb{N}",
  "\\eps": "\\varepsilon",
  "\\dd": "\\,\\mathrm{d}",
  "\\abs": "\\left|#1\\right|",
  "\\norm": "\\left\\lVert#1\\right\\rVert",
  "\\set": "\\left\\{#1\\right\\}",
  "\\vect": "\\boldsymbol{#1}",
  "\\unit": "\\,\\mathrm{#1}",
};
