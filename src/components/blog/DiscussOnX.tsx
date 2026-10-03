import { XIcon } from "@/components/site/icons";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import type { Lang } from "@/lib/blog/types";
import { strings } from "@/lib/blog/i18n";

interface DiscussOnXProps {
  url?: string;
  lang: Lang;
}

export default function DiscussOnX({ url, lang }: Readonly<DiscussOnXProps>) {
  if (!url) return null;
  const words = strings(lang);

  return (
    <Fade delay={100}>
      <div className="mt-12 pt-8 border-t border-divider">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-colors"
        >
          <XIcon size={14} />
          {words.discussOnX}
        </a>
        <p className="mt-3 text-[12px] text-date">{words.discussHint}</p>
      </div>
    </Fade>
  );
}
