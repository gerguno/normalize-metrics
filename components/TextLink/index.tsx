import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/utils/cn";
import styles from "./index.module.scss";

type TextLinkBaseProps = {
  children: ReactNode;
  className?: string;
  variant?: "underline" | "underline-hover";
};

type TextLinkAsLinkProps = TextLinkBaseProps &
  ComponentPropsWithoutRef<typeof Link> & {
    asButton?: false;
  };

type TextLinkAsButtonProps = TextLinkBaseProps &
  ComponentPropsWithoutRef<"button"> & {
    asButton: true;
    href?: never;
  };

type TextLinkProps = TextLinkAsLinkProps | TextLinkAsButtonProps;

export default function TextLink({
  asButton = false,
  children,
  className,
  variant = "underline",
  ...props
}: TextLinkProps) {
  const rootClasses = cn(
    styles.root,
    variant === "underline" && styles.underline,
    variant === "underline-hover" && styles.underlineHover,
    asButton && styles.asButton,
    className,
  );

  if (asButton) {
    const { type = "button", ...buttonProps } =
      props as ComponentPropsWithoutRef<"button">;

    return (
      <button type={type} className={rootClasses} {...buttonProps}>
        {children}
      </button>
    );
  }

  const linkProps = props as ComponentPropsWithoutRef<typeof Link>;
  const rel =
    linkProps.target === "_blank"
      ? ["noopener noreferrer", linkProps.rel].filter(Boolean).join(" ")
      : linkProps.rel;

  return (
    <Link className={rootClasses} {...linkProps} rel={rel}>
      {children}
    </Link>
  );
}
