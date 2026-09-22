"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { animate } from "motion/react";
import { usePrefersReducedMotion } from "@/utils/usePrefersReducedMotion";

const DURATION_MS = 400;
const EASING = [0.4, 0, 0.2, 1] as const;

const FadeEnterContext = createContext(false);

/** True on the copy that is fading in after a presence change. */
export function useFadeEnter() {
  return useContext(FadeEnterContext);
}

export type FadeProps = {
  presenceKey: string;
  className?: string;
  children: ReactNode;
};

type Layer = {
  key: string;
  node: ReactNode;
};

export default function Fade({ presenceKey, className, children }: FadeProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [canAnimate, setCanAnimate] = useState(false);
  const [leaving, setLeaving] = useState<Layer | null>(null);
  const [enterKey, setEnterKey] = useState<string | null>(null);
  const prevKey = useRef(presenceKey);
  const prevNode = useRef(children);
  const hasShown = useRef(false);
  const enterRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanAnimate(true);
  }, []);

  if (prevKey.current !== presenceKey) {
    const snapshot = { key: prevKey.current, node: prevNode.current };
    prevKey.current = presenceKey;
    if (canAnimate && !reduceMotion && hasShown.current) {
      setLeaving(snapshot);
      setEnterKey(presenceKey);
    }
  }
  prevNode.current = children;
  hasShown.current = true;

  const entering = enterKey === presenceKey;

  useLayoutEffect(() => {
    const node = enterRef.current;
    if (!node || !entering || reduceMotion) return;
    node.style.opacity = "0";
  }, [entering, presenceKey, reduceMotion]);

  useEffect(() => {
    const node = enterRef.current;
    if (!node || !entering || reduceMotion) return;
    const anim = animate(
      node,
      { opacity: [0, 1] },
      { duration: DURATION_MS / 1000, ease: EASING },
    );
    return () => anim.stop();
  }, [entering, presenceKey, reduceMotion]);

  useEffect(() => {
    const node = exitRef.current;
    if (!node || !leaving || reduceMotion) return;
    const key = leaving.key;
    let cancelled = false;
    const anim = animate(
      node,
      { opacity: [1, 0] },
      { duration: DURATION_MS / 1000, ease: EASING },
    );
    anim.then(() => {
      if (!cancelled) {
        setLeaving((current) => (current?.key === key ? null : current));
      }
    });
    return () => {
      cancelled = true;
      anim.stop();
    };
  }, [leaving, reduceMotion]);

  if (!canAnimate || reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <>
      {leaving ? (
        <div key={leaving.key} ref={exitRef} className={className}>
          {leaving.node}
        </div>
      ) : null}
      <div key={presenceKey} ref={enterRef} className={className}>
        <FadeEnterContext.Provider value={entering}>
          {children}
        </FadeEnterContext.Provider>
      </div>
    </>
  );
}
