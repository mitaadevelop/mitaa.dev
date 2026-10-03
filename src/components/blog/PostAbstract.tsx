import type { BlogPost } from "@/lib/blog/types";
import { strings } from "@/lib/blog/i18n";

interface PostAbstractProps {
  post: BlogPost;
  abstract: { title: string; html: string };
}

/** The abstract with its keywords, at the top of page 1. */
export default function PostAbstract({ post, abstract }: Readonly<PostAbstractProps>) {
  const words = strings(post.lang);
  return (
    <div className="prose-blog max-w-none">
      <section className="abstract" aria-label={abstract.title}>
        <p className="abstract-title">{abstract.title}</p>
        <div dangerouslySetInnerHTML={{ __html: abstract.html }} />
        {post.keywords.length > 0 && (
          <p className="mt-2 text-muted">
            <em>{words.keywords}:</em> {post.keywords.join(" · ")}
          </p>
        )}
      </section>
    </div>
  );
}
