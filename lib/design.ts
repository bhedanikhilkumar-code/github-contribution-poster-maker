import { IntensityPalette } from "./colorScale";
import { Grid } from "./textToGrid";

export const LAST_DESIGN_KEY = "gcpm_last_design";

export interface DesignTheme {
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
  background: string;
}

export interface DesignSchema {
  text: string;
  grid: number[][];
  rows: number;
  cols: number;
  cellSize: number;
  theme: DesignTheme;
  createdAt: string;
}

function isHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function validateDesign(data: unknown): { ok: boolean; error?: string } {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Design must be an object." };
  }

  const design = data as Partial<DesignSchema>;

  if (typeof design.text !== "string") {
    return { ok: false, error: "text must be a string." };
  }

  if (!Array.isArray(design.grid) || design.grid.length === 0 || !design.grid.every((row) => Array.isArray(row))) {
    return { ok: false, error: "grid must be a non-empty 2D array." };
  }

  if (typeof design.rows !== "number" || !Number.isInteger(design.rows) || design.rows <= 0) {
    return { ok: false, error: "rows must be a positive integer." };
  }

  if (typeof design.cols !== "number" || !Number.isInteger(design.cols) || design.cols <= 0) {
    return { ok: false, error: "cols must be a positive integer." };
  }

  if (design.grid.length !== design.rows) {
    return { ok: false, error: "rows does not match grid height." };
  }

  for (const row of design.grid) {
    if (row.length !== design.cols) {
      return { ok: false, error: "cols does not match grid width." };
    }

    for (const cell of row) {
      if (typeof cell !== "number" || !Number.isFinite(cell) || cell < 0) {
        return { ok: false, error: "grid values must be non-negative numbers." };
      }
    }
  }

  if (typeof design.cellSize !== "number" || !Number.isFinite(design.cellSize) || design.cellSize <= 0) {
    return { ok: false, error: "cellSize must be a positive number." };
  }

  if (!design.theme || typeof design.theme !== "object") {
    return { ok: false, error: "theme is required." };
  }

  const theme = design.theme as Partial<DesignTheme>;
  const themeValues = [theme.level1, theme.level2, theme.level3, theme.level4, theme.level5, theme.background];

  if (themeValues.some((value) => typeof value !== "string" || !isHex(value))) {
    return { ok: false, error: "theme colors must be valid hex values." };
  }

  if (typeof design.createdAt !== "string" || Number.isNaN(Date.parse(design.createdAt))) {
    return { ok: false, error: "createdAt must be a valid ISO date string." };
  }

  return { ok: true };
}

export function serializeDesign(input: {
  text: string;
  grid: Grid;
  cellSize: number;
  palette: IntensityPalette;
  background: string;
}): string {
  const cols = input.grid[0]?.length ?? 0;

  const design: DesignSchema = {
    text: input.text,
    grid: input.grid,
    rows: input.grid.length,
    cols,
    cellSize: input.cellSize,
    theme: {
      level1: input.palette[0],
      level2: input.palette[1],
      level3: input.palette[2],
      level4: input.palette[3],
      level5: input.palette[4],
      background: input.background
    },
    createdAt: new Date().toISOString()
  };

  return JSON.stringify(design, null, 2);
}

export function deserializeDesign(json: string): DesignSchema {
  const parsed = JSON.parse(json) as unknown;
  const result = validateDesign(parsed);

  if (!result.ok) {
    throw new Error(result.error);
  }

  return parsed as DesignSchema;
}
