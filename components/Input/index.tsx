"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

export type InputSize = "s" | "m";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  size?: InputSize;
};

export default function Input({
  label,
  className,
  id,
  size = "s",
  ...rest
}: InputProps) {
  return (
    <label className={styles.root}>
      {label ? (
        <span className={cn(styles.label, textStyles.bodySm)}>{label}</span>
      ) : null}
      <input
        {...rest}
        id={id}
        className={cn(
          styles.field,
          size === "m" ? textStyles.bodyMd : textStyles.bodySm,
          size === "m" && styles.sizeM,
          className,
        )}
      />
    </label>
  );
}
