import { test } from "node:test";
import assert from "node:assert/strict";
import { parseContributionsHtml } from "../scripts/contributions-html.mjs";

/** A day as the profile page draws it: the cell, and its tooltip somewhere else. */
function cell(row: number, column: number, date: string) {
  return `<td tabindex="0" data-ix="${column}" style="width: 11px" data-date="${date}" id="contribution-day-component-${row}-${column}" data-level="0" role="gridcell" class="ContributionCalendar-day"></td>`;
}
function tip(row: number, column: number, text: string) {
  return `<tool-tip id="tooltip-x${row}${column}" for="contribution-day-component-${row}-${column}" popover="manual" class="sr-only position-absolute">${text}</tool-tip>`;
}

// The page lists the cells row by row (every Sunday, then every Monday, …),
// not week by week, and the tooltips after all of them.
const PAGE = `
<table><tbody>
  <tr>${cell(0, 0, "2026-11-08")}${cell(0, 1, "2026-11-15")}</tr>
  <tr>${cell(1, 0, "2026-11-09")}${cell(1, 1, "2026-11-16")}</tr>
  <tr>${cell(2, 0, "2026-11-10")}</tr>
</tbody></table>
${tip(0, 0, "No contributions on November 8th.")}
${tip(0, 1, "1 contribution on November 15th.")}
${tip(1, 0, "No contributions on November 9th.")}
${tip(1, 1, "17 contributions on November 16th.")}
${tip(2, 0, "1,204 contributions on November 10th.")}
`;

test("the calendar comes out as weeks of days, in date order, with a total", () => {
  const calendar = parseContributionsHtml(PAGE);
  assert.ok(calendar);
  assert.equal(calendar.weeks.length, 2);
  assert.deepEqual(
    calendar.weeks.map((week: { contributionDays: { date: string }[] }) => week.contributionDays.map((day) => day.date)),
    [
      ["2026-11-08", "2026-11-09", "2026-11-10"],
      ["2026-11-15", "2026-11-16"],
    ]
  );
});

test("counts: none, one, many, and thousands with a separator", () => {
  const calendar = parseContributionsHtml(PAGE);
  assert.ok(calendar);
  const days = calendar.weeks.flatMap((week: { contributionDays: { date: string; contributionCount: number }[] }) => week.contributionDays);
  const byDate = Object.fromEntries(days.map((day) => [day.date, day.contributionCount]));
  assert.deepEqual(byDate, {
    "2026-11-08": 0,
    "2026-11-09": 0,
    "2026-11-10": 1204,
    "2026-11-15": 1,
    "2026-11-16": 17,
  });
  assert.equal(calendar.totalContributions, 1222);
});

test("a page without a calendar gives null, so the build can say the markup changed", () => {
  assert.equal(parseContributionsHtml("<html><body>Not Found</body></html>"), null);
  assert.equal(parseContributionsHtml(""), null);
});

test("a day whose tooltip is missing is left out rather than counted as zero", () => {
  const calendar = parseContributionsHtml(`${cell(0, 0, "2026-11-08")}${cell(0, 1, "2026-11-15")}${tip(0, 1, "2 contributions on November 15th.")}`);
  assert.ok(calendar);
  assert.equal(calendar.weeks.length, 1);
  assert.equal(calendar.totalContributions, 2);
});
