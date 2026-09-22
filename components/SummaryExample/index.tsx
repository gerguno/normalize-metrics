"use client";

import Example, {
  useExample,
  type ExampleDataProps,
} from "@/components/Example";
import RollingNumber from "@/components/RollingNumber";
import { isCenteredGood } from "@/utils/centered";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

export default function SummaryExample({
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
    >
      <SummaryBody />
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

function SummaryBody() {
  const { result, metrics, fontFamily } = useExample();
  if (!result || !metrics || !fontFamily) return null;

  const ascent = metrics.ascentOverride ?? percentOfUpm(metrics.ascent, metrics.upm);
  const descent = metrics.descentOverride ?? percentOfUpm(metrics.descent, metrics.upm);

  const spinKey = result.family;

  return (
    <div className={styles.stats}>
      <Stat
        label="Ascent override"
        value={formatPercent(ascent)}
        spinKey={spinKey}
        fontFamily={fontFamily}
      />
      <Stat
        label="Centered in box"
        value={formatPercent(metrics.centered)}
        centered={metrics.centered}
        spinKey={spinKey}
        fontFamily={fontFamily}
      />
      <Stat
        label="Descent override"
        value={formatPercent(descent)}
        spinKey={spinKey}
        fontFamily={fontFamily}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  centered,
  spinKey,
  fontFamily,
}: {
  label: string;
  value: string;
  centered?: number;
  spinKey: string;
  fontFamily: string;
}) {
  const tone =
    centered == null ? undefined : isCenteredGood(centered) ? styles.good : styles.bad;

  return (
    <div className={styles.stat}>
      <p className={cn(textStyles.bodySm, styles.label)}>{label}</p>
      <p className={cn(styles.value, tone)} style={{ fontFamily }}>
        <RollingNumber value={value} spinKey={spinKey} />
      </p>
    </div>
  );
}
