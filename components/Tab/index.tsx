"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import Icon, { type IconProps } from "@/components/Icon";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

export type TabProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  icon?: IconProps["name"];
  children: ReactNode;
};

export default function Tab({
  active = false,
  icon,
  className,
  type = "button",
  children,
  ...rest
}: TabProps) {
  return (
    <button
      {...rest}
      type={type}
      className={cn(
        styles.root,
        textStyles.bodySm,
        active && styles.active,
        className,
      )}
      aria-pressed={active}
    >
      {icon ? (
        <span className={styles.icon}>
          <Icon name={icon} />
        </span>
      ) : null}
      {children}
    </button>
  );
}
