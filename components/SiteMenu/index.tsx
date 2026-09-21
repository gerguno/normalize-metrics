"use client";

import { AnimatePresence, motion } from "motion/react";
import TextLink from "@/components/TextLink";
import { MENU_DURATION, MENU_EASE } from "@/utils/menuMotion";
import { usePrefersReducedMotion } from "@/utils/usePrefersReducedMotion";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

const NAV = [
  { label: "Latest", id: "latest" },
  { label: "Manifest", id: "manifest" },
  { label: "Services", id: "services" },
  { label: "About", id: "about" },
  { label: "Technology", id: "technology" },
  { label: "Testimonials", id: "testimonials" },
];

export type SiteMenuProps = {
  open: boolean;
  onExitComplete?: () => void;
};

export default function SiteMenu({ open, onExitComplete }: SiteMenuProps) {
  const reduceMotion = usePrefersReducedMotion();
  const duration = reduceMotion ? 0 : MENU_DURATION;
  const stagger = reduceMotion ? 0 : MENU_DURATION;
  const ease = MENU_EASE;

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {open ? (
        <motion.div
          key="menu"
          className={styles.wrap}
          initial={{ gridTemplateRows: "0fr" }}
          animate={{
            gridTemplateRows: "1fr",
            transition: { duration, ease, delay: 0 },
          }}
          exit={{
            gridTemplateRows: "0fr",
            transition: { duration, ease, delay: stagger },
          }}
        >
          <div className={styles.clip}>
            <motion.nav
              className={styles.menu}
              aria-label="Site"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration, ease, delay: stagger },
              }}
              exit={{
                opacity: 0,
                transition: { duration, ease, delay: 0 },
              }}
            >
              <p className={cn(styles.prompt, textStyles.bodySm)}>
                <span className={styles.promptMuted}>
                  <span>⋊&gt;</span>
                  <span className={styles.path}>~/O/</span>
                </span>
                <span>ls</span>
              </p>
              <div className={styles.nav}>
                {NAV.map((item) => (
                  <TextLink
                    key={item.id}
                    href={`https://olesgergun.com/#${item.id}`}
                    target="_blank"
                    variant="underline-hover"
                    className={cn(styles.link, textStyles.bodySm)}
                  >
                    {item.label}/
                  </TextLink>
                ))}
              </div>
            </motion.nav>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
