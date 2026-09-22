"use client";

import type { CSSProperties } from "react";
import Example, {
  useExample,
  type ExampleDataProps,
} from "@/components/Example";
import { isCenteredGood } from "@/utils/centered";
import { cn } from "@/utils/cn";
import type { Metrics } from "@/lib/types";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

const SAMPLE = "Button";
const FONT_PX = 66;

export default function ButtonExample({
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
      title="Within a button"
    >
      <ButtonBody />
    </Example>
  );
}

function ButtonBody() {
  const { result, metrics, fontFamily } = useExample();

  if (!result || !metrics || !fontFamily) return null;

  const good = isCenteredGood(metrics.centered);
  const tone = good ? "good" : "bad";
  const pillStyle = {
    "--line-box": `${Math.round(sharedLineEm(result.before, result.after) * FONT_PX)}px`,
  } as CSSProperties;
  // Surplus on one side of the cap-to-baseline center. Cutting it evens the two leftovers.
  const surplus = metrics.below - metrics.above;
  const extra = Math.abs(surplus);
  const extraPx = (extra / 1000) * FONT_PX;
  // A subpixel cut still paints a 1px rule. Skip it; the word is already centered.
  const visible = extraPx >= 1;
  // More room below the baseline means the word sits high, so the cut is at the bottom.
  const cutTop = surplus < 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.pill} style={pillStyle}>
        {visible ? (
          <div
            className={cn(
              styles.band,
              cutTop ? styles.bandTop : styles.bandBottom,
              styles[tone],
            )}
            style={{ height: extraPx }}
          />
        ) : null}
        <p className={styles.word} style={{ fontFamily }}>
          {SAMPLE}
        </p>
      </div>
      {visible ? (
        <div className={styles.guideLayer}>
          <Guide
            y={cutTop ? `${extraPx}px` : `calc(100% - ${extraPx}px)`}
            value={Math.round(extra)}
            tone={tone}
          />
        </div>
      ) : null}
    </div>
  );
}

function sharedLineEm(before: Metrics, after: Metrics) {
  const em = (metrics: Metrics) =>
    (metrics.ascent - metrics.descent) / (metrics.upm || 1);
  return Math.max(em(before), em(after));
}

function Guide({
  y,
  value,
  tone,
}: {
  y: string;
  value: number;
  tone: "good" | "bad";
}) {
  return (
    <div className={cn(styles.guide, styles[tone])} style={{ top: y }}>
      <span className={cn(textStyles.monoXs, styles.guideLabel)}>
        extra space
      </span>
      <span className={cn(textStyles.monoXs, styles.guideValue)}>{value}</span>
    </div>
  );
}
