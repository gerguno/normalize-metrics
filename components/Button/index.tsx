"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import Icon, { type IconProps } from "@/components/Icon";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "quaternary"
  | "shell";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: IconProps["name"];
  fullWidth?: boolean;
  children?: ReactNode;
};

export default function Button({
  variant = "primary",
  icon,
  fullWidth = false,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={cn(
        styles.root,
        textStyles.bodySm,
        styles[variant],
        fullWidth && styles.fullWidth,
        className,
      )}
    >
      {icon ? (
        <span className={styles.icon}>
          <Icon name={icon} />
        </span>
      ) : null}
      {children ? <span className={styles.label}>{children}</span> : null}
    </button>
  );
}
