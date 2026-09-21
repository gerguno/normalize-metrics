"use client";

import { useEffect } from "react";
import { useOverlayScrollbars } from "overlayscrollbars-react";

const OPTIONS = {
  overflow: {
    x: "hidden" as const,
  },
  scrollbars: {
    theme: "os-theme-minimal",
    autoHide: "never" as const,
    clickScroll: true,
  },
};

const EVENTS = {
  scroll: () => {
    window.dispatchEvent(new Event("nm:scroll"));
  },
};

export default function Scrollbar() {
  const [initialize] = useOverlayScrollbars({
    defer: true,
    options: OPTIONS,
    events: EVENTS,
  });

  useEffect(() => {
    initialize(document.body);
  }, [initialize]);

  return null;
}
