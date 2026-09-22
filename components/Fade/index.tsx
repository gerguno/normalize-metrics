"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "@/utils/usePrefersReducedMotion";

const EASE = [0.2, 0, 0, 1] as const;
const DURATION = 0.35;

export type FadeProps = {
  presenceKey: string;
  className?: string;
  children: ReactNode;
};

export default function Fade({ presenceKey, className, children }: FadeProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    setCanAnimate(true);
  }, []);

  if (!canAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={presenceKey}
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : DURATION, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
