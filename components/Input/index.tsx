"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
};

export default function Input({ label, className, id, ...rest }: InputProps) {
  return (
    <label className={styles.root}>
      {label ? (
        <span className={cn(styles.label, textStyles.bodySm)}>{label}</span>
      ) : null}
      <input
        {...rest}
        id={id}
        className={cn(styles.field, textStyles.bodySm, className)}
      />
    </label>
  );
}
