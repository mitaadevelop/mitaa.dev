/**
 * Loaded before every test file (`node --import ./tests/setup.ts`, see the
 * `test` script). The blog tests render fixture posts, not the site's content:
 * `src/lib/blog/source.ts` reads these paths once, when it is first imported,
 * and only under NODE_ENV=test — so they have to be set before any import.
 */
import path from "node:path";

(process.env as Record<string, string>).NODE_ENV = "test";
process.env.BLOG_CONTENT_DIR = path.join(process.cwd(), "tests/fixtures/blog");
process.env.BLOG_PUBLIC_DIR = path.join(process.cwd(), "tests/fixtures/public");
