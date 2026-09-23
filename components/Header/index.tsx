"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/utils/cn";
import { inertOutside } from "@/utils/inertOutside";
import { lockBodyScroll } from "@/utils/lockBodyScroll";
import { REVEAL_DURATION, REVEAL_EASE } from "@/utils/revealMotion";
import { useCompactOnScrollUp } from "@/utils/useCompactOnScrollUp";
import { usePrefersReducedMotion } from "@/utils/usePrefersReducedMotion";
import Logo from "@/components/Logo";
import SiteMenu from "@/components/SiteMenu";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./index.module.scss";

export type HeaderProps = {
  className?: string;
  children?: ReactNode;
};

function Chrome({
  menuOpen,
  onToggleMenu,
  size,
  theme,
}: {
  menuOpen: boolean;
  onToggleMenu: () => void;
  size: 96 | 50;
  theme?: ReactNode;
}) {
  return (
    <>
      <Logo
        animated
        logoOnly
        width={size}
        height={size}
        borderRadius={size === 96 ? 16 : 8}
        className={styles.mark}
      />
      {theme}
      <button
        className={styles.menu}
        type="button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={onToggleMenu}
      >
        <span className={styles.lines} aria-hidden="true">
          <i className={styles.line} />
          <i className={styles.line} />
          <i className={styles.line} />
        </span>
      </button>
    </>
  );
}

export default function Header({ className, children }: HeaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuChrome, setMenuChrome] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const { visible, onFocusCapture, onBlurCapture } = useCompactOnScrollUp(
    originRef,
    menuOpen,
  );

  function setMenu(next: boolean) {
    setMenuOpen(next);
    if (next) setMenuChrome(true);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu(false);
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-keep-menu]")) return;
      setMenu(false);
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const html = document.documentElement;
    if (menuOpen) html.dataset.menuOpen = "true";
    else delete html.dataset.menuOpen;
    return () => {
      delete html.dataset.menuOpen;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuChrome) return;
    return lockBodyScroll();
  }, [menuChrome]);

  useEffect(() => {
    if (!menuChrome) return;
    const root = rootRef.current;
    if (!root) return;
    return inertOutside(root);
  }, [menuChrome]);

  const menuFade = {
    duration: reduceMotion ? 0 : REVEAL_DURATION,
    ease: REVEAL_EASE,
    delay: reduceMotion ? 0 : menuOpen ? 0 : REVEAL_DURATION,
  };
  const menu = (
    <SiteMenu
      open={menuOpen}
      showTheme={visible}
      onExitComplete={() => setMenuChrome(false)}
    />
  );

  return (
    <div ref={rootRef} className={styles.wrap}>
      <div className={styles.origin} data-keep-menu>
        <header
          ref={originRef}
          data-header-origin
          className={cn(styles.root, menuOpen && styles.open, className)}
          inert={visible || undefined}
        >
          <Chrome
            menuOpen={menuOpen}
            onToggleMenu={() => setMenu(!menuOpen)}
            size={96}
            theme={<ThemeToggle className={styles.mainTheme} />}
          />
        </header>
        {visible ? null : menu}
      </div>
      <div
        className={cn(
          styles.compact,
          !visible && styles.hidden,
          menuOpen && styles.open,
        )}
        data-keep-menu
        data-compact={visible ? "true" : "false"}
        inert={!visible || undefined}
        aria-hidden={!visible}
        onFocusCapture={onFocusCapture}
        onBlurCapture={onBlurCapture}
      >
        <ThemeToggle className={styles.theme} />
        <div className={styles.compactColumn}>
          <div className={styles.compactInner}>
            <Chrome
              menuOpen={menuOpen}
              onToggleMenu={() => setMenu(!menuOpen)}
              size={50}
            />
          </div>
          {visible ? menu : null}
        </div>
      </div>
      {children != null ? (
        <motion.div
          className={styles.content}
          animate={{
            opacity: menuOpen ? 0.2 : 1,
            y: menuOpen && !reduceMotion ? 12 : 0,
          }}
          transition={menuFade}
          inert={menuOpen || undefined}
        >
          {children}
        </motion.div>
      ) : null}
    </div>
  );
}
