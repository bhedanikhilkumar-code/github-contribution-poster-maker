import { colorForLevel, IntensityPalette } from "@/lib/colorScale";
import { Grid } from "@/lib/textToGrid";

interface ContributionGridProps {
  grid: Grid;
  palette: IntensityPalette;
  cellSize: number;
  animate: boolean;
  animationSeed: number;
}

export function ContributionGrid({ grid, palette, cellSize, animate, animationSeed }: ContributionGridProps) {
  const columns = grid[0]?.length ?? 0;
  const gap = Math.max(1, Math.round(cellSize * 0.25));

  return (
    <div
      className="overflow-auto rounded-xl border border-slate-300/80 bg-white/60 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40"
      aria-label="Contribution preview"
    >
      <div
        className="grid"
        style={{
          gap,
          gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`
        }}
      >
        {grid.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const index = rowIndex * columns + colIndex;

            return (
              <div
                key={`${rowIndex}-${colIndex}-${animationSeed}`}
                className={animate ? "animate-cell" : ""}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: colorForLevel(cell, palette),
                  borderRadius: Math.max(2, Math.round(cellSize * 0.2)),
                  animationDelay: animate ? `${index * 12}ms` : undefined
                }}
                title={`Intensity: ${cell}`}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
