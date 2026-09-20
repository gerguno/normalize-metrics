"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import Button from "@/components/Button";
import Toggle from "@/components/Toggle";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import type { Metrics, NormalizeResult } from "@/lib/types";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

const AUTOPLAY_MS = 2800;
const FADE_EASE = [0.2, 0, 0, 1] as const;

export type ExampleDataProps = {
  result: NormalizeResult | null;
  loading?: boolean;
};

export type ExampleProps = ExampleDataProps & {
  compact?: boolean;
  eyebrow?: string;
  title?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export type ExampleContextValue = {
  result: NormalizeResult | null;
  metrics?: Metrics;
  afterView: boolean;
  setAfterView: (value: boolean) => void;
  loading: boolean;
  fontFamily?: string;
};

const ExampleContext = createContext<ExampleContextValue | null>(null);

export function useExample() {
  const context = useContext(ExampleContext);
  if (!context) {
    throw new Error("useExample must be used within Example");
  }
  return context;
}

function viewValue(
  result: NormalizeResult | null,
  afterView: boolean,
  loading: boolean,
  setAfterView: (value: boolean) => void,
): ExampleContextValue {
  const metrics = afterView ? result?.after : result?.before;
  return {
    result,
    metrics,
    afterView,
    setAfterView,
    loading,
    fontFamily: result
      ? afterView
        ? result.normalizedFamily
        : result.originalFamily
      : undefined,
  };
}

export default function Example({
  result,
  loading = false,
  compact = false,
  eyebrow,
  title,
  className,
  children,
}: ExampleProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [afterView, setAfterView] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [canAnimate, setCanAnimate] = useState(false);
  const duration = reduceMotion || !canAnimate ? 0 : 0.35;
  const fade = { duration, ease: FADE_EASE };

  useEffect(() => {
    setCanAnimate(true);
  }, []);

  useEffect(() => {
    if (reduceMotion) setPlaying(false);
  }, [reduceMotion]);

  useEffect(() => {
    if (!playing || loading || !result) return;
    const id = window.setInterval(() => {
      setAfterView((value) => !value);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [playing, loading, result]);

  const live = useMemo(
    () => viewValue(result, afterView, loading, setAfterView),
    [result, afterView, loading],
  );
  const ready = Boolean(result && live.metrics && !loading);

  return (
    <ExampleContext.Provider value={live}>
      <article
        className={cn(
          styles.root,
          compact ? styles.compact : styles.tall,
          className,
        )}
      >
        {eyebrow ? (
          <p className={cn(styles.eyebrow, textStyles.bodySm)}>{eyebrow}</p>
        ) : null}
        {title ? (
          <ExampleTitle fade={fade} canAnimate={canAnimate}>
            {title}
          </ExampleTitle>
        ) : null}

        <Button
          className={styles.play}
          variant="quaternary"
          icon={playing ? "pause" : "play"}
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => setPlaying((value) => !value)}
        />

        {children != null ? (
          <div className={styles.stage}>
            {!ready && !compact ? (
              <p className={cn(styles.loading, textStyles.bodySm)}>
                Uploading and analyzing
              </p>
            ) : canAnimate ? (
              <AnimatePresence mode="sync" initial={false}>
                <motion.div
                  key={afterView ? "after" : "before"}
                  className={styles.fade}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={fade}
                >
                  <ExampleContext.Provider
                    value={viewValue(result, afterView, loading, setAfterView)}
                  >
                    {children}
                  </ExampleContext.Provider>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className={styles.fade}>
                <ExampleContext.Provider
                  value={viewValue(result, afterView, loading, setAfterView)}
                >
                  {children}
                </ExampleContext.Provider>
              </div>
            )}
          </div>
        ) : null}

        <Controls
          fade={fade}
          canAnimate={canAnimate}
          onPause={() => setPlaying(false)}
        />
      </article>
    </ExampleContext.Provider>
  );
}

function ExampleTitle({
  children,
  fade,
  canAnimate,
}: {
  children: ReactNode;
  fade: { duration: number; ease: typeof FADE_EASE };
  canAnimate: boolean;
}) {
  const live = useExample();
  const titleKey =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : `${live.afterView ? "after" : "before"}:${live.loading ? "loading" : (live.result?.family ?? "")}`;
  const frame = (
    <ExampleContext.Provider value={live}>{children}</ExampleContext.Provider>
  );

  if (!canAnimate) {
    return <div className={cn(styles.title, textStyles.bodySm)}>{frame}</div>;
  }

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={titleKey}
        className={cn(styles.title, textStyles.bodySm)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fade}
      >
        {frame}
      </motion.div>
    </AnimatePresence>
  );
}

function Controls({
  fade,
  canAnimate,
  onPause,
}: {
  fade: { duration: number; ease: typeof FADE_EASE };
  canAnimate: boolean;
  onPause: () => void;
}) {
  const { afterView, setAfterView } = useExample();
  const label = afterView ? "After" : "Before";

  return (
    <div className={styles.controls}>
      <div className={cn(styles.caption, textStyles.bodySm)}>
        <span className={styles.captionSizer} aria-hidden="true">
          Before
        </span>
        {canAnimate ? (
          <AnimatePresence mode="sync" initial={false}>
            <motion.p
              key={afterView ? "after" : "before"}
              className={styles.captionText}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fade}
            >
              {label}
            </motion.p>
          </AnimatePresence>
        ) : (
          <p className={styles.captionText}>{label}</p>
        )}
      </div>
      <Toggle
        checked={afterView}
        aria-label={afterView ? "Show before" : "Show after"}
        onCheckedChange={(checked) => {
          onPause();
          setAfterView(checked);
        }}
      />
    </div>
  );
}
