export type HighlightLanguage = "css" | "shell";

export type SyntaxRole =
  | "plain"
  | "comment"
  | "keyword"
  | "constant"
  | "string"
  | "entity"
  | "tag"
  | "variable";

export type SyntaxToken = {
  role: SyntaxRole;
  text: string;
};

type CssMode = "selector" | "declaration" | "value";

const SHELL_MANAGERS = new Set(["npm", "yarn", "pnpm", "bun"]);

export function highlight(code: string, language: HighlightLanguage): SyntaxToken[] {
  return language === "css" ? highlightCss(code) : highlightShell(code);
}

export function highlightLines(code: string, language: HighlightLanguage): SyntaxToken[][] {
  const lines: SyntaxToken[][] = [[]];
  for (const token of highlight(code, language)) {
    const parts = token.text.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ role: token.role, text: part });
    });
  }
  return lines;
}

export function detectLanguage(code: string): HighlightLanguage | null {
  if (/[{}:;]|\/\*/.test(code)) return "css";
  if (isShellCommand(code)) return "shell";
  return null;
}

function isShellCommand(code: string): boolean {
  const words = code.trim().split(/\s+/).filter(Boolean);
  return words.some((word) => !word.startsWith("-") && !/^(?:&&|\|\||[|;<>]+)$/.test(word));
}

export function languageFromFilename(name: string): HighlightLanguage | null {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "css") return "css";
  if (extension === "sh" || extension === "bash" || extension === "zsh") return "shell";
  return null;
}

function push(tokens: SyntaxToken[], role: SyntaxRole, text: string) {
  if (!text) return;
  const last = tokens[tokens.length - 1];
  if (last?.role === role) last.text += text;
  else tokens.push({ role, text });
}

function highlightCss(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let i = 0;
  let depth = 0;
  let mode: CssMode = /[{}]/.test(code) ? "selector" : "declaration";

  while (i < code.length) {
    const ch = code[i];

    if (ch === "/" && code[i + 1] === "*") {
      const end = code.indexOf("*/", i + 2);
      const stop = end === -1 ? code.length : end + 2;
      push(tokens, "comment", code.slice(i, stop));
      i = stop;
      continue;
    }

    if (isSpace(ch)) {
      let j = i + 1;
      while (j < code.length && isSpace(code[j])) j += 1;
      push(tokens, "plain", code.slice(i, j));
      i = j;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const stop = readQuoted(code, i);
      push(tokens, "string", code.slice(i, stop));
      i = stop;
      continue;
    }

    if (ch === "@") {
      const ident = readIdent(code, i + 1);
      if (ident) {
        push(tokens, "keyword", `@${ident}`);
        i += 1 + ident.length;
        continue;
      }
    }

    if (ch === "#") {
      const hex = /^#(?:[0-9a-fA-F]{3,8})(?![0-9a-fA-F])/.exec(code.slice(i));
      if (hex && mode === "value") {
        push(tokens, "constant", hex[0]);
        i += hex[0].length;
        continue;
      }
      const id = /^#[A-Za-z_][\w-]*/.exec(code.slice(i));
      if (id && mode !== "value") {
        push(tokens, "keyword", id[0]);
        i += id[0].length;
        continue;
      }
    }

    if (ch === "." && mode === "selector") {
      const selector = /^\.[A-Za-z_-][\w-]*/.exec(code.slice(i));
      if (selector) {
        push(tokens, "tag", selector[0]);
        i += selector[0].length;
        continue;
      }
    }

    if (isNumberStart(code, i)) {
      const number = /^(?:[+-])?(?:\d+\.\d+|\d+|\.\d+)(?:%|[A-Za-z]+)?/.exec(code.slice(i));
      if (number) {
        push(tokens, "constant", number[0]);
        i += number[0].length;
        continue;
      }
    }

    const ident = readIdent(code, i);
    if (ident) {
      const after = code.slice(i + ident.length);
      const nextChar = /^[ \t\r\n]*(\S)/.exec(after)?.[1];
      push(tokens, identRole(ident, after, nextChar, mode), ident);
      i += ident.length;
      continue;
    }

    push(tokens, punctuationRole(ch), ch);
    if (ch === "{") {
      depth += 1;
      mode = "declaration";
    } else if (ch === "}") {
      depth = Math.max(0, depth - 1);
      mode = "selector";
    } else if (ch === ";") {
      mode = depth === 0 ? "selector" : "declaration";
    } else if (ch === ":") {
      const pseudo = mode === "selector" && /^::?(?:[A-Za-z_-]|$)/.test(code.slice(i));
      if (!pseudo) mode = "value";
    }
    i += 1;
  }

  return tokens;
}

