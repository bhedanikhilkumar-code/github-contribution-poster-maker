import { colorForLevel, IntensityPalette } from "./colorScale";
import { Grid } from "./textToGrid";

interface SvgExportOptions {
  cellSize: number;
  gap: number;
  palette: IntensityPalette;
  backgroundColor: string;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function exportGridToSvg(grid: Grid, options: SvgExportOptions): void {
  const width = grid[0]?.length ?? 0;
  const height = grid.length;

  if (width === 0 || height === 0) {
    return;
  }

  const { cellSize, gap, palette, backgroundColor } = options;
  const svgWidth = width * (cellSize + gap) + gap;
  const svgHeight = height * (cellSize + gap) + gap;

  const cells: string[] = [];

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const x = col * (cellSize + gap) + gap;
      const y = row * (cellSize + gap) + gap;
      const fill = escapeXml(colorForLevel(grid[row][col], palette));
      cells.push(`<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" ry="2" fill="${fill}" />`);
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" role="img" aria-label="Contribution poster">\n  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="${escapeXml(backgroundColor)}" />\n  ${cells.join("\n  ")}\n</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "contribution-poster.svg";
  link.click();
  URL.revokeObjectURL(url);
}
