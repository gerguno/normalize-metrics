import { createIcon, type IconRenderProps } from "@/utils/createIcon";

const SIZE = 16;

export const CheckmarkIcon = createIcon(
  ({ width = SIZE, height = SIZE, ...props }: IconRenderProps) => ({
    ...props,
    width,
    height,
    viewBox: `0 0 ${SIZE} ${SIZE}`,
    fill: "none",
    children: (
      <path
        d="M6.5 12L2 7.5L2.707 6.793L6.5 10.5855L13.293 3.793L14 4.5L6.5 12Z"
        fill="currentColor"
      />
    ),
  }),
);
