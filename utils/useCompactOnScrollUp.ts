import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type RefObject,
} from "react";

const DELTA = 8;

export function useCompactOnScrollUp(
  originRef: RefObject<HTMLElement | null>,
  locked: boolean,
) {
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);
  const lastY = useRef(0);
  const lockedRef = useRef(locked);
  const focusedRef = useRef(false);
  lockedRef.current = locked;

  useEffect(() => {
    let raf = 0;
    let watch = 0;
    let direction: "up" | "down" | null = null;

    const originVisible = () => {
      const el =
        originRef.current ??
        document.querySelector<HTMLElement>("[data-header-origin]");
      if (!el) return false;
      return el.getBoundingClientRect().bottom > 0;
    };

    const apply = (next: boolean) => {
      if (visibleRef.current === next) return;
      visibleRef.current = next;
      setVisible(next);
      if (next) {
        if (!watch) watch = requestAnimationFrame(watchOrigin);
      } else if (watch) {
        cancelAnimationFrame(watch);
        watch = 0;
      }
    };

    const watchOrigin = () => {
      watch = 0;
      if (!visibleRef.current) return;
      if (lockedRef.current) {
        watch = requestAnimationFrame(watchOrigin);
        return;
      }
      if (originVisible()) {
        apply(false);
        return;
      }
      watch = requestAnimationFrame(watchOrigin);
    };

    const update = () => {
      raf = 0;
      const y = window.scrollY || document.documentElement.scrollTop;
      const dir = direction;
      direction = null;

      if (lockedRef.current) {
        lastY.current = y;
        return;
      }

      if (originVisible()) {
        lastY.current = y;
        apply(false);
        return;
      }

      if (focusedRef.current) {
        lastY.current = y;
        apply(true);
        return;
      }

      if (dir === "up") apply(true);
      else if (dir === "down") apply(false);
      else {
        const delta = y - lastY.current;
        if (delta > DELTA) apply(false);
        else if (delta < -DELTA) apply(true);
      }
      lastY.current = y;
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) return;
      direction = event.deltaY < 0 ? "up" : "down";
      schedule();
    };

    let touchY = 0;
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      const next = event.touches[0]?.clientY ?? touchY;
      const delta = touchY - next;
      touchY = next;
      if (Math.abs(delta) < 2) return;
      direction = delta < 0 ? "up" : "down";
      schedule();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (lockedRef.current) return;
      if (event.key === "Home") {
        direction = "down";
        apply(false);
        return;
      }
      if (event.key === "ArrowUp" || event.key === "PageUp") {
        direction = "up";
      } else if (
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        event.key === "End"
      ) {
        direction = "down";
      } else return;
      schedule();
    };

    lastY.current = window.scrollY || document.documentElement.scrollTop;

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("nm:scroll", schedule);
    window.addEventListener("scroll", schedule, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("nm:scroll", schedule);
      window.removeEventListener("scroll", schedule);
      if (raf) cancelAnimationFrame(raf);
      if (watch) cancelAnimationFrame(watch);
    };
  }, [originRef]);

  return {
    visible,
    onFocusCapture: () => {
      focusedRef.current = true;
      visibleRef.current = true;
      setVisible(true);
    },
    onBlurCapture: (event: FocusEvent<HTMLElement>) => {
      const next = event.relatedTarget;
      if (next instanceof Node && event.currentTarget.contains(next)) return;
      focusedRef.current = false;
    },
  };
}
