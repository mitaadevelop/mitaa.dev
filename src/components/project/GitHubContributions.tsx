"use client";

import { useEffect, useState } from "react";
import { GitHubIcon } from "@/components/site/icons";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import ScrollReveal from "@/components/site/ScrollReveal";
import { formatDate } from "@/lib/date";

const GITHUB_URL = "https://github.com/mitaadevelop";

// Cell geometry (px) — kept in JS so the month labels can align exactly.
const CELL = 11;
const GAP = 3;
const PITCH = CELL + GAP;
const DAY_LABEL_W = 28;

interface ContributionDay {
  date: string;
  contributionCount: number;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface ContributionData {
  totalContributions: number;
  weeks: ContributionWeek[];
}

// Green scale (empty cell uses a theme-aware token so it works in light & dark).
const LEVEL_COLORS = [
  "bg-secondary",
  "bg-emerald-500/25",
  "bg-emerald-500/50",
  "bg-emerald-500/75",
  "bg-emerald-500",
];

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getMonthLabels(weeks: ContributionWeek[]) {
  const labels: { label: string; col: number }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, i) => {
    const firstDay = week.contributionDays[0];
    if (!firstDay) return;
    const month = new Date(firstDay.date).getMonth();
    // Skip the very first column so a label never sits half-off the left edge.
    if (month !== lastMonth && i > 0) {
      labels.push({ label: MONTH_LABELS[month], col: i });
      lastMonth = month;
    } else if (lastMonth === -1) {
      lastMonth = month;
    }
  });

  return labels;
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export default function GitHubContributions() {
  const [data, setData] = useState<ContributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/data/github-contributions.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <section className="pb-16">
      <h2 className="text-[13px] font-medium tracking-[0.8px] uppercase text-muted mb-6 flex items-center gap-2">
        <GitHubIcon size={14} /> GitHub Activity
      </h2>

      <div className="rounded-xl border border-border bg-card p-6">
        {error && (
          <div className="flex items-center justify-center h-32 text-center">
            <p className="text-muted text-[13px] max-w-sm">
              Contribution data isn&apos;t available right now.{" "}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-500 hover:underline"
              >
                View activity on GitHub
              </a>
              .
            </p>
          </div>
        )}

        {!error && loading && (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-3 text-muted text-[13px]">
              <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              Loading contributions…
            </div>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Summary row */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <p className="text-[13px] text-muted">
                <span className="text-foreground font-semibold">
                  <CountingNumber number={data.totalContributions} inView />
                </span>{" "}
                contributions in the last year
              </p>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-muted hover:text-foreground transition-colors shrink-0"
              >
                View on GitHub →
              </a>
            </div>

            {/* Heatmap — the week columns sweep in the first time it scrolls into view */}
            <ScrollReveal
              variant="stagger"
              selector="[data-week]"
              stagger={0.012}
              rise={0}
              className="overflow-x-auto pb-1"
            >
              <div className="inline-block">
                {/* Month labels */}
                <div
                  className="relative h-4 text-[10px] text-muted select-none"
                  style={{ marginLeft: DAY_LABEL_W + GAP }}
                >
                  {getMonthLabels(data.weeks).map(({ label, col }, i) => (
                    <span
                      key={`${label}-${i}`}
                      className="absolute top-0"
                      style={{ left: col * PITCH }}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {/* Day labels + week columns */}
                <div className="flex" style={{ gap: GAP }}>
                  <div
                    className="flex flex-col text-[10px] text-muted select-none shrink-0"
                    style={{ gap: GAP, width: DAY_LABEL_W }}
                  >
                    {DAY_LABELS.map((d, i) => (
                      <span key={i} style={{ height: CELL, lineHeight: `${CELL}px` }}>
                        {d}
                      </span>
                    ))}
                  </div>

                  {data.weeks.map((week, wi) => (
                    <div key={wi} data-gsap data-week className="flex flex-col" style={{ gap: GAP }}>
                      {week.contributionDays.map((day) => {
                        const level = getLevel(day.contributionCount);
                        return (
                          <div
                            key={day.date}
                            className={`rounded-[2px] ${LEVEL_COLORS[level]} transition-colors hover:ring-1 hover:ring-emerald-500/60`}
                            style={{ width: CELL, height: CELL }}
                            title={`${day.contributionCount} contribution${
                              day.contributionCount === 1 ? "" : "s"
                            } on ${formatDate(day.date, "short")}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Legend */}
            <div className="flex items-center justify-end gap-1.5 mt-4 text-[11px] text-muted">
              <span className="mr-1">Less</span>
              {LEVEL_COLORS.map((color, i) => (
                <div
                  key={i}
                  className={`rounded-[2px] ${color}`}
                  style={{ width: CELL, height: CELL }}
                />
              ))}
              <span className="ml-1">More</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
