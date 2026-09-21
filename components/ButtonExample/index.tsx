"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Example, {
  useExample,
  type ExampleDataProps,
} from "@/components/Example";
import { isCenteredGood } from "@/utils/centered";
import { guideAligns, type GuideAlign } from "@/utils/guideAlign";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

const SAMPLE = "Button";
const FONT_PX = 51.437;
const PAD_BLOCK = 42;

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
  const wordRef = useRef<HTMLParagraphElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [lineBox, setLineBox] = useState(0);
  const [aligns, setAligns] = useState<GuideAlign[]>([]);

  useLayoutEffect(() => {
    const el = wordRef.current;
    if (!el) return;
    const sync = () => setLineBox(el.getBoundingClientRect().height);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fontFamily, metrics]);

  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const guides = [...layer.querySelectorAll(`.${styles.guide}`)];
    if (guides.length < 2) return;
    const items = guides.map((guide) => {
      const value = guide.querySelector(`.${styles.guideValue}`);
      return {
        y: guide.getBoundingClientRect().top,
        h: value?.getBoundingClientRect().height ?? 12,
      };
    });
    const next = guideAligns(
      items.map((item) => item.y),
      Math.max(...items.map((item) => item.h), 1),
    );
    setAligns((prev) =>
      prev.length === next.length && prev.every((value, i) => value === next[i])
        ? prev
        : next,
    );
  }, [fontFamily, metrics, lineBox]);

  if (!result || !metrics || !fontFamily) return null;

  const good = isCenteredGood(metrics.centered);
  const emPx = ((metrics.ascent - metrics.descent) / metrics.upm) * FONT_PX;
  const halfLeading = lineBox > 0 ? Math.max((lineBox - emPx) / 2, 0) : 0;
  const toInkTop = PAD_BLOCK + halfLeading + (metrics.above / 1000) * FONT_PX;
  const toInkBottom = PAD_BLOCK + halfLeading + (metrics.below / 1000) * FONT_PX;
  const tone = good ? "good" : "bad";

  return (
    <div className={styles.wrap}>
      <div className={styles.pill}>
        <div
          className={cn(styles.band, styles.bandTop, styles[tone])}
          style={{ height: toInkTop }}
        />
        <p ref={wordRef} className={styles.word} style={{ fontFamily }}>
          {SAMPLE}
        </p>
        <div
          className={cn(styles.band, styles.bandBottom, styles[tone])}
          style={{ height: toInkBottom }}
        />
      </div>
      <div ref={layerRef} className={styles.guideLayer}>
        <Guide
          y={`${toInkTop}px`}
          value={Math.round(metrics.above)}
          tone={tone}
          align={aligns[0]}
        />
        <Guide
          y={`calc(100% - ${toInkBottom}px)`}
          value={Math.round(metrics.below)}
          tone={tone}
          align={aligns[1]}
        />
      </div>
    </div>
  );
}

function Guide({
  y,
  value,
  tone,
  align = "center",
}: {
  y: string;
  value: number;
  tone: "good" | "bad";
  align?: GuideAlign;
}) {
  return (
    <div
      className={cn(
        styles.guide,
        styles[tone],
        align === "above" && styles.above,
        align === "below" && styles.below,
      )}
      style={{ top: y }}
    >
      <span className={cn(textStyles.monoXs, styles.guideValue)}>{value}</span>
    </div>
  );
}
