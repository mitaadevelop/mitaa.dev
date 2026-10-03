import type { BlogPost } from "@/lib/blog/types";
import { strings } from "@/lib/blog/i18n";
import { slugify } from "@/lib/blog/text";
import { AUTHOR_AVATAR, AUTHOR_BIO, AUTHOR_NAME, SITE_URL } from "@/lib/site";
import DiscussOnX from "./DiscussOnX";

/** Words a citation key skips, the way BibTeX tools pick the first real one. */
const STOPWORDS = new Set(["a", "an", "the", "de", "het", "een", "on", "of", "over"]);

/**
 * A BibTeX entry for the post: `reints2025prestatiekosten`. A blog post is
 * `@misc` — `@article` would need a journal.
 */
function bibtex(post: BlogPost): { key: string; fields: [string, string][] } {
  const author = post.author ?? AUTHOR_NAME;
  const surname = slugify(author.split(/\s+/).at(-1) ?? "").replaceAll("-", "");
  const year = post.date.slice(0, 4);
  const word =
    post.title
      .split(/\s+/)
      .map((w) => slugify(w).replaceAll("-", ""))
      .find((w) => w && !STOPWORDS.has(w)) ?? "";
  return {
    key: `${surname}${year}${word}`,
    fields: [
      ["author", author],
      ["title", post.title],
      ["year", year],
      ["url", `${SITE_URL}/blog/${post.slug}`],
    ],
  };
}

/** The end of a post: how to cite it, who wrote it, and where to discuss it. */
export default function ArticleEnd({ post }: Readonly<{ post: BlogPost }>) {
  const words = strings(post.lang);
  const { key, fields } = bibtex(post);
  const width = Math.max(...fields.map(([name]) => name.length));
  const initials = AUTHOR_NAME.split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="mt-12">
      {/* Built like a code listing, so it picks up the listing styles and copy button. */}
      <div className="prose-blog max-w-none">
        <figure className="listing">
          <figcaption className="listing-head">
            <span className="listing-file">{words.citeThis}</span>
            <span className="listing-meta">
              <span className="code-lang-label">BibTeX</span>
              <button
                type="button"
                className="listing-copy"
                data-copy="true"
                data-copied-label={words.copied}
                aria-label={`${words.copy} BibTeX`}
              >
                {words.copy}
              </button>
            </span>
          </figcaption>
          <pre>
            <code className="bibtex">
              <span className="line">
                <span className="hljs-keyword">@misc</span>
                {"{"}
                <span className="hljs-title">{key}</span>,
              </span>
              {fields.map(([name, value], i) => (
                <span key={name} className="line">
                  {`  ${name.padEnd(width)} = `}
                  <span className="hljs-string">{`{${value}}`}</span>
                  {i < fields.length - 1 ? "," : ""}
                </span>
              ))}
              <span className="line">{"}"}</span>
            </code>
          </pre>
        </figure>
      </div>

      <div className="mt-8 flex gap-4 border-t border-divider pt-6">
        {AUTHOR_AVATAR ? (
          // eslint-disable-next-line @next/next/no-img-element -- a 40px square; next/image buys nothing here
          <img src={AUTHOR_AVATAR} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-semibold text-foreground"
          >
            {initials}
          </span>
        )}
        <div>
          <p className="text-[14px] font-medium text-foreground">{post.author ?? AUTHOR_NAME}</p>
          <p className="mt-1 text-[13px] leading-[1.6] text-muted">{AUTHOR_BIO[post.lang]}</p>
        </div>
      </div>

      <DiscussOnX url={post.xPostUrl} lang={post.lang} />
    </div>
  );
}
