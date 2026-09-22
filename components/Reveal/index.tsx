"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/utils/cn";
import { revealTransition } from "@/utils/revealMotion";
import { usePrefersReducedMotion } from "@/utils/usePrefersReducedMotion";
import styles from "./index.module.scss";

export type RevealProps = {
  show: boolean;
  className?: string;
  children: ReactNode;
  onExitComplete?: () => void;
};

export default function Reveal({
  show,
  className,
  children,
  onExitComplete,
}: RevealProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [present, setPresent] = useState(show);
  const [settled, setSettled] = useState(false);
  const showRef = useRef(show);
  const prevShow = useRef(show);
  const run = useRef(0);
  const wasOpen = useRef(show);
  const onExit = useRef(onExitComplete);
  showRef.current = show;
  onExit.current = onExitComplete;

  if (show && !present) setPresent(true);
  if (prevShow.current !== show) {
    prevShow.current = show;
    run.current += 1;
    if (settled) setSettled(false);
  }

  useEffect(() => {
    if (!reduceMotion) return;
    const closing = wasOpen.current && !show;
    wasOpen.current = show;
    if (!closing) return;
    setPresent(false);
    onExit.current?.();
  }, [reduceMotion, show]);

  const runId = run.current;

  if (!present || (reduceMotion && !show)) return null;
  if (reduceMotion) {
    return <div className={cn(styles.wrap, className)}>{children}</div>;
  }

  const timing = revealTransition(show);

  return (
    <motion.div
      className={cn(styles.wrap, className)}
      initial={{ gridTemplateRows: "0fr" }}
      animate={{ gridTemplateRows: show ? "1fr" : "0fr" }}
      transition={timing.height}
      onAnimationComplete={() => {
        if (run.current !== runId) return;
        if (showRef.current) {
          setSettled(true);
          return;
        }
        setPresent(false);
        onExit.current?.();
      }}
    >
      <div className={cn(styles.clip, settled && show && styles.settled)}>
        <motion.div
          className={styles.content}
          initial={{ opacity: 0 }}
          animate={{ opacity: show ? 1 : 0 }}
          transition={timing.content}
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
}
