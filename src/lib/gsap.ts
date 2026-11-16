"use client";

/**
 * The one place GSAP is imported and its plugins registered. Animated client
 * components take gsap, ScrollTrigger, SplitText and useGSAP from here, so the
 * registration happens once and pages without GSAP never load it.
 *
 * Every animation runs inside `gsap.matchMedia().add(MOTION_OK, …)`: the
 * reduced-motion rule in globals.css only reaches view transitions, not the
 * inline styles GSAP sets. Elements that start hidden carry `data-gsap` (see
 * globals.css), which hides them only when scripts run and motion is welcome.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/** Media query under which animations run; with reduced motion nothing moves. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, SplitText, useGSAP };
