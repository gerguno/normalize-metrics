"use client";

import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";
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

type ButtonShared = {
  variant?: ButtonVariant;
  icon?: IconProps["name"];
  fullWidth?: boolean;
  children?: ReactNode;
  className?: string;
};

type ButtonAsButton = ButtonShared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonShared> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonShared &
  Omit<ComponentPropsWithoutRef<"a">, keyof ButtonShared> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button({
  variant = "primary",
  icon,
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(
    styles.root,
    textStyles.bodySm,
    styles[variant],
    fullWidth && styles.fullWidth,
    className,
  );

  const content = (
    <>
      {icon ? (
        <span className={styles.icon}>
          <Icon name={icon} />
        </span>
      ) : null}
      {children ? <span className={styles.label}>{children}</span> : null}
    </>
  );

  if ("href" in rest && rest.href) {
    const { href, target, rel, ...linkRest } = rest;
    const linkRel =
      target === "_blank"
        ? ["noopener noreferrer", rel].filter(Boolean).join(" ")
        : rel;

    return (
      <a
        {...linkRest}
        href={href}
        target={target}
        rel={linkRel}
        className={classes}
      >
        {content}
      </a>
    );
  }

  const { type = "button", ...buttonRest } = rest as ButtonAsButton;

  return (
    <button {...buttonRest} type={type} className={classes}>
      {content}
    </button>
  );
}
