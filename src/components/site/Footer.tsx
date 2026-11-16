import { Mail, Rss } from "lucide-react";
import { GitHubIcon, LinkedInIcon, XIcon } from "@/components/site/icons";
import { localePath, type Lang } from "@/lib/i18n";

export default function Footer({ lang }: Readonly<{ lang: Lang }>) {
  return (
    <footer className="border-t border-divider">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-20 pt-16 pb-20">
        <div className="flex flex-wrap items-center gap-6">
          <a
            href="https://github.com/mitaadevelop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-foreground transition-colors"
          >
            <GitHubIcon size={16} />
            GitHub
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-foreground transition-colors"
          >
            <LinkedInIcon size={16} />
            LinkedIn
          </a>
          <a
            href="https://x.com/MITCHEL_Dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-foreground transition-colors"
          >
            <XIcon size={16} />
            X
          </a>
          <a
            href="mailto:hello@mitaa.dev"
            className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-foreground transition-colors"
          >
            <Mail size={16} />
            Mail
          </a>
          <a
            href={localePath(lang, "/feed.xml")}
            className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-foreground transition-colors"
          >
            <Rss size={16} />
            RSS
          </a>
        </div>
      </div>
    </footer>
  );
}
