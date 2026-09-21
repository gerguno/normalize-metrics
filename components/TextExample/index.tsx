"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Example, { useExample, type ExampleDataProps } from "@/components/Example";
import styles from "./index.module.scss";

const QUOTE = `Nothing is more important than to see the sources of invention which are, in my opinion, more interesting than the inventions themselves.

— Gottfried Wilhelm Leibniz`;

const FONT_PX = 20;

export default function TextExample({
  result,
  loading,
  disabled,
  name,
}: ExampleDataProps) {
  return (
    <Example
      className={styles.root}
      result={result}
      loading={loading}
      disabled={disabled}
      name={name}
      title="Text sample"
    >
      <TextBody />
    </Example>
  );
}

function TextBody() {
  const { result, metrics, fontFamily } = useExample();
  const lineRef = useRef<HTMLDivElement>(null);
  const [lineBox, setLineBox] = useState(0);

  useLayoutEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    const sync = () => setLineBox(el.getBoundingClientRect().height);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fontFamily, metrics]);

  if (!result || !metrics || !fontFamily) return null;

  const unit = FONT_PX / Math.max(metrics.upm, 1);
  const emPx = (metrics.ascent - metrics.descent) * unit;
  const lead = lineBox > 0 ? (lineBox - emPx) / 2 : 0;
  const overlay = {
    fontFamily,
    "--lead": `${lead}px`,
    "--over": `${(metrics.ascent - metrics.cap) * unit}px`,
    "--under": `${Math.abs(metrics.descent) * unit}px`,
  } as CSSProperties;

  return (
    <div className={styles.quote}>
      <div className={styles.lines} style={overlay} aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <div className={styles.line} ref={index === 0 ? lineRef : undefined} key={index}>
            <span className={styles.lineOver} />
            <span className={styles.lineUnder} />
          </div>
        ))}
      </div>
      <p className={styles.quoteText} style={{ fontFamily }}>
        {QUOTE}
      </p>
    </div>
  );
}
