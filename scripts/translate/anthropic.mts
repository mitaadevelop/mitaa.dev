import type { Request, Translator } from "./pipeline.mts";

const NAMES = { nl: "Dutch", en: "English" } as const;

const RULES = {
  latex: [
    "The text is part of a LaTeX document (a blog post).",
    "Translate only the running prose: sentences, headings, captions, list items, abstract, and the arguments of \\title, \\subtitle, \\excerpt and \\keywords.",
    "Leave every command, environment, brace, option and line break exactly as it is: do not add, remove, reorder or rename any of them.",
    "Leave mathematics ($...$, \\[...\\], equation and similar), code (lstlisting, minted, verbatim), \\label/\\ref/\\cite keys, file names, URLs and \\date untouched.",
    "Do not translate comments in code.",
  ],
  markdown: [
    "The text is Markdown.",
    "Translate only the prose. Leave code blocks, inline code, link URLs, image paths, HTML and the number and level of the headings exactly as they are.",
  ],
} as const;

function systemPrompt({ kind, from, to }: Request): string {
  return [
    `You translate technical writing from ${NAMES[from]} into ${NAMES[to]}.`,
    ...RULES[kind],
    "Keep technical terms and product names as they are (STM32, ESP32, PCB, firmware, I2C, Next.js, ...) unless the target language has a common established word.",
    "Keep the author's voice, register and sentence structure; do not summarise, explain or add anything.",
    "Reply with the translated text only: no preface, no notes, no code fence around it.",
  ].join("\n");
}

interface Options {
  apiKey: string;
  model: string;
  /** The Messages API endpoint; replaced in tests. */
  url?: string;
  fetchImpl?: typeof fetch;
  retries?: number;
}

/**
 * The translator behind the build: one call to the Messages API per piece, over
 * plain `fetch` (the site has no SDK dependency). Rate limits and 5xx are
 * retried with a pause; anything else throws and the piece counts as failed.
 */
export function anthropicTranslator({
  apiKey,
  model,
  url = "https://api.anthropic.com/v1/messages",
  fetchImpl = fetch,
  retries = 3,
}: Options): Translator {
  return async (request) => {
    let lastError = "";
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1500 * 2 ** (attempt - 1)));
      const response = await fetchImpl(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model,
          max_tokens: 8192,
          system: systemPrompt(request),
          messages: [{ role: "user", content: request.text }],
        }),
        signal: AbortSignal.timeout(180_000),
      });
      if (response.status === 429 || response.status >= 500) {
        lastError = `API answered ${response.status}`;
        continue;
      }
      if (!response.ok) throw new Error(`API answered ${response.status}: ${(await response.text()).slice(0, 200)}`);
      const result = (await response.json()) as {
        stop_reason?: string;
        content?: { type: string; text?: string }[];
      };
      if (result.stop_reason === "max_tokens") throw new Error("the answer was cut off (max_tokens)");
      const text = (result.content ?? []).filter((block) => block.type === "text").map((block) => block.text ?? "").join("");
      if (!text.trim()) throw new Error("the answer was empty");
      return text;
    }
    throw new Error(lastError || "no answer");
  };
}
