import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SNAPSHOT_DIR = path.join(import.meta.dirname, "__snapshots__");

/**
 * Compare rendered output against a committed file.
 *
 * Deliberately hand-rolled rather than using the test runner's snapshot
 * support: the output is HTML, so keeping it in plain `.html` files means a
 * failing diff is readable and the accepted output can be inspected in a
 * browser. Run with `UPDATE_SNAPSHOTS=1` to accept changes.
 */
export function matchSnapshot(name: string, actual: string): void {
  const file = path.join(SNAPSHOT_DIR, `${name}.html`);

  if (process.env.UPDATE_SNAPSHOTS === "1" || !existsSync(file)) {
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
    writeFileSync(file, actual);
    return;
  }

  const expected = readFileSync(file, "utf8");
  if (actual === expected) return;

  // Point at the first differing line rather than dumping two 40 KB strings.
  const a = actual.split("\n");
  const b = expected.split("\n");
  const i = a.findIndex((line, index) => line !== b[index]);
  assert.fail(
    `snapshot "${name}" differs at line ${i + 1}\n` +
      `  expected: ${JSON.stringify(b[i]?.slice(0, 200))}\n` +
      `  actual:   ${JSON.stringify(a[i]?.slice(0, 200))}\n` +
      `Run UPDATE_SNAPSHOTS=1 npm test to accept.`
  );
}
