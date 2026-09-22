export type Mode = "write" | "dry-run" | "check" | "css";

export type Config = {
  include: string[];
  exclude: string[];
  outDir: string | null;
  suffix: string;
};

export type Args = {
  paths: string[];
  check: boolean;
  dryRun: boolean;
  inPlace: boolean;
  outDir: string | null;
  suffix: string | null;
  configPath: string | null;
  cssPath: string | null;
  help: boolean;
  version: boolean;
};

export type FontKind = "font" | "ttc";

export type Discovered = {
  abs: string;
  rel: string;
  name: string;
  kind: FontKind;
};

export type Metrics = {
  upm: number;
  ascent: number;
  descent: number;
  lineGap: number;
  cap: number;
  above: number;
  below: number;
  offset: number;
  centered: number;
  ascentOverride: number;
  descentOverride: number;
  grade: "Great" | "Bad";
};

export type EngineResult = {
  family?: string;
  weight?: number;
  style?: string;
  before?: Metrics;
  after?: Metrics;
  off?: boolean;
  output?: string;
  skip?: string;
};

export type FilePhase =
  | "queued"
  | "analyzing"
  | "rewriting"
  | "writing"
  | "done"
  | "skipped"
  | "failed"
  | "off"
  | "ok";

export type FileRow = {
  id: string;
  label: string;
  percent: number;
  phase: FilePhase;
  detail: string;
};

export type FileOutcome =
  | { status: "wrote"; dest: string; result: EngineResult }
  | { status: "would-write"; dest: string; result: EngineResult }
  | { status: "ok"; result: EngineResult }
  | { status: "css"; result: EngineResult }
  | { status: "off"; result: EngineResult }
  | { status: "skipped"; reason: string }
  | { status: "failed"; message: string };
