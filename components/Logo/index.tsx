"use client";

import { cn } from "@/utils/cn";
import styles from "./index.module.scss";

export type LogoProps = {
  menuOpen?: boolean;
  onToggleMenu?: () => void;
  className?: string;
};

export default function Logo({
  menuOpen = false,
  onToggleMenu,
  className,
}: LogoProps) {
  return (
    <div className={cn(styles.root, className)}>
      <a className={styles.mark} href="/" aria-label="Rhizome">
        <svg
          className={styles.glyph}
          width="96"
          height="96"
          viewBox="0 0 96 96"
          fill="none"
          aria-hidden="true"
        >
          <rect width="96" height="96" fill="white" />
          <path d="M48.6853 47.3056H47.3073V48.6835H48.6853V47.3056Z" fill="#202020" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M50.9043 45.0972H45.0095V50.992H50.9043V45.0972ZM49.4568 46.5417H46.5477V49.4508H49.4568V46.5417Z"
            fill="#202020"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M36.2066 36.2222H59.8374V59.853H36.2066V36.2222ZM42.1102 42.0972H53.9256V53.9126H42.1102V42.0972Z"
            fill="#202020"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0 0H96V96H0V0ZM24.3464 24.3333H71.6079V71.5949H24.3464V24.3333Z"
            fill="#202020"
          />
        </svg>
      </a>
      <button
        className={styles.menu}
        type="button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={onToggleMenu}
      >
        <span className={styles.lines} aria-hidden="true">
          {menuOpen ? (
            <i className={styles.line} />
          ) : (
            <>
              <i className={styles.line} />
              <i className={styles.line} />
              <i className={styles.line} />
            </>
          )}
        </span>
      </button>
    </div>
  );
}
