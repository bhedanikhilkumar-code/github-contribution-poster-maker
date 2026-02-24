import { FONT_HEIGHT, FONT_WIDTH, getGlyph } from "./font5x7";

export type Grid = number[][];

export interface GridOptions {
  columns: number;
  rows: number;
  characterSpacing: number;
}

const DEFAULT_OPTIONS: GridOptions = {
  columns: 53,
  rows: 7,
  characterSpacing: 1
};

export function textToContributionGrid(input: string, options: Partial<GridOptions> = {}): Grid {
  const { columns, rows, characterSpacing } = { ...DEFAULT_OPTIONS, ...options };
  const normalized = input.toUpperCase().replace(/[^A-Z0-9 ]/g, " ").slice(0, 80);
  const grid: Grid = Array.from({ length: rows }, () => Array(columns).fill(0));

  let cursor = 0;

  for (const char of normalized) {
    const glyph = getGlyph(char);

    for (let y = 0; y < Math.min(FONT_HEIGHT, rows); y += 1) {
      for (let x = 0; x < FONT_WIDTH; x += 1) {
        const targetX = cursor + x;
        if (targetX < columns && glyph[y][x] === "1") {
          grid[y][targetX] = 1;
        }
      }
    }

    cursor += FONT_WIDTH + characterSpacing;
    if (cursor >= columns) {
      break;
    }
  }

  return grid;
}
