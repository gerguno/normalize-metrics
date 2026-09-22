"use client";

import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import Button from "@/components/Button";
import Fade from "@/components/Fade";
import Syntax from "@/components/Syntax";
import { highlightLines } from "@/utils/highlight";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

const SHELLS = [
  { id: "bash", prompt: "$" },
  { id: "zsh", prompt: "%" },
  { id: "fish", prompt: "⋊>" },
] as const;

type ShellId = (typeof SHELLS)[number]["id"];

export type ShellProps = {
  code: string;
  className?: string;
};

export default function Shell({ code, className }: ShellProps) {
  const baseId = useId();
  const tabsRef = useRef<HTMLDivElement>(null);
  const [shell, setShell] = useState<ShellId>("bash");
  const [copied, setCopied] = useState(false);
  const [indicator, setIndicator] = useState({ x: 0, width: 0 });
  const [indicatorReady, setIndicatorReady] = useState(false);
  const prompt = SHELLS.find((item) => item.id === shell)?.prompt ?? "$";
  const lines = highlightLines(code.replace(/\n$/, ""), "shell");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  useLayoutEffect(() => {
    const root = tabsRef.current;
    if (!root) return;

    const sync = () => {
      const active = root.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!active) return;
      const next = { x: active.offsetLeft, width: active.offsetWidth };
      setIndicator((prev) =>
        prev.x === next.x && prev.width === next.width ? prev : next,
      );
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(root);
    for (const tab of root.querySelectorAll<HTMLElement>('[role="tab"]')) {
      observer.observe(tab);
    }
    return () => observer.disconnect();
  }, [shell]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIndicatorReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function selectShell(next: ShellId) {
    setShell(next);
    setCopied(false);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const key = event.key;
    if (key !== "ArrowRight" && key !== "ArrowLeft" && key !== "Home" && key !== "End") {
      return;
    }
    event.preventDefault();
    const index = SHELLS.findIndex((item) => item.id === shell);
    const nextIndex =
      key === "ArrowRight"
        ? (index + 1) % SHELLS.length
        : key === "ArrowLeft"
          ? (index - 1 + SHELLS.length) % SHELLS.length
          : key === "Home"
            ? 0
            : SHELLS.length - 1;
    const next = SHELLS[nextIndex].id;
    selectShell(next);
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`[data-shell="${next}"]`)
      ?.focus();
  }

  return (
    <div className={cn(styles.root, className)}>
      <div
        ref={tabsRef}
        className={styles.tabs}
        role="tablist"
        aria-label="Shell"
        style={
          {
            "--indicator-x": `${indicator.x}px`,
            "--indicator-w": `${indicator.width}px`,
          } as CSSProperties
        }
      >
        <span
          className={cn(styles.indicator, indicatorReady && styles.indicatorReady)}
          aria-hidden="true"
        />
        {SHELLS.map((item) => {
          const selected = item.id === shell;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${baseId}-${item.id}`}
              data-shell={item.id}
              className={cn(
                styles.tab,
                textStyles.monoSm,
                selected && styles.tabActive,
              )}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectShell(item.id)}
              onKeyDown={onTabKeyDown}
            >
              {item.id}
            </button>
          );
        })}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-${shell}`}
        className={styles.body}
      >
        <div className={styles.codeFade}>
          <Fade presenceKey={shell} className={styles.codeLayer}>
            <p
              className={cn(styles.code, textStyles.monoSm)}
              style={{ "--shell-prompt": `"${prompt}"` } as CSSProperties}
            >
              {lines.map((tokens, index) => (
                <Fragment key={index}>
                  {index > 0 ? <br /> : null}
                  <span className={styles.command}>
                    {tokens.length ? <Syntax tokens={tokens} /> : null}
                  </span>
                </Fragment>
              ))}
            </p>
          </Fade>
        </div>
        <Button
          className={styles.copy}
          variant="shell"
          icon={copied ? "checkmark" : "copy"}
          aria-label={copied ? "Copied" : "Copy"}
          disabled={copied}
          onClick={() => void copy()}
        />
      </div>
    </div>
  );
}
