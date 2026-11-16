import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { formatDate } from "../src/lib/date.ts";

describe("formatDate", () => {
  // Node re-reads TZ when it changes, so this puts the process west of UTC —
  // where the bug this helper exists to prevent actually shows up.
  const previous = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";

  test("keeps the calendar day west of UTC", () => {
    // Guard: prove the environment reproduces the bug, or this test proves nothing.
    const naive = new Date("2026-09-18").toLocaleDateString("en-US", { day: "numeric" });
    assert.equal(naive, "17", "expected the naive formatting to slip a day in this time zone");

    assert.equal(formatDate("2026-09-18", "short"), "Sep 18, 2026");
    assert.equal(formatDate("2026-09-18", "long"), "September 18, 2026");
  });

  test("the first of the month stays in its own month", () => {
    assert.equal(formatDate("2026-07-01", "month"), "Jul 2026");
  });

  test("missing and unparseable dates return null", () => {
    assert.equal(formatDate(undefined), null);
    assert.equal(formatDate(""), null);
    assert.equal(formatDate("not a date"), null);
  });

  test.after(() => {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  });
});
