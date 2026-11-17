/**
 * The contribution calendar from the public profile page — the fallback for a
 * build with no GitHub token. The page is the one the profile shows to anyone,
 * so it carries public contributions only (and private ones if the owner turned
 * on "Private contributions" in the profile settings).
 *
 * Pure and synchronous so it can be tested against a saved page: `fetch` lives
 * in fetch-github-data.mjs. The result has the shape the GraphQL query gives,
 * which is what the heatmap reads.
 */

/** "No contributions on …" is 0; otherwise the number leads: "17 contributions on …". */
function countFromTooltip(text) {
  if (/^\s*No contributions/i.test(text)) return 0;
  const match = /^\s*([\d,.]+)\s+contributions?\b/i.exec(text);
  return match ? Number(match[1].replace(/[,.]/g, "")) : null;
}

/**
 * @param {string} html the page at https://github.com/users/<user>/contributions
 * @returns {{ totalContributions: number, weeks: { contributionDays: { date: string, contributionCount: number }[] }[] } | null}
 *   null when the page holds no calendar (the markup changed, or it is not the page)
 */
export function parseContributionsHtml(html) {
  // tooltip text by the id of the day it describes
  const counts = new Map();
  for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const count = countFromTooltip(m[2]);
    if (count !== null) counts.set(m[1], count);
  }

  // id="contribution-day-component-<weekday row>-<week column>", plus the date
  const columns = new Map();
  for (const m of html.matchAll(/<td\b[^>]*>/g)) {
    const tag = m[0];
    const id = /\bid="(contribution-day-component-(\d+)-(\d+))"/.exec(tag);
    const date = /\bdata-date="(\d{4}-\d{2}-\d{2})"/.exec(tag);
    if (!id || !date || !counts.has(id[1])) continue;
    const row = Number(id[2]);
    const column = Number(id[3]);
    if (!columns.has(column)) columns.set(column, []);
    columns.get(column).push({ row, date: date[1], contributionCount: counts.get(id[1]) });
  }
  if (columns.size === 0) return null;

  let totalContributions = 0;
  const weeks = [...columns.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, days]) => ({
      contributionDays: days
        .sort((a, b) => a.row - b.row)
        .map(({ date, contributionCount }) => {
          totalContributions += contributionCount;
          return { date, contributionCount };
        }),
    }));

  return { totalContributions, weeks };
}
