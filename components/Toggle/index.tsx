"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import styles from "./index.module.scss";

export type ToggleProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export default function Toggle({
  checked = false,
  onCheckedChange,
  className,
  ...rest
}: ToggleProps) {
  return (
    <button
      {...rest}
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(styles.root, checked && styles.on, className)}
      onClick={(event) => {
        rest.onClick?.(event);
        if (!event.defaultPrevented) onCheckedChange?.(!checked);
      }}
    >
      <i className={styles.thumb} />
    </button>
  );
}
