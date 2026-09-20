"use client";

import { useState } from "react";
import Button from "@/components/Button";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

export type ShellProps = {
  code: string;
  className?: string;
};

export default function Shell({ code, className }: ShellProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn(styles.root, className)}>
      <pre className={cn(styles.code, textStyles.monoSm)}>{code}</pre>
      <Button
        className={styles.copy}
        variant="shell"
        icon={copied ? "checkmark" : "copy"}
        aria-label={copied ? "Copied" : "Copy"}
        disabled={copied}
        onClick={() => void copy()}
      />
    </div>
  );
}
