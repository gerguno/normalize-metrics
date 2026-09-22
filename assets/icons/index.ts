import type { ComponentType } from "react";
import type { IconRenderProps } from "@/utils/createIcon";

import { AaIcon } from "./Aa";
import { CheckmarkIcon } from "./Checkmark";
import { CopyIcon } from "./Copy";
import { CssIcon } from "./Css";
import { CubeIcon } from "./Cube";
import { DownloadIcon } from "./Download";
import { GithubIcon } from "./Github";
import { NpmIcon } from "./Npm";
import { PauseIcon } from "./Pause";
import { PlayIcon } from "./Play";
import { UploadIcon } from "./Upload";

export const iconRegistry = {
  aa: AaIcon,
  checkmark: CheckmarkIcon,
  copy: CopyIcon,
  css: CssIcon,
  cube: CubeIcon,
  download: DownloadIcon,
  github: GithubIcon,
  npm: NpmIcon,
  pause: PauseIcon,
  play: PlayIcon,
  upload: UploadIcon,
} as const satisfies Record<string, ComponentType<IconRenderProps>>;

export type IconName = keyof typeof iconRegistry;
