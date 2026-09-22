"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Example, {
  useExample,
  type ExampleDataProps,
} from "@/components/Example";
import { guideAligns, type GuideAlign } from "@/utils/guideAlign";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

const FONT_PX = 186;

export default function MetricsExample({
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
      title="Metrics comparison"
    >
      <MetricsBody />
    </Example>
  );
}

function MetricsBody() {
  const { result, metrics, fontFamily } = useExample();
  const glyphRef = useRef<HTMLParagraphElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [lineBox, setLineBox] = useState(0);
  const [fontPx, setFontPx] = useState(FONT_PX);
  const [aligns, setAligns] = useState<GuideAlign[]>([]);

  useLayoutEffect(() => {
    const el = glyphRef.current;
    if (!el) return;
    const sync = () => {
      const style = getComputedStyle(el);
      const pad =
        parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      setLineBox(el.getBoundingClientRect().height - pad);
      const nextFont = parseFloat(style.fontSize);
      if (Number.isFinite(nextFont) && nextFont > 0) setFontPx(nextFont);
    };
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
      const label = guide.querySelector(`.${styles.guideLabel}`);
      const value = guide.querySelector(`.${styles.guideValue}`);
      return {
        y: guide.getBoundingClientRect().top,
        h: Math.max(
          label?.getBoundingClientRect().height ?? 0,
          value?.getBoundingClientRect().height ?? 0,
        ),
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
  }, [fontFamily, metrics, lineBox, fontPx]);

  if (!result || !metrics || !fontFamily) return null;

  const em = Math.max(metrics.ascent - metrics.descent, 1);
  const unit = fontPx / metrics.upm;
  const halfLeading =
    lineBox > 0 ? Math.max((lineBox - em * unit) / 2, 0) : 0;
  const xHeight = metrics.xHeight ?? Math.round(metrics.cap * 0.7);

  const edge = (fromAscent: number) =>
    `calc(var(--space-l) + ${halfLeading + fromAscent * unit}px)`;
  const band = (fromAscent: number, span: number) => ({
    top: edge(fromAscent),
    height: `${span * unit}px`,
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.frame} aria-hidden="true">
        <div
          className={styles.leftoverTop}
          style={band(0, metrics.ascent - metrics.cap)}
        />
        <div
          className={styles.leftoverBottom}
          style={band(metrics.ascent, Math.abs(metrics.descent))}
        />
      </div>
      <div ref={layerRef} className={styles.guideLayer}>
        <Guide
          y={edge(0)}
          label="ascender"
          value={metrics.ascent}
          tone="cap"
          align={aligns[0]}
        />
        <Guide
          y={edge(metrics.ascent - metrics.cap)}
          label="cap"
          value={metrics.cap}
          tone="cap"
          align={aligns[1]}
        />
        <Guide
          y={edge(metrics.ascent - xHeight)}
          label="x-height"
          value={xHeight}
          tone="muted"
          align={aligns[2]}
        />
        <Guide
          y="50%"
          label="opt. center"
          value={Math.round((metrics.ascent + metrics.descent) / 2)}
          tone="indigo"
          align={aligns[3]}
        />
        <Guide
          y={edge(metrics.ascent)}
          label="baseline"
          value={0}
          tone="pink"
          align={aligns[4]}
        />
        <Guide
          y={edge(metrics.ascent - metrics.descent)}
          label="descender"
          value={metrics.descent}
          tone="pink"
          align={aligns[5]}
        />
      </div>
      <p ref={glyphRef} className={styles.glyph} style={{ fontFamily }}>
        Ag
      </p>
    </div>
  );
}

function Guide({
  y,
  label,
  value,
  tone,
  align = "center",
}: {
  y: string;
  label: string;
  value: number;
  tone: "cap" | "pink" | "indigo" | "muted";
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
      <span className={cn(textStyles.monoXs, styles.guideLabel)}>{label}</span>
      <span className={styles.guideLine} aria-hidden="true" />
      <span className={cn(textStyles.monoXs, styles.guideValue)}>{value}</span>
    </div>
  );
}
