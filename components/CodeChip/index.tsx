import { type HTMLAttributes } from "react";
import Syntax from "@/components/Syntax";
import { detectLanguage, highlight, type HighlightLanguage } from "@/utils/highlight";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

export type CodeChipProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  children: string;
  language?: HighlightLanguage;
};

export default function CodeChip({ className, children, language, ...rest }: CodeChipProps) {
  const resolved = language ?? detectLanguage(children);
  return (
    <span className={cn(styles.root, textStyles.monoMd, className)} {...rest}>
      {resolved ? <Syntax tokens={highlight(children, resolved)} /> : children}
    </span>
  );
}
