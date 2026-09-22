"use client";

import { useId, useLayoutEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  useVelocity,
} from "motion/react";
import { cn } from "@/utils/cn";
import styles from "./index.module.scss";

const EXTRA_TURNS = 1;
const BASE_DURATION = 0.55;
const STAGGER = 0.1;
const EASE: [number, number, number, number] = [0.12, 0.82, 0.18, 1];
const REEL_COPIES = 4;
const REEL_BASE = 10;
const REEL = Array.from({ length: 10 * REEL_COPIES }, (_, index) => index % 10);

type Glyph =
  | { type: "digit"; digit: number }
  | { type: "symbol"; char: string };

function tokenize(value: string): Glyph[] {
  return Array.from(value).map((char) =>
    char >= "0" && char <= "9"
      ? { type: "digit", digit: Number(char) }
      : { type: "symbol", char },
  );
}

export type RollingNumberProps = {
  value: string;
  /** Changes the spin even when the digits stay the same. */
  spinKey?: string;
  className?: string;
};

export default function RollingNumber({
  value,
  spinKey = value,
  className,
}: RollingNumberProps) {
  const reduceMotion = useReducedMotion();
  const glyphs = tokenize(value);
  let digitOrder = 0;

  return (
    <span className={cn(styles.root, className)}>
      <span className={styles.srOnly}>{value}</span>
      <span className={styles.track} aria-hidden>
        {glyphs.map((glyph, index) =>
          glyph.type === "digit" ? (
            <DigitReel
              key={`d-${index}`}
              digit={glyph.digit}
              order={digitOrder++}
              spinKey={spinKey}
              reduceMotion={!!reduceMotion}
            />
          ) : (
            <span key={`s-${index}-${glyph.char}`} className={styles.symbol}>
              {glyph.char}
            </span>
          ),
        )}
      </span>
    </span>
  );
}

function DigitReel({
  digit,
  order,
  spinKey,
  reduceMotion,
}: {
  digit: number;
  order: number;
  spinKey: string;
  reduceMotion: boolean;
}) {
  const filterId = useId().replace(/:/g, "");
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const primed = useRef(false);
  const spinning = useRef(false);
  const y = useMotionValue(REEL_BASE + digit);
  const offset = useTransform(y, (index) => `${-index * 1.2}em`);
  const velocity = useVelocity(y);

  const setBlur = (amount: number) => {
    const value = amount < 0.3 ? 0 : Math.min(5, amount);
    blurRef.current?.setAttribute("stdDeviation", `0 ${value}`);
  };

  useMotionValueEvent(velocity, "change", (speed) => {
    if (!spinning.current) {
      setBlur(0);
      return;
    }
    setBlur(Math.abs(speed) * 0.022);
  });

  useLayoutEffect(() => {
    if (reduceMotion || !primed.current) {
      primed.current = true;
      spinning.current = false;
      y.jump(REEL_BASE + digit);
      setBlur(0);
      return;
    }

    const from = ((Math.round(y.get()) % 10) + 10) % 10;
    const distance = ((digit - from + 10) % 10) + EXTRA_TURNS * 10;
    y.jump(REEL_BASE + from);

    spinning.current = true;
    const controls = animate(y, REEL_BASE + from + distance, {
      duration: BASE_DURATION + order * STAGGER,
      ease: EASE,
      onComplete: () => {
        spinning.current = false;
        setBlur(0);
        y.jump(REEL_BASE + digit);
      },
    });

    return () => {
      spinning.current = false;
      setBlur(0);
      controls.stop();
    };
  }, [digit, order, reduceMotion, spinKey, y]);

  return (
    <span className={styles.slot}>
      <svg className={styles.filter} aria-hidden>
        <filter id={filterId} x="-40%" y="-80%" width="180%" height="260%">
          <feGaussianBlur ref={blurRef} in="SourceGraphic" stdDeviation="0 0" />
        </filter>
      </svg>
      <motion.span
        className={styles.reel}
        style={{ y: offset, filter: `url(#${filterId})` }}
      >
        {REEL.map((face, index) => (
          <span key={index} className={styles.face}>
            {face}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
