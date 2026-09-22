"use client";

import TextLink from "@/components/TextLink";
import Reveal from "@/components/Reveal";
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
  return (
    <Reveal show={open} onExitComplete={onExitComplete}>
      <nav className={cn(styles.menu, textStyles.bodyMd)} aria-label="Site">
        <p className={cn(styles.prompt, textStyles.bodyMd)}>
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
              className={cn(styles.link, textStyles.bodyMd)}
            >
              {item.label}/
            </TextLink>
          ))}
        </div>
      </nav>
    </Reveal>
  );
}
