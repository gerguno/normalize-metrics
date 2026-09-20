import {
  type HTMLAttributes,
  type ReactNode,

} from "react";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

export type CodeChipProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

export default function CodeChip({ className, ...rest }: CodeChipProps) {
  return <span className={cn(styles.root, textStyles.monoSm, className)} {...rest} />;
}