/**
 * Loaded before every test file (`node --import ./tests/setup.ts`, see the
 * `test` script). The blog tests render fixture posts, not the site's content:
 * `src/lib/blog/source.ts` reads these paths once, when it is first imported,
 * and only under NODE_ENV=test — so they have to be set before any import.
 * `TRANSLATIONS_DIR` is the same for `src/lib/translations.ts`: the machine
 * translations the site reads (here a hand-made one, for the tests).
 */
import path from "node:path";

(process.env as Record<string, string>).NODE_ENV = "test";
process.env.BLOG_CONTENT_DIR = path.join(process.cwd(), "tests/fixtures/blog");
process.env.BLOG_PUBLIC_DIR = path.join(process.cwd(), "tests/fixtures/public");
process.env.TRANSLATIONS_DIR = path.join(process.cwd(), "tests/fixtures/translations");
