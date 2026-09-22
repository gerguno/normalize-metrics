import { Fragment } from "react";
import type { SyntaxToken } from "@/utils/highlight";
import styles from "./index.module.scss";

export default function Syntax({ tokens }: { tokens: SyntaxToken[] }) {
  return tokens.map((token, index) =>
    token.role === "plain" ? (
      <Fragment key={index}>{token.text}</Fragment>
    ) : (
      <span key={index} className={styles[token.role]}>
        {token.text}
      </span>
    ),
  );
}
