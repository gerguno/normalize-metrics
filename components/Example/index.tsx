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
import Tab from "@/components/Tab";
import { usePrefersReducedMotion } from "@/utils/usePrefersReducedMotion";
import type { Metrics, NormalizeResult } from "@/lib/types";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

const AUTOPLAY_MS = 2800;
const DEFAULT_STATES = ["Before", "After"];

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
  /** Crossfade the title when the active state changes the font. */
  fadeTitle?: boolean;
  /**
   * Mutually exclusive labels for the tab group. "After" (any case) shows the
   * normalized metrics; every other keyword shows the original.
   */
  states?: readonly string[];
  className?: string;
  children?: ReactNode;
};

export type ExampleContextValue = {
  result: NormalizeResult | null;
  metrics?: Metrics;
  /** Active keyword from `states`. */
  state: string;
  setState: (value: string) => void;
  states: readonly string[];
  /** True when `state` is the normalized "after" metrics. */
  afterView: boolean;
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

function isAfterState(state: string) {
  return state.trim().toLowerCase() === "after";
}

function viewValue(
  result: NormalizeResult | null,
  state: string,
  states: readonly string[],
  loading: boolean,
  setState: (value: string) => void,
): ExampleContextValue {
  const afterView = isAfterState(state);
  const metrics = afterView ? result?.after : result?.before;
  return {
    result,
    metrics,
    state,
    setState,
    states,
    afterView,
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
  fadeTitle = false,
  states = DEFAULT_STATES,
  className,
  children,
}: ExampleProps) {
  const reduceMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const statesRef = useRef(states);
  statesRef.current = states;
  const [state, setState] = useState(states[0] ?? "");
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(false);
  const selectState = useMemo(() => {
    return (value: string) => {
      setPlaying(false);
      setState(value);
    };
  }, []);

  useEffect(() => {
    if (states.includes(state)) return;
    setState(states[0] ?? "");
  }, [states, state]);

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
        if (!visible) return;
        const list = statesRef.current;
        if (list.length > 1) setState(list[1]);
      },
      { rootMargin: "0px 0px -50% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !inView || loading || disabled || !result) return;
    const id = window.setInterval(() => {
      setState((current) => {
        const list = statesRef.current;
        if (list.length < 2) return current;
        const index = Math.max(0, list.indexOf(current));
        return list[(index + 1) % list.length] ?? current;
      });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [playing, inView, loading, disabled, result]);

  const live = useMemo(
    () => viewValue(result, state, states, loading, selectState),
    [result, state, states, loading, selectState],
  );
  const ready = Boolean(result && live.metrics && !loading);
  const fontKey = result?.family ?? "";
  const viewKey = `${state}:${fontKey}`;

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
          <Fade
            presenceKey={eyebrow}
            className={cn(styles.eyebrow, textStyles.bodySm)}
          >
            {eyebrow}
          </Fade>
        ) : null}
        {title ? (
          <ExampleTitle fadeWithView={fadeTitle} fontKey={fontKey}>
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
            ) : (
              <Fade presenceKey={viewKey} className={styles.fade}>
                <ExampleContext.Provider value={live}>{children}</ExampleContext.Provider>
              </Fade>
            )}
          </div>
        ) : null}

        <Controls />
      </article>
    </ExampleContext.Provider>
  );
}

function ExampleTitle({
  children,
  fadeWithView,
  fontKey,
}: {
  children: ReactNode;
  fadeWithView: boolean;
  fontKey: string;
}) {
  const live = useExample();
  const label =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : null;
  const titleKey =
    label && !fadeWithView
      ? label
      : `${live.state}:${fontKey}:${label ?? ""}`;

  return (
    <Fade presenceKey={titleKey} className={cn(styles.title, textStyles.bodySm)}>
      <ExampleContext.Provider value={live}>{children}</ExampleContext.Provider>
    </Fade>
  );
}

function Controls() {
  const { state, setState, states } = useExample();
  if (states.length === 0) return null;

  const activeIndex = Math.max(0, states.indexOf(state));

  return (
    <div className={styles.controls}>
      <div
        className={styles.tabs}
        role="group"
        aria-label="View"
        onKeyDown={(event) => {
          if (states.length < 2) return;
          const { key } = event;
          const nextIndex =
            key === "ArrowRight" || key === "ArrowDown"
              ? (activeIndex + 1) % states.length
              : key === "ArrowLeft" || key === "ArrowUp"
                ? (activeIndex - 1 + states.length) % states.length
                : key === "Home"
                  ? 0
                  : key === "End"
                    ? states.length - 1
                    : null;
          if (nextIndex == null) return;
          event.preventDefault();
          setState(states[nextIndex]);
          event.currentTarget
            .querySelector<HTMLButtonElement>(
              `[data-state-index="${nextIndex}"]`,
            )
            ?.focus();
        }}
      >
        {states.map((label, index) => (
          <Tab
            key={label}
            data-state-index={index}
            active={index === activeIndex}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => setState(label)}
          >
            {label}
          </Tab>
        ))}
      </div>
    </div>
  );
}
