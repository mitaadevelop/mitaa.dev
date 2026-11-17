import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { chunkDocument } from "../scripts/translate/chunk.mts";
import { latexSkeleton, markdownSkeleton } from "../scripts/translate/skeleton.mts";
import { memoryCache, setLatexLanguage, translateDocument, type Translator } from "../scripts/translate/pipeline.mts";
import { anthropicTranslator } from "../scripts/translate/anthropic.mts";

const POST = String.raw`\documentclass{article}
\usepackage[dutch]{babel}
\title{Een korte post}
\date{2026-11-17}

\begin{document}
\section{Inleiding}\label{sec:intro}
De spanning is $V = I R$ en volgt uit figuur~\ref{fig:a}~\cite{ohm}.

\begin{lstlisting}[language=c, title=main.c]
// zet de pin hoog

int x = 1;
\end{lstlisting}

\begin{itemize}
\item Eerste punt.
\item Tweede punt.
\end{itemize}

\begin{thebibliography}{9}
\bibitem{ohm} G. Ohm, 1827.
\end{thebibliography}
\end{document}
`;

/** A translator that "translates" by swapping a few words, like a model that does its job. */
const swap: Translator = async ({ text }) =>
  text.replace(/De spanning is/g, "The voltage is").replace(/Inleiding/g, "Introduction").replace(/Eerste punt/g, "First point");

describe("chunking", () => {
  test("the pieces glue back into the original, whatever the size", () => {
    for (const max of [40, 200, 5000]) assert.equal(chunkDocument(POST, "latex", max).join(""), POST);
  });

  test("a code block is never cut, even with a blank line inside it", () => {
    const chunks = chunkDocument(POST, "latex", 40);
    const holder = chunks.find((chunk) => chunk.includes("\\begin{lstlisting}"));
    assert.ok(holder?.includes("\\end{lstlisting}"), "begin and end are in the same piece");
    assert.ok(chunks.length > 3, "the document was cut elsewhere");
  });

  test("a Markdown fence is kept whole", () => {
    const text = "Intro\n\n```ts\nconst a = 1;\n\nconst b = 2;\n```\n\nOutro\n";
    const chunks = chunkDocument(text, "markdown", 10);
    assert.equal(chunks.join(""), text);
    assert.ok(chunks.some((chunk) => chunk.includes("const a = 1;") && chunk.includes("const b = 2;")));
  });
});

describe("the skeleton", () => {
  test("prose changes do not change it", () => {
    assert.deepEqual(latexSkeleton(POST), latexSkeleton(String(POST).replace("Eerste punt", "First point").replace("Inleiding", "Introduction")));
  });

  test("a dropped label, a changed key, a rewritten formula or translated code each change it", () => {
    const base = JSON.stringify(latexSkeleton(POST));
    for (const broken of [
      POST.replace("\\label{sec:intro}", ""),
      POST.replace("\\cite{ohm}", "\\cite{ohms}"),
      POST.replace("$V = I R$", "$U = I R$"),
      POST.replace("// zet de pin hoog", "// set the pin high"),
      POST.replace("\\item Tweede punt.", ""),
      POST.replace("\\date{2026-11-17}", "\\date{17 november 2026}"),
    ]) {
      assert.notEqual(JSON.stringify(latexSkeleton(broken)), base);
    }
  });

  test("Markdown: code, links and headings are structure", () => {
    const text = "# Titel\n\nZie [de site](https://mitaa.dev) en `npm test`.\n\n```sh\nnpm run build\n```\n";
    const translated = text.replace("Titel", "Title").replace("Zie", "See").replace("de site", "the site");
    assert.deepEqual(markdownSkeleton(text), markdownSkeleton(translated));
    assert.notDeepEqual(markdownSkeleton(text), markdownSkeleton(text.replace("https://mitaa.dev", "https://example.com")));
    assert.notDeepEqual(markdownSkeleton(text), markdownSkeleton(text.replace("npm run build", "npm run start")));
    assert.notDeepEqual(markdownSkeleton(text), markdownSkeleton(text.replace("# Titel", "## Titel")));
  });
});

