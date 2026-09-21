"use client";

import Example, { useExample, type ExampleDataProps } from "@/components/Example";
import { isCenteredGood } from "@/utils/centered";
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
      compact
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
