import { createIcon, type IconRenderProps } from "@/utils/createIcon";

const SIZE = 16;

export const CssIcon = createIcon(
  ({ width = SIZE, height = SIZE, ...props }: IconRenderProps) => ({
    ...props,
    width,
    height,
    viewBox: `0 0 ${SIZE} ${SIZE}`,
    fill: "none",
    children: (
      <path
        d="M5.15 11.65L5.55 9.65H4.3V8.6H5.8L6.05 7.35H4.75V6.3H6.3L6.7 4.35H8.1L7.7 6.3H9.1L9.5 4.35H10.9L10.5 6.3H11.75V7.35H10.3L10 8.6H11.3V9.65H9.8L9.4 11.65H8L8.4 9.65H7L6.6 11.65H5.15ZM8.6 8.6L8.85 7.35H7.45L7.2 8.6H8.6Z"
        fill="#529BBA"
      />
    ),
  }),
);
