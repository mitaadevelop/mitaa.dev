import type { LanguageStat } from "@/lib/projects/types";

interface Props {
  languages: LanguageStat[];
  /** Show the language names + percentages under the bar. */
  showLegend?: boolean;
}

/** A GitHub-style horizontal bar showing language composition of a repo. */
export function LanguageBar({ languages, showLegend = false }: Readonly<Props>) {
  if (!languages || languages.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        {languages.map((lang) => (
          <div
            key={lang.name}
            style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
            title={`${lang.name} ${lang.percentage}%`}
          />
        ))}
      </div>
      {showLegend && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {languages.map((lang) => (
            <span
              key={lang.name}
              className="flex items-center gap-1.5 text-[12px] text-muted"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: lang.color }}
              />
              {lang.name}
              <span className="text-date">{lang.percentage}%</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
