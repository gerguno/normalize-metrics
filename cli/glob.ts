/** Minimal glob matcher for include/exclude. Supports *, **, ?, and {a,b}. */

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, "\\*");
}

function expandBraces(pattern: string): string[] {
  const match = pattern.match(/\{([^{}]+)\}/);
  if (!match || match.index == null) return [pattern];
  const start = match.index;
  const [token, inner] = match;
  return inner.split(",").flatMap((choice) =>
    expandBraces(pattern.slice(0, start) + choice + pattern.slice(start + token.length)),
  );
}

function globToRegExp(pattern: string): RegExp {
  const normalized = pattern.replaceAll("\\", "/");
  let source = "^";
  let i = 0;
  while (i < normalized.length) {
    if (normalized.startsWith("**/", i)) {
      source += "(?:.*/)?";
      i += 3;
      continue;
    }
    if (normalized.startsWith("**", i)) {
      source += ".*";
      i += 2;
      continue;
    }
    const ch = normalized[i];
    if (ch === "*") {
      source += "[^/]*";
    } else if (ch === "?") {
      source += "[^/]";
    } else {
      source += escapeRegExp(ch);
    }
    i += 1;
  }
  source += "$";
  return new RegExp(source);
}

export function matchesGlob(relPath: string, pattern: string): boolean {
  const path = relPath.replaceAll("\\", "/");
  const patterns = expandBraces(pattern);
  return patterns.some((entry) => {
    const trimmed = entry.replaceAll("\\", "/");
    const direct = globToRegExp(trimmed);
    if (direct.test(path)) return true;
    if (!trimmed.includes("/")) {
      return globToRegExp(`**/${trimmed}`).test(path);
    }
    return false;
  });
}

export function matchesAny(relPath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesGlob(relPath, pattern));
}