describe("translating a document", () => {
  const options = (translator: Translator, cache = memoryCache()) => ({ translator, cache, model: "test-model", maxChars: 200 });

  test("a good translation comes back with the structure intact", async () => {
    const result = await translateDocument({ kind: "latex", text: POST, from: "nl", to: "en" }, options(swap));
    assert.ok(result);
    assert.match(result, /The voltage is \$V = I R\$/);
    assert.match(result, /\\section\{Introduction\}\\label\{sec:intro\}/);
    assert.deepEqual(latexSkeleton(result), latexSkeleton(POST));
  });

  test("a second run is answered from the cache and calls the model for nothing", async () => {
    const cache = memoryCache();
    let calls = 0;
    const counting: Translator = async (request) => (calls++, swap(request));
    await translateDocument({ kind: "latex", text: POST, from: "nl", to: "en" }, options(counting, cache));
    const first = calls;
    assert.ok(first > 0);
    await translateDocument({ kind: "latex", text: POST, from: "nl", to: "en" }, options(counting, cache));
    assert.equal(calls, first);
  });

  test("changing one paragraph translates only that paragraph again", async () => {
    const cache = memoryCache();
    let calls = 0;
    const counting: Translator = async (request) => (calls++, swap(request));
    await translateDocument({ kind: "latex", text: POST, from: "nl", to: "en" }, options(counting, cache));
    const before = calls;
    await translateDocument({ kind: "latex", text: POST.replace("Tweede punt", "Derde punt"), from: "nl", to: "en" }, options(counting, cache));
    assert.ok(calls - before >= 1 && calls - before <= 2, `${calls - before} calls`);
  });

  test("a translation that breaks the structure is retried once, then the document is not translated", async () => {
    let calls = 0;
    const dropsLabel: Translator = async ({ text }) => (text.includes("\\label") && calls++, text.replace(/\\label\{[^}]*\}/g, ""));
    const result = await translateDocument({ kind: "latex", text: POST, from: "nl", to: "en" }, options(dropsLabel));
    assert.equal(result, null);
    assert.equal(calls, 2, "the piece with the label: one try and one retry");
  });

  test("a retry can succeed", async () => {
    let calls = 0;
    const flaky: Translator = async (request) => {
      calls++;
      if (calls === 1) throw new Error("overloaded");
      return swap(request);
    };
    const result = await translateDocument({ kind: "latex", text: POST, from: "nl", to: "en" }, options(flaky));
    assert.ok(result);
  });

  test("an answer wrapped in a code fence is unwrapped", async () => {
    const fenced: Translator = async (request) => "```latex\n" + (await swap(request)).trim() + "\n```";
    const result = await translateDocument({ kind: "latex", text: POST, from: "nl", to: "en" }, options(fenced));
    assert.ok(result);
    assert.ok(!result.includes("```"));
    assert.equal(result.trim().startsWith("\\documentclass"), true);
  });

  test("with no key, the cache alone is enough, and a miss is a fallback, not an error", async () => {
    const cache = memoryCache();
    const noKey: Translator = async () => {
      throw new Error("no ANTHROPIC_API_KEY");
    };
    assert.equal(await translateDocument({ kind: "latex", text: POST, from: "nl", to: "en" }, options(noKey, cache)), null);
    await translateDocument({ kind: "latex", text: POST, from: "nl", to: "en" }, options(swap, cache));
    assert.ok(await translateDocument({ kind: "latex", text: POST, from: "nl", to: "en" }, options(noKey, cache)));
  });
});

describe("the language a translation declares", () => {
  test("Dutch babel becomes English, in the preamble only", () => {
    const listing = POST.replace("\\item Eerste punt.", "\\item Eerste punt. \\usepackage[dutch]{babel}");
    const result = setLatexLanguage(listing, "en");
    assert.match(result.split("\\begin{document}")[0], /\\usepackage\[english\]\{babel\}/);
    assert.match(result.split("\\begin{document}")[1], /\\usepackage\[dutch\]\{babel\}/);
  });

  test("a \\lang line is replaced, and English to Dutch gets one", () => {
    assert.match(setLatexLanguage("\\documentclass{article}\n\\lang{nl}\n\\begin{document}\nx\\end{document}\n", "en"), /^(?![\s\S]*\\lang\{nl\})/);
    const dutch = setLatexLanguage("\\documentclass{article}\n\\title{Hello}\n\\begin{document}\nx\\end{document}\n", "nl");
    assert.match(dutch, /\\lang\{nl\}\n\n\\begin\{document\}/);
  });
});

describe("the Messages API call", () => {
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
  const ok = { stop_reason: "end_turn", content: [{ type: "text", text: "Hello" }] };

  test("sends the key and the text, and returns the answer", async () => {
    let seen: { headers: Record<string, string>; body: { model: string; system: string; messages: { content: string }[] } } | undefined;
    const translator = anthropicTranslator({
      apiKey: "test-key",
      model: "test-model",
      fetchImpl: async (_url, init) => {
        seen = { headers: init!.headers as Record<string, string>, body: JSON.parse(init!.body as string) };
        return reply(ok);
      },
    });
    assert.equal(await translator({ kind: "markdown", text: "Hallo", from: "nl", to: "en" }), "Hello");
    assert.equal(seen?.headers["x-api-key"], "test-key");
    assert.equal(seen?.body.model, "test-model");
    assert.equal(seen?.body.messages[0].content, "Hallo");
    assert.match(seen!.body.system, /from Dutch into English/);
  });

  test("a rate limit is retried; a cut-off answer is an error", async () => {
    let calls = 0;
    const retried = anthropicTranslator({
      apiKey: "k", model: "m", retries: 2,
      fetchImpl: async () => (++calls === 1 ? reply({}, 429) : reply(ok)),
    });
    // the pause between tries is real, so keep it short by only retrying once
    assert.equal(await retried({ kind: "markdown", text: "x", from: "nl", to: "en" }), "Hello");
    assert.equal(calls, 2);

    const cut = anthropicTranslator({ apiKey: "k", model: "m", fetchImpl: async () => reply({ ...ok, stop_reason: "max_tokens" }) });
    await assert.rejects(cut({ kind: "markdown", text: "x", from: "nl", to: "en" }), /cut off/);
    const bad = anthropicTranslator({ apiKey: "k", model: "m", fetchImpl: async () => reply({ error: "no" }, 401) });
    await assert.rejects(bad({ kind: "markdown", text: "x", from: "nl", to: "en" }), /401/);
  });
});
