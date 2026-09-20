import type { ComponentType } from "react";
import type { IconRenderProps } from "@/utils/createIcon";

import { AaIcon } from "./Aa";
import { CheckmarkIcon } from "./Checkmark";
import { CopyIcon } from "./Copy";
import { CubeIcon } from "./Cube";
import { DownloadIcon } from "./Download";
import { PauseIcon } from "./Pause";
import { PlayIcon } from "./Play";
import { UploadIcon } from "./Upload";

export const iconRegistry = {
  aa: AaIcon,
  checkmark: CheckmarkIcon,
  copy: CopyIcon,
  cube: CubeIcon,
  download: DownloadIcon,
  pause: PauseIcon,
  play: PlayIcon,
  upload: UploadIcon,
} as const satisfies Record<string, ComponentType<IconRenderProps>>;

export type IconName = keyof typeof iconRegistry;
