export type IntensityPalette = [string, string, string, string, string];

export const DEFAULT_PALETTE: IntensityPalette = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : normalized;

  const number = Number.parseInt(value, 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function interpolateHex(startHex: string, endHex: string, ratio: number): string {
  const [sr, sg, sb] = hexToRgb(startHex);
  const [er, eg, eb] = hexToRgb(endHex);
  const r = Math.round(sr + (er - sr) * ratio);
  const g = Math.round(sg + (eg - sg) * ratio);
  const b = Math.round(sb + (eb - sb) * ratio);
  return rgbToHex([r, g, b]);
}

export function buildPaletteFromEndpoints(inactiveColor: string, activeColor: string): IntensityPalette {
  return [
    inactiveColor,
    interpolateHex(inactiveColor, activeColor, 0.25),
    interpolateHex(inactiveColor, activeColor, 0.5),
    interpolateHex(inactiveColor, activeColor, 0.75),
    activeColor
  ];
}

export function colorForLevel(level: number, palette: IntensityPalette): string {
  const index = Math.max(0, Math.min(4, Math.round(level)));
  return palette[index];
}
