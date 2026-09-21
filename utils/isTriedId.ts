import { TRIED_FONTS, type TriedId } from "@/lib/triedFonts";

export function isTriedId(value: string): value is TriedId {
  return TRIED_FONTS.some((item) => item.id === value);
}
