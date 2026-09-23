"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Toggle from "@/components/Toggle";

function useTheme() {
  const [dark, setDark] = useState(false);

  useLayoutEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.dataset.theme === "dark");
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const applySystem = () => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem("theme");
      } catch {
        return;
      }
      if (stored === "dark" || stored === "light") return;
      const next = query.matches;
      if (next) document.documentElement.dataset.theme = "dark";
      else delete document.documentElement.dataset.theme;
      setDark(next);
    };
    applySystem();
    query.addEventListener("change", applySystem);
    return () => query.removeEventListener("change", applySystem);
  }, []);

  function toggleTheme(next: boolean) {
    const root = document.documentElement;
    if (next) root.dataset.theme = "dark";
    else delete root.dataset.theme;
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Storage can be blocked. The attribute still switches this view.
    }
    setDark(next);
  }

  return { dark, toggleTheme };
}

export default function ThemeToggle({ className }: { className?: string }) {
  const { dark, toggleTheme } = useTheme();

  return (
    <Toggle
      variant="icons"
      className={className}
      data-theme-toggle=""
      checked={dark}
      aria-label={dark ? "Use light theme" : "Use dark theme"}
      onCheckedChange={toggleTheme}
    />
  );
}