function identRole(ident: string, after: string, nextChar: string | undefined, mode: CssMode): SyntaxRole {
  if (nextChar === "(") return "entity";
  if (mode === "value") return "string";
  if (ident.startsWith("--")) return "variable";
  if (isProperty(after, mode) || mode === "declaration") return "tag";
  return "keyword";
}

function punctuationRole(ch: string): SyntaxRole {
  if (ch === "{" || ch === "}") return "keyword";
  if ("():;,.#".includes(ch)) return "comment";
  return "plain";
}

function isProperty(after: string, mode: CssMode): boolean {
  if (!/^[ \t\r\n]*:/.test(after)) return false;
  if (mode === "selector" && /^:[:A-Za-z_-]/.test(after)) return false;
  return true;
}

function highlightShell(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  const lines = code.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    if (index > 0) push(tokens, "plain", "\n");
    highlightShellLine(lines[index], tokens);
  }
  return tokens;
}

function highlightShellLine(line: string, tokens: SyntaxToken[]) {
  let i = 0;
  let position = 0;
  let command = "";

  while (i < line.length) {
    const ch = line[i];

    if (ch === " " || ch === "\t") {
      let j = i + 1;
      while (j < line.length && (line[j] === " " || line[j] === "\t")) j += 1;
      push(tokens, "plain", line.slice(i, j));
      i = j;
      continue;
    }

    if (ch === "#" && (i === 0 || line[i - 1] === " " || line[i - 1] === "\t")) {
      push(tokens, "comment", line.slice(i));
      return;
    }

    if (ch === '"' || ch === "'") {
      const stop = readQuoted(line, i);
      push(tokens, "string", line.slice(i, stop));
      i = stop;
      position += 1;
      continue;
    }

    let j = i + 1;
    while (j < line.length && line[j] !== " " && line[j] !== "\t") j += 1;
    const word = line.slice(i, j);
    i = j;

    if (/^(?:&&|\|\||[|;<>]+)$/.test(word)) {
      push(tokens, "constant", word);
      position = 0;
      command = "";
      continue;
    }

    if (word.startsWith("-")) {
      push(tokens, "tag", word);
      continue;
    }

    if (position === 0) {
      push(tokens, "entity", word);
      command = word;
      position = 1;
      continue;
    }

    if (position === 1 && command === "npx" && !word.startsWith(".") && !word.includes("/")) {
      push(tokens, "entity", word);
      position = 2;
      continue;
    }

    if (position === 1 && SHELL_MANAGERS.has(command) && /^[a-z][\w-]*$/.test(word)) {
      push(tokens, "keyword", word);
      position = 2;
      continue;
    }

    push(tokens, "string", word);
    position += 1;
  }
}

function readIdent(code: string, start: number): string | null {
  return /^(?:--|-)?[A-Za-z_][\w-]*/.exec(code.slice(start))?.[0] ?? null;
}

function readQuoted(code: string, start: number): number {
  const quote = code[start];
  let i = start + 1;
  while (i < code.length) {
    if (code[i] === "\\") {
      i += 2;
      continue;
    }
    if (code[i] === quote) return i + 1;
    if (code[i] === "\n") return i;
    i += 1;
  }
  return i;
}

function isSpace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

function isNumberStart(code: string, index: number): boolean {
  const ch = code[index];
  const next = code[index + 1] ?? "";
  if (ch >= "0" && ch <= "9") return true;
  if (ch === "." && next >= "0" && next <= "9") return true;
  if ((ch === "+" || ch === "-") && (next >= "0" && next <= "9" || (next === "." && (code[index + 2] ?? "") >= "0"))) {
    return true;
  }
  return false;
}
