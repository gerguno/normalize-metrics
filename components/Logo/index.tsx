"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { cn } from "@/utils/cn";
import textStyles from "@/styles/typography.module.scss";
import styles from "./index.module.scss";

export type LogoProps = {
  width?: number | "auto";
  height?: number | "auto";
  borderRadius?: number;
  logoOnly?: boolean;
  inverted?: boolean;
  animated?: boolean;
  href?: string;
  className?: string;
  "aria-label"?: string;
};

const VIEWBOX_SIZE = 24;
const LAYERS = 6;
const RECT_COUNT = LAYERS + 1; // фон + шари
const DURATION_MS = 700;
const STAGGER = 0.1; // частка від DURATION_MS між сусідніми rect'ами
const TOTAL_MS = DURATION_MS * (1 + (RECT_COUNT - 1) * STAGGER);

export default function Logo({
  width = "auto",
  height = "auto",
  borderRadius = 0,
  logoOnly = false,
  inverted = false,
  animated = false,
  href = "https://olesgergun.com",
  className,
  "aria-label": ariaLabel = "Oles Gergun",
}: LogoProps) {
  const maskId = useId();
  const [active, setActive] = useState(false);
  const hoveredRef = useRef(false);
  const playingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleEnter = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== "mouse") return; // без hover на тачі
    hoveredRef.current = true;
    if (playingRef.current) return; // вже грає вперед, не чіпаємо

    playingRef.current = true;
    setActive(true);
    timerRef.current = setTimeout(() => {
      playingRef.current = false;
      if (!hoveredRef.current) setActive(false);
    }, TOTAL_MS);
  };

  const handleLeave = () => {
    hoveredRef.current = false;
    // якщо ще грає, клас зніме таймер після дограшу
    if (!playingRef.current) setActive(false);
  };

  const center = VIEWBOX_SIZE / 2;
  const baseInnerSize = VIEWBOX_SIZE / 2;
  const sizes = Array.from(
    { length: LAYERS },
    (_, i) => baseInnerSize / 2 ** i,
  );
  const svgWidth = width === "auto" ? "100%" : width;
  const svgHeight = height === "auto" ? "100%" : height;

  const renderedSize =
    typeof width === "number"
      ? width
      : typeof height === "number"
        ? height
        : null;
  const maskRadius = renderedSize
    ? (borderRadius * VIEWBOX_SIZE) / renderedSize
    : borderRadius;

  const rootStyle = {
    ...(width !== "auto" && { width }),
    ...(height !== "auto" && { height }),
    "--logo-duration": `${DURATION_MS}ms`,
    "--logo-stagger": STAGGER,
  } as CSSProperties;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        styles.root,
        active && styles.active,
        inverted && styles.inverted,
        className,
      )}
      style={rootStyle}
      aria-label={ariaLabel}
      onPointerEnter={animated ? handleEnter : undefined}
      onPointerLeave={animated ? handleLeave : undefined}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={VIEWBOX_SIZE}
            height={VIEWBOX_SIZE}
          >
            <rect
              width={VIEWBOX_SIZE}
              height={VIEWBOX_SIZE}
              rx={maskRadius}
              fill="white"
            />
          </mask>
        </defs>
        <g mask={`url(#${maskId})`}>
          <rect width={VIEWBOX_SIZE} height={VIEWBOX_SIZE} />
          {sizes.map((size, index) => (
            <rect
              key={index}
              x={center - size / 2}
              y={center - size / 2}
              width={size}
              height={size}
            />
          ))}
        </g>
      </svg>
      {!logoOnly && <span className={textStyles.bodySm}>Oles Gergun</span>}
    </a>
  );
}
