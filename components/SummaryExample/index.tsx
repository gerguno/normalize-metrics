"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import Example, {
  useExample,
  type ExampleDataProps,
} from "@/components/Example";
import { useFadeEnter } from "@/components/Fade";
import RollingNumber from "@/components/RollingNumber";
import { isCenteredGood } from "@/utils/centered";
import { cn } from "@/utils/cn";
import type { Metrics } from "@/lib/types";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

const LABELS = ["Ascent override", "Centered in box", "Descent override"];

type StatSnapshot = {
  ascent: string;
  centered: string;
  descent: string;
};

export default function SummaryExample({
  result,
  loading,
  disabled,
  name,
}: ExampleDataProps) {
  const previous = useRef<StatSnapshot | null>(null);

  return (
    <Example
      className={styles.root}
      result={result}
      loading={loading}
      disabled={disabled}
      name={name}
      title="Summary"
      fadeTitle
    >
      <SummaryBody previous={previous} />
    </Example>
  );
}

function percentOfUpm(units: number, upm: number) {
  if (!Number.isFinite(upm) || upm <= 0) return 0;
  return Math.round((Math.abs(units) / upm) * 1000) / 10;
}

function formatPercent(value: number) {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text}%`;
}

function metricPercents(metrics: Metrics) {
  return [
    formatPercent(
      metrics.ascentOverride ?? percentOfUpm(metrics.ascent, metrics.upm),
    ),
    formatPercent(metrics.centered),
    formatPercent(
      metrics.descentOverride ?? percentOfUpm(metrics.descent, metrics.upm),
    ),
  ];
}

function SummaryBody({
  previous,
}: {
  previous: RefObject<StatSnapshot | null>;
}) {
  const { result, metrics, fontFamily, afterView } = useExample();
  const entering = useFadeEnter();
  const sizerRef = useRef<HTMLDivElement>(null);
  const [column, setColumn] = useState(0);
  const ascentValue =
    metrics == null
      ? ""
      : formatPercent(
          metrics.ascentOverride ?? percentOfUpm(metrics.ascent, metrics.upm),
        );
  const descentValue =
    metrics == null
      ? ""
      : formatPercent(
          metrics.descentOverride ?? percentOfUpm(metrics.descent, metrics.upm),
        );
  const centeredValue = metrics == null ? "" : formatPercent(metrics.centered);
  const from = previous.current;

  useLayoutEffect(() => {
    if (!metrics) return;
    previous.current = {
      ascent: ascentValue,
      centered: centeredValue,
      descent: descentValue,
    };
  }, [ascentValue, centeredValue, descentValue, metrics, previous]);

  useLayoutEffect(() => {
    const sizer = sizerRef.current;
    if (!sizer) return;
    const next = Math.ceil(
      Math.max(
        0,
        ...[...sizer.children].map((el) => (el as HTMLElement).offsetWidth),
      ),
    );
    setColumn((prev) => (prev === next ? prev : next));
  }, [result, fontFamily]);

  if (!result || !metrics || !fontFamily) return null;

  const probes = [
    { family: result.originalFamily, values: metricPercents(result.before) },
    { family: result.normalizedFamily, values: metricPercents(result.after) },
  ];

  const spinKey = `${result.family}:${afterView ? "after" : "before"}`;

  return (
    <div className={styles.stats}>
      <Stat
        label="Ascent override"
        value={ascentValue}
        from={from?.ascent}
        spinKey={spinKey}
        spinOnMount={entering}
        fontFamily={fontFamily}
        width={column}
      />
      <Stat
        label="Centered in box"
        value={centeredValue}
        from={from?.centered}
        centered={metrics.centered}
        spinKey={spinKey}
        spinOnMount={entering}
        fontFamily={fontFamily}
        width={column}
      />
      <Stat
        label="Descent override"
        value={descentValue}
        from={from?.descent}
        spinKey={spinKey}
        spinOnMount={entering}
        fontFamily={fontFamily}
        width={column}
      />
      <div ref={sizerRef} className={styles.sizer} aria-hidden>
        {LABELS.map((label) => (
          <span key={label} className={cn(textStyles.bodySm, styles.label)}>
            {label}
          </span>
        ))}
        {probes.flatMap(({ family, values }) =>
          values.map((value, index) => (
            <span
              key={`${family}:${index}`}
              className={styles.value}
              style={{ fontFamily: family }}
            >
              <RollingNumber value={value} />
            </span>
          )),
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  from,
  centered,
  spinKey,
  spinOnMount,
  fontFamily,
  width,
}: {
  label: string;
  value: string;
  from?: string;
  centered?: number;
  spinKey: string;
  spinOnMount: boolean;
  fontFamily: string;
  width: number;
}) {
  const tone =
    centered == null ? undefined : isCenteredGood(centered) ? styles.good : styles.bad;

  return (
    <div className={styles.stat} style={width ? { width } : undefined}>
      <p className={cn(textStyles.bodySm, styles.label)}>{label}</p>
      <p className={cn(styles.value, tone)} style={{ fontFamily }}>
        <RollingNumber
          value={value}
          from={from}
          spinKey={spinKey}
          spinOnMount={spinOnMount}
        />
      </p>
    </div>
  );
}
