"use client";

import Example, { useExample, type ExampleDataProps } from "@/components/Example";
import { isCenteredGood } from "@/lib/centered";
import styles from "./index.module.scss";

export default function SummaryExample({
  result,
  loading,
}: ExampleDataProps) {
  return (
    <Example
      className={styles.root}
      result={result}
      loading={loading}
      compact
      eyebrow={result?.family}
      title={<SummaryTitle />}
    />
  );
}

function SummaryTitle() {
  const { metrics, loading } = useExample();
  if (loading || !metrics) return "\u00a0";

  const centered = metrics.centered;
  const good = isCenteredGood(centered);

  return (
    <span className={styles.centered}>
      <span>Centered:</span>
      <span className={good ? styles.good : styles.bad}>{centered}%</span>
    </span>
  );
}
