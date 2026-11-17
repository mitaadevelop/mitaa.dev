import path from "path";

/**
 * Where `scripts/translate-content.mts` writes the machine translations the
 * site shows: `.translations/` (git-ignored, made at build time). Under
 * `NODE_ENV=test` only, `TRANSLATIONS_DIR` replaces it (see `tests/setup.ts`).
 *
 * A module-level constant with a literal `NODE_ENV === "test"` condition, for the
 * same reason as `postsDirectory` in `blog/source.ts`: anything more dynamic
 * makes Turbopack trace the whole project into the server bundle.
 */
export const translationsDirectory =
  process.env.NODE_ENV === "test" && process.env.TRANSLATIONS_DIR
    ? path.resolve(process.env.TRANSLATIONS_DIR)
    : path.join(process.cwd(), ".translations");
