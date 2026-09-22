import type { Transition } from "motion/react";

export const REVEAL_EASE = [0.2, 0, 0, 1] as const;
export const REVEAL_DURATION = 0.35;
/**
 * Height leads the content fade by this much. Both finish together.
 * A fixed beat, not measured from the content.
 */
export const REVEAL_LEAD = 0.1;

export function revealTransition(open: boolean, reduceMotion = false) {
  const duration = reduceMotion ? 0 : REVEAL_DURATION;
  const lead = reduceMotion ? 0 : Math.min(REVEAL_LEAD, duration);
  const fade = duration - lead;
  const ease: [number, number, number, number] = [...REVEAL_EASE];
  const height: Transition = open
    ? { duration, ease, delay: 0 }
    : { duration: fade, ease, delay: lead };
  const content: Transition = open
    ? { duration: fade, ease, delay: lead }
    : { duration: fade, ease, delay: 0 };
  return { height, content };
}
