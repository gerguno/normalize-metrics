export type GuideAlign = "center" | "above" | "below";

export function guideAligns(ys: number[], height: number): GuideAlign[] {
  const up = ys.map(() => false);
  const down = ys.map(() => false);
  const order = ys
    .map((y, index) => ({ y, index }))
    .sort((a, b) => a.y - b.y);

  for (let i = 0; i < order.length - 1; i++) {
    const higher = order[i];
    const lower = order[i + 1];
    if (lower.y - higher.y < height) {
      up[higher.index] = true;
      down[lower.index] = true;
    }
  }

  return ys.map((_, index) => {
    if (up[index] && down[index]) return "center";
    if (up[index]) return "above";
    if (down[index]) return "below";
    return "center";
  });
}
