"use client";

import type { ButtonHTMLAttributes } from "react";
import Icon from "@/components/Icon";
import { cn } from "@/utils/cn";
import styles from "./index.module.scss";

export type ToggleProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  variant?: "default" | "icons";
};

export default function Toggle({
  checked = false,
  onCheckedChange,
  variant = "default",
  className,
  ...rest
}: ToggleProps) {
  const icons = variant === "icons";

  return (
    <button
      {...rest}
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        styles.root,
        icons && styles.icons,
        checked && styles.on,
        className,
      )}
      onClick={(event) => {
        rest.onClick?.(event);
        if (!event.defaultPrevented) onCheckedChange?.(!checked);
      }}
    >
      {icons ? (
        <>
          <Icon name="sun" className={styles.sun} aria-hidden="true" />
          <Icon name="moon" className={styles.moon} aria-hidden="true" />
        </>
      ) : null}
      <i className={styles.thumb} />
    </button>
  );
}
