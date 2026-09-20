import type { Metrics } from "./types";

export type TriedId = "unica77" | "america" | "ritma";

export type TriedFont = {
  id: TriedId;
  label: string;
  family: string;
  originalUrl: string;
  normalizedUrl: string;
  fileName: string;
  before: Metrics;
  after: Metrics;
};

export const TRIED_FONTS: TriedFont[] = [
  {
    id: "unica77",
    label: "Unica77",
    family: "Unica77",
    originalUrl: "/test/Unica77LL-Regular.otf",
    normalizedUrl: "/test/Unica77LL-Regular-normalized.otf",
    fileName: "Unica77LL-Regular-normalized.otf",
    before: {
      upm: 1000,
      ascent: 750,
      descent: -250,
      cap: 726,
      xHeight: 516,
      above: 24,
      below: 250,
      offset: -113,
      centered: 77,
      grade: "Bad",
    },
    after: {
      upm: 1000,
      ascent: 981,
      descent: -255,
      cap: 726,
      xHeight: 516,
      above: 255,
      below: 255,
      offset: 0,
      centered: 100,
      grade: "Great",
    },
  },
  {
    id: "america",
    label: "America",
    family: "America",
    originalUrl: "/test/GT-America-Regular.otf",
    normalizedUrl: "/test/GT-America-Regular-normalized.otf",
    fileName: "GT-America-Regular-normalized.otf",
    before: {
      upm: 1000,
      ascent: 1005,
      descent: -200,
      cap: 710,
      xHeight: 500,
      above: 295,
      below: 200,
      offset: 47.5,
      centered: 92,
      grade: "Bad",
    },
    after: {
      upm: 1000,
      ascent: 949,
      descent: -239,
      cap: 710,
      xHeight: 500,
      above: 239,
      below: 239,
      offset: 0,
      centered: 100,
      grade: "Great",
    },
  },
  {
    id: "ritma",
    label: "Ritma",
    family: "Ritma",
    originalUrl: "/test/RitmaUnlicencedTrial-Regular.otf",
    normalizedUrl: "/test/RitmaUnlicencedTrial-Regular-normalized.otf",
    fileName: "RitmaUnlicencedTrial-Regular-normalized.otf",
    before: {
      upm: 1000,
      ascent: 755,
      descent: -245,
      cap: 700,
      xHeight: 485,
      above: 55,
      below: 245,
      offset: -95,
      centered: 81,
      grade: "Bad",
    },
    after: {
      upm: 1000,
      ascent: 929,
      descent: -229,
      cap: 700,
      xHeight: 485,
      above: 229,
      below: 229,
      offset: 0,
      centered: 100,
      grade: "Great",
    },
  },
];
