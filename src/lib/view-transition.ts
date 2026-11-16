/**
 * Switching between views inside a page — document tabs, the hardware viewer,
 * a chart and its table — with the same fade as turning a blog page.
 *
 * The animations are the `page-forward` / `page-back` view-transition classes
 * in globals.css. A <ViewTransition> only animates inside a React Transition,
 * so the state change goes through swapView rather than a plain setState.
 * No fs/path here: client components import this module.
 */
import { addTransitionType, startTransition } from "react";

/**
 * The classes for a swapped view's `enter` / `exit` / `update` prop: only a
 * switch tagged by swapView animates, never an unrelated transition.
 */
export const SWAP_CLASSES = {
  "page-forward": "page-forward",
  "page-back": "page-back",
  default: "none",
};

/** Apply a view switch as a Transition, sliding forward (to a later tab) or back. */
export function swapView(forward: boolean, update: () => void): void {
  startTransition(() => {
    addTransitionType(forward ? "page-forward" : "page-back");
    update();
  });
}
