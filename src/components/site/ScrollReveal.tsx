"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
} & (
  | {
      /**
       * The elements matching `selector` inside this wrapper rise into view
       * together, staggered, the first time they scroll past 85% of the
       * viewport. Give them `data-gsap` so they start hidden.
       */
      variant: "stagger";
      selector: string;
      /** Seconds between two elements. */
      stagger?: number;
      /** Pixels each element rises; 0 inside a scrolling box, where it would overflow. */
      rise?: number;
    }
  | {
      /**
       * The wrapper drifts against the scroll while its parent crosses the
       * viewport. It overhangs the parent by 8% at the top and bottom, so the
       * parent must be positioned and clip its overflow.
       */
      variant: "parallax";
      /** Travel in each direction, as a percentage of the wrapper's height. */
      amount?: number;
    }
);

/** Scroll-driven animation for server-rendered pages, driven by ScrollTrigger. */
export default function ScrollReveal(props: ScrollRevealProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      gsap.matchMedia().add(MOTION_OK, () => {
        if (props.variant === "stagger") {
          ScrollTrigger.batch(gsap.utils.toArray<HTMLElement>(props.selector, root), {
            start: "top 85%",
            once: true,
            onEnter: (batch) =>
              gsap.fromTo(
                batch,
                { autoAlpha: 0, y: props.rise ?? 6 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.4,
                  ease: "power2.out",
                  stagger: props.stagger ?? 0.06,
                },
              ),
          });
        } else {
          const amount = props.amount ?? 6;
          gsap.fromTo(
            root,
            { yPercent: -amount },
            {
              yPercent: amount,
              ease: "none",
              scrollTrigger: {
                trigger: root.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        }
      });
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className={cn(
        props.variant === "parallax" && "absolute inset-x-0 -top-[8%] -bottom-[8%]",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}
