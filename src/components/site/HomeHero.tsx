"use client";

import { useRef } from "react";
import Link from "@/components/site/LocaleLink";
import { useDictionary } from "@/components/site/LangProvider";
import { gsap, MOTION_OK, SplitText, useGSAP } from "@/lib/gsap";

interface HomeHeroProps {
  title: string;
  /** The whole line, already in the page's language: "Bijgewerkt op 28 februari 2026". */
  updated: string;
  paragraphs: string[];
}

/**
 * The homepage intro as one timeline: the title rises word by word out of its
 * lines, then the meta row and the bio follow. Everything marked `data-gsap`
 * is hidden by CSS until this runs; with reduced motion it is simply there.
 */
export default function HomeHero({ title, updated, paragraphs }: HomeHeroProps) {
  const { nav } = useDictionary();
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.set("[data-hero-title]", { autoAlpha: 1 });
        // autoSplit re-splits once Inter has loaded and when the width changes;
        // returning the tween lets SplitText carry its progress across.
        SplitText.create("[data-hero-title]", {
          type: "words,lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.words, {
              yPercent: 110,
              duration: 0.8,
              stagger: 0.06,
              ease: "power3.out",
            }),
        });

        gsap
          .timeline({ delay: 0.35, defaults: { ease: "power2.out" } })
          .fromTo(
            "[data-hero-meta]",
            { autoAlpha: 0, y: 8 },
            { autoAlpha: 1, y: 0, duration: 0.5 },
          )
          .fromTo(
            "[data-hero-bio]",
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1 },
            "-=0.25",
          );
      });
    },
    { scope },
  );

  return (
    <section ref={scope} className="pt-20 sm:pt-28 pb-16">
      <h1
        data-gsap
        data-hero-title
        className="text-[40px] sm:text-[48px] font-semibold tracking-[-1.5px] leading-tight text-foreground"
      >
        {title}
      </h1>

      <div data-gsap data-hero-meta className="mt-2 flex items-center gap-4">
        <p className="text-[13px] text-date font-medium">{updated}</p>
        <span className="text-border">·</span>
        <nav className="flex items-center gap-3">
          <Link href="/projects" className="text-[13px] text-muted hover:text-foreground transition-colors font-medium">
            {nav.projects}
          </Link>
          <Link href="/blog" className="text-[13px] text-muted hover:text-foreground transition-colors font-medium">
            {nav.blog}
          </Link>
          <Link href="/shop" className="text-[13px] text-muted hover:text-foreground transition-colors font-medium">
            {nav.shop}
          </Link>
        </nav>
      </div>

      <div className="mt-10 max-w-[720px] space-y-6">
        {paragraphs.map((html, i) => (
          <p
            key={i}
            data-gsap
            data-hero-bio
            className="text-[13px] leading-[1.7] text-foreground"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ))}
      </div>
    </section>
  );
}
