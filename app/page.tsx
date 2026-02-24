"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { ContributionGrid } from "@/components/ContributionGrid";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DEFAULT_PALETTE, IntensityPalette, buildPaletteFromEndpoints } from "@/lib/colorScale";
import { ContributionApiResponse, contributionWeeksToGrid } from "@/lib/contributionData";
import { LAST_DESIGN_KEY, deserializeDesign, serializeDesign } from "@/lib/design";
import { exportGridToPng } from "@/lib/exportToPng";
import { exportGridToSvg } from "@/lib/exportToSvg";
import { Grid, textToContributionGrid } from "@/lib/textToGrid";

const MIN_COLUMNS = 20;
const MAX_COLUMNS = 53;
const MIN_CELL = 8;
const MAX_CELL = 24;
const THEME_KEY = "poster-maker-theme";

type Mode = "text" | "github";

function paletteFromUrlParam(value: string | null): IntensityPalette | null {
  if (!value) return null;
  const parts = value.split(",").map((item) => (item.startsWith("#") ? item : `#${item}`));
  if (parts.length !== 5) return null;
  if (parts.some((item) => !/^#[0-9a-fA-F]{6}$/.test(item))) return null;
  return parts as IntensityPalette;
}

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("HELLO 2026");
  const [username, setUsername] = useState("octocat");
  const [columns, setColumns] = useState(53);
  const [cellSize, setCellSize] = useState(12);
  const [palette, setPalette] = useState<IntensityPalette>(DEFAULT_PALETTE);
  const [darkMode, setDarkMode] = useState(false);
  const [animationMode, setAnimationMode] = useState(false);
  const [animationSeed, setAnimationSeed] = useState(0);
  const [githubGrid, setGithubGrid] = useState<Grid | null>(null);
  const [totalContributions, setTotalContributions] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [urlLoaded, setUrlLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const textGrid = useMemo(
    () => textToContributionGrid(text, { columns, rows: 7, characterSpacing: 1 }),
    [text, columns]
  );

  const previewGrid = mode === "github" && githubGrid ? githubGrid : textGrid;
  const background = darkMode ? "#020617" : "#f8fafc";
  const isTextValid = text.trim().length > 0;

  const applyDesign = (design: ReturnType<typeof deserializeDesign>) => {
    setText(design.text.slice(0, 80));
    setColumns(Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, design.cols)));
    setCellSize(Math.min(MAX_CELL, Math.max(MIN_CELL, design.cellSize)));
    setPalette([
      design.theme.level1,
      design.theme.level2,
      design.theme.level3,
      design.theme.level4,
      design.theme.level5
    ]);
    setDarkMode(design.theme.background.toLowerCase() === "#020617");
    setError(null);
  };

  const fetchContributions = async (overrideUsername?: string) => {
    const normalized = (overrideUsername ?? username).trim();
    if (!normalized) {
      setError("Please enter a GitHub username.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contributions?username=${encodeURIComponent(normalized)}`);
      const payload = (await response.json()) as ContributionApiResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to fetch contribution data.");
      }

      const grid = contributionWeeksToGrid(payload.weeks);
      setGithubGrid(grid);
      setTotalContributions(payload.totalContributions);
      setMode("github");
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unexpected fetch error.";
      setError(message);
      setGithubGrid(null);
      setTotalContributions(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY);
    if (storedTheme === "dark") {
      setDarkMode(true);
    }

    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get("mode");
    const textParam = params.get("text");
    const usernameParam = params.get("username");
    const columnsParam = Number(params.get("columns"));
    const cellSizeParam = Number(params.get("cellSize"));
    const paletteParam = paletteFromUrlParam(params.get("palette"));
    const darkParam = params.get("dark");
    const animParam = params.get("anim");

    if (modeParam === "text" || modeParam === "github") setMode(modeParam);
    if (textParam) setText(textParam.slice(0, 80));
    if (usernameParam) setUsername(usernameParam);
    if (!Number.isNaN(columnsParam)) setColumns(Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, columnsParam)));
    if (!Number.isNaN(cellSizeParam)) setCellSize(Math.min(MAX_CELL, Math.max(MIN_CELL, cellSizeParam)));
    if (paletteParam) setPalette(paletteParam);
    if (darkParam === "1") setDarkMode(true);
    if (animParam === "1") setAnimationMode(true);

    const lastDesignJson = window.localStorage.getItem(LAST_DESIGN_KEY);
    if (lastDesignJson) {
      try {
        const design = deserializeDesign(lastDesignJson);
        applyDesign(design);
        setStatusMessage("Restored last design from localStorage.");
      } catch {
        window.localStorage.removeItem(LAST_DESIGN_KEY);
      }
    }

    setUrlLoaded(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (animationMode) {
      setAnimationSeed((current) => current + 1);
    }
  }, [animationMode, previewGrid]);

  useEffect(() => {
    if (!urlLoaded) return;

    const params = new URLSearchParams();
    params.set("mode", mode);
    params.set("text", text);
    params.set("username", username);
    params.set("columns", String(columns));
    params.set("cellSize", String(cellSize));
    params.set("palette", palette.map((color) => color.replace("#", "")).join(","));
    params.set("dark", darkMode ? "1" : "0");
    params.set("anim", animationMode ? "1" : "0");

    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);

    const serialized = serializeDesign({
      text,
      grid: previewGrid,
      cellSize,
      palette,
      background
    });
    window.localStorage.setItem(LAST_DESIGN_KEY, serialized);
  }, [urlLoaded, mode, text, username, columns, cellSize, palette, darkMode, animationMode, previewGrid, background]);

  useEffect(() => {
    if (urlLoaded && mode === "github" && !githubGrid && username.trim()) {
      void fetchContributions(username);
    }
  }, [urlLoaded]);

  const setPaletteLevel = (index: number, color: string) => {
    setPalette((current) => {
      const updated = [...current] as IntensityPalette;
      updated[index] = color;
      return updated;
    });
  };

  const applyEndpointGradient = () => {
    setPalette(buildPaletteFromEndpoints(palette[0], palette[4]));
  };

  const saveDesignJson = () => {
    const content = serializeDesign({ text, grid: previewGrid, cellSize, palette, background });
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "poster-design.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage("Design JSON downloaded.");
  };

  const copyDesignJson = async () => {
    try {
      const content = serializeDesign({ text, grid: previewGrid, cellSize, palette, background });
      await navigator.clipboard.writeText(content);
      setStatusMessage("Design JSON copied to clipboard.");
    } catch {
      setError("Failed to copy JSON. Please use Save JSON instead.");
    }
  };

  const loadFromJsonText = (rawJson: string) => {
    try {
      const design = deserializeDesign(rawJson);
      applyDesign(design);
      setStatusMessage("Design imported successfully.");
      setError(null);
    } catch (importError) {
      const message = importError instanceof Error ? importError.message : "Invalid design JSON.";
      setError(`Import failed: ${message}`);
      setStatusMessage(null);
    }
  };

  const importDesignFromFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      loadFromJsonText(String(reader.result));
      event.target.value = "";
    };
    reader.readAsText(file);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatusMessage("Share link copied.");
    } catch {
      setError("Failed to copy link. Please copy it from your browser address bar.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">GitHub Contribution Style Poster Maker</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Use custom text or real GitHub contribution data, then export as PNG.
            </p>
          </div>
          <ThemeToggle darkMode={darkMode} onToggle={() => setDarkMode((value) => !value)} />
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px,1fr]">
          <aside className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                className={`rounded px-3 py-2 text-sm font-medium ${
                  mode === "text" ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100" : ""
                }`}
                onClick={() => setMode("text")}
              >
                Text Mode
              </button>
              <button
                type="button"
                className={`rounded px-3 py-2 text-sm font-medium ${
                  mode === "github" ? "bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100" : ""
                }`}
                onClick={() => setMode("github")}
              >
                GitHub Mode
              </button>
            </div>

            <label className="block text-sm font-medium">
              GitHub Username
              <div className="mt-1 flex gap-2">
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                  placeholder="octocat"
                />
                <button
                  type="button"
                  onClick={() => void fetchContributions()}
                  disabled={isLoading}
                  className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                >
                  {isLoading ? "Loading..." : "Fetch"}
                </button>
              </div>
            </label>

            {error && <p className="text-xs text-rose-500">{error}</p>}
            {statusMessage && <p className="text-xs text-emerald-600 dark:text-emerald-300">{statusMessage}</p>}
            {totalContributions !== null && !error && (
              <p className="text-xs text-slate-600 dark:text-slate-300">Total contributions: {totalContributions}</p>
            )}

            <label className="block text-sm font-medium">
              Poster Text
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                placeholder="Enter text (A-Z, 0-9)"
                maxLength={80}
              />
            </label>

            <label className="block text-sm font-medium">
              Grid Width (weeks): {columns}
              <input
                type="range"
                min={MIN_COLUMNS}
                max={MAX_COLUMNS}
                value={columns}
                onChange={(event) => setColumns(Number(event.target.value))}
                className="mt-2 w-full"
                disabled={mode === "github"}
              />
            </label>

            <label className="block text-sm font-medium">
              Cell Size: {cellSize}px
              <input
                type="range"
                min={MIN_CELL}
                max={MAX_CELL}
                value={cellSize}
                onChange={(event) => setCellSize(Number(event.target.value))}
                className="mt-2 w-full"
              />
            </label>

            <label className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm font-medium dark:border-slate-700">
              Animation Mode
              <input
                type="checkbox"
                checked={animationMode}
                onChange={(event) => setAnimationMode(event.target.checked)}
                className="h-4 w-4"
              />
            </label>

            <div className="grid grid-cols-4 gap-2">
              <button type="button" onClick={saveDesignJson} className="rounded-md bg-indigo-600 px-2 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
                Save JSON
              </button>
              <button type="button" onClick={() => void copyDesignJson()} className="rounded-md bg-violet-600 px-2 py-2 text-xs font-semibold text-white hover:bg-violet-500">
                Copy JSON
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-md bg-slate-700 px-2 py-2 text-xs font-semibold text-white hover:bg-slate-600">
                Import JSON
              </button>
              <button type="button" onClick={() => void copyShareLink()} className="rounded-md bg-blue-600 px-2 py-2 text-xs font-semibold text-white hover:bg-blue-500">
                Copy Share Link
              </button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={importDesignFromFile} />
            </div>

            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <p className="mb-2 text-sm font-semibold">Import JSON via Paste</p>
              <textarea
                value={jsonInput}
                onChange={(event) => setJsonInput(event.target.value)}
                className="h-24 w-full rounded-md border border-slate-300 px-2 py-2 text-xs dark:border-slate-600 dark:bg-slate-800"
                placeholder='Paste design JSON here...'
              />
              <button
                type="button"
                onClick={() => loadFromJsonText(jsonInput)}
                className="mt-2 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
              >
                Load Pasted JSON
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Gradient Intensity Colors (0-4)</p>
                <button
                  type="button"
                  onClick={applyEndpointGradient}
                  className="rounded bg-slate-200 px-2 py-1 text-xs dark:bg-slate-700"
                >
                  Auto Interpolate
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {palette.map((color, index) => (
                  <label key={index} className="flex flex-col items-center text-xs">
                    L{index}
                    <input
                      type="color"
                      value={color}
                      onChange={(event) => setPaletteLevel(index, event.target.value)}
                      className="mt-1 h-10 w-full cursor-pointer rounded"
                      aria-label={`Intensity level ${index} color`}
                    />
                  </label>
                ))}
              </div>

              <div className="mt-3">
                <p className="mb-1 text-xs text-slate-600 dark:text-slate-300">Intensity mapping preview</p>
                <div className="flex gap-2">
                  {palette.map((color, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="h-6 w-6 rounded" style={{ backgroundColor: color }} />
                      <span className="text-[10px]">{index}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                onClick={() =>
                  exportGridToPng(previewGrid, {
                    cellSize,
                    gap: Math.max(1, Math.round(cellSize * 0.25)),
                    palette,
                    backgroundColor: background
                  })
                }
                disabled={mode === "text" ? !isTextValid : !githubGrid}
              >
                Export PNG
              </button>
              <button
                type="button"
                className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                onClick={() =>
                  exportGridToSvg(previewGrid, {
                    cellSize,
                    gap: Math.max(1, Math.round(cellSize * 0.25)),
                    palette,
                    backgroundColor: background
                  })
                }
                disabled={mode === "text" ? !isTextValid : !githubGrid}
              >
                Export SVG
              </button>
            </div>

            {mode === "text" && !isTextValid && (
              <p className="text-xs text-rose-500">Please enter at least one character to export.</p>
            )}
            {mode === "github" && !githubGrid && !isLoading && (
              <p className="text-xs text-amber-600 dark:text-amber-300">Fetch a user to export real contribution data.</p>
            )}
          </aside>

          <section>
            <ContributionGrid
              grid={previewGrid}
              palette={palette}
              cellSize={cellSize}
              animate={animationMode}
              animationSeed={animationSeed}
            />
          </section>
        </section>
      </div>
    </main>
  );
}
