"use client";

import Example, { useExample, type ExampleDataProps } from "@/components/Example";
import type { CSSProperties } from "react";
import styles from "./index.module.scss";

const QUOTE = `Nothing is more important than to see the sources of invention which are, in my opinion, more interesting than the inventions themselves.

— Gottfried Wilhelm Leibniz`;

export default function TextExample({ result, loading }: ExampleDataProps) {
  return (
    <Example
      className={styles.root}
      result={result}
      loading={loading}
      eyebrow="Analysis"
      title="Text sample"
    >
      <TextBody />
    </Example>
  );
}

function TextBody() {
  const { result, metrics, fontFamily } = useExample();
  if (!result || !metrics || !fontFamily) return null;

  const em = Math.max(metrics.ascent - metrics.descent, 1);
  const overlay = {
    fontFamily,
    "--over": (metrics.ascent - metrics.cap) / em,
    "--under": Math.abs(metrics.descent) / em,
  } as CSSProperties;

  return (
    <div className={styles.quote}>
      <div className={styles.lines} style={overlay} aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <div className={styles.line} key={index}>
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
