"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Button from "@/components/Button";
import Fade from "@/components/Fade";
import Toggle from "@/components/Toggle";
import { usePrefersReducedMotion } from "@/utils/usePrefersReducedMotion";
import type { Metrics, NormalizeResult } from "@/lib/types";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

const AUTOPLAY_MS = 2800;

export type ExampleDataProps = {
  result: NormalizeResult | null;
  loading?: boolean;
  disabled?: boolean;
  name?: string;
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
  disabled = false,
  compact = false,
  name,
  eyebrow = name ?? result?.family,
  title,
  className,
  children,
}: ExampleProps) {
  const reduceMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [afterView, setAfterView] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (reduceMotion) setPlaying(false);
  }, [reduceMotion]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // Top half of the viewport: fires when the card's top reaches screen center.
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setInView(visible);
        if (visible) setAfterView(true);
      },
      { rootMargin: "0px 0px -50% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !inView || loading || disabled || !result) return;
    const id = window.setInterval(() => {
      setAfterView((value) => !value);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [playing, inView, loading, disabled, result]);

  const live = useMemo(
    () => viewValue(result, afterView, loading, setAfterView),
    [result, afterView, loading],
  );
  const ready = Boolean(result && live.metrics && !loading);

  return (
    <ExampleContext.Provider value={live}>
      <article
        ref={rootRef}
        className={cn(
          styles.root,
          compact ? styles.compact : styles.tall,
          className,
        )}
      >
        {eyebrow ? (
          <p className={cn(styles.eyebrow, textStyles.bodySm)}>{eyebrow}</p>
        ) : null}
        {title ? <ExampleTitle>{title}</ExampleTitle> : null}

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
            ) : (
              <Fade
                presenceKey={afterView ? "after" : "before"}
                className={styles.fade}
              >
                <ExampleContext.Provider
                  value={viewValue(result, afterView, loading, setAfterView)}
                >
                  {children}
                </ExampleContext.Provider>
              </Fade>
            )}
          </div>
        ) : null}

        <Controls onPause={() => setPlaying(false)} />
      </article>
    </ExampleContext.Provider>
  );
}

function ExampleTitle({ children }: { children: ReactNode }) {
  const live = useExample();
  const titleKey =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : `${live.afterView ? "after" : "before"}:${live.loading ? "loading" : (live.result?.family ?? "")}`;

  return (
    <Fade presenceKey={titleKey} className={cn(styles.title, textStyles.bodySm)}>
      <ExampleContext.Provider value={live}>{children}</ExampleContext.Provider>
    </Fade>
  );
}

function Controls({ onPause }: { onPause: () => void }) {
  const { afterView, setAfterView } = useExample();
  const label = afterView ? "After" : "Before";

  return (
    <div className={styles.controls}>
      <div className={cn(styles.caption, textStyles.bodySm)}>
        <span className={styles.captionSizer} aria-hidden="true">
          Before
        </span>
        <Fade
          presenceKey={afterView ? "after" : "before"}
          className={styles.captionText}
        >
          {label}
        </Fade>
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
