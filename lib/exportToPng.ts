import { colorForLevel, IntensityPalette } from "./colorScale";
import { Grid } from "./textToGrid";

interface ExportOptions {
  cellSize: number;
  gap: number;
  palette: IntensityPalette;
  backgroundColor: string;
}

export function exportGridToPng(grid: Grid, options: ExportOptions): void {
  const width = grid[0]?.length ?? 0;
  const height = grid.length;

  if (width === 0 || height === 0) {
    return;
  }

  const { cellSize, gap, palette, backgroundColor } = options;
  const canvas = document.createElement("canvas");
  const canvasWidth = width * (cellSize + gap) + gap;
  const canvasHeight = height * (cellSize + gap) + gap;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      context.fillStyle = colorForLevel(grid[row][col], palette);
      const x = col * (cellSize + gap) + gap;
      const y = row * (cellSize + gap) + gap;
      context.fillRect(x, y, cellSize, cellSize);
    }
  }

  const link = document.createElement("a");
  link.download = "contribution-poster.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
