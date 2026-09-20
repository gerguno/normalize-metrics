import { createIcon, type IconRenderProps } from "@/utils/createIcon";

const SIZE = 16;

export const DownloadIcon = createIcon(
  ({ width = SIZE, height = SIZE, ...props }: IconRenderProps) => ({
    ...props,
    width,
    height,
    viewBox: `0 0 ${SIZE} ${SIZE}`,
    fill: "none",
    children: (
      <>
        <path
          d="M8 2.5V10.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="square"
        />
        <path
          d="M5 8L8 11L11 8"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <path
          d="M3 13.5H13"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="square"
        />
      </>
    ),
  }),
);
