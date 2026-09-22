"use client";

import { useState } from "react";
import Button from "@/components/Button";
import Icon from "@/components/Icon";
import Syntax from "@/components/Syntax";
import { highlightLines, languageFromFilename, type HighlightLanguage } from "@/utils/highlight";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

export type CodeFileProps = {
  name: string;
  code: string;
  language?: HighlightLanguage;
  className?: string;
};

export default function CodeFile({ name, code, language, className }: CodeFileProps) {
  const [copied, setCopied] = useState(false);
  const source = code.replace(/\n$/, "");
  const resolved = language ?? languageFromFilename(name);
  const lines = resolved
    ? highlightLines(source, resolved)
    : source.split("\n").map((line) => [{ role: "plain" as const, text: line }]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code.endsWith("\n") ? code : `${code}\n`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn(styles.root, className)}>
      <div className={styles.header}>
        <Icon name="css" className={styles.icon} aria-hidden="true" />
        <p className={cn(styles.name, textStyles.monoSm)}>{name}</p>
      </div>
      <div className={styles.body}>
        <div className={styles.lines}>
          {lines.map((tokens, index) => (
            <div className={styles.line} key={index}>
              <span className={cn(styles.gutter, textStyles.monoSm)}>{index + 1}</span>
              <span className={cn(styles.source, textStyles.monoSm)}>
                {tokens.some((token) => token.text) ? <Syntax tokens={tokens} /> : "\u00a0"}
              </span>
            </div>
          ))}
        </div>
        <Button
          className={styles.copy}
          variant="shell"
          icon={copied ? "checkmark" : "copy"}
          aria-label={copied ? "Copied" : "Copy"}
          disabled={copied}
          onClick={() => void copy()}
        />
      </div>
    </div>
  );
}
