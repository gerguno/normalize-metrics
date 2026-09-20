export type Metrics = {
  above: number;
  below: number;
  offset: number;
  centered: number;
  grade: "Great" | "Bad";
  cap: number;
  xHeight?: number;
  upm: number;
  ascent: number;
  descent: number;
};

export type NormalizeResult = {
  family: string;
  fileName: string;
  mime: string;
  before: Metrics;
  after: Metrics;
  originalFamily: string;
  normalizedFamily: string;
  blob?: Blob;
};
