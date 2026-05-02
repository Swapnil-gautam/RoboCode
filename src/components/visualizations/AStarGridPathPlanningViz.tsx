"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VizErrorBoundary } from "./VizErrorBoundary";

type Cell = [number, number];
type EditTool = "wall" | "erase" | "start" | "goal";

type GridConfig = {
  grid: number[][];
  start: Cell;
  goal: Cell;
};

type Preset = GridConfig & { name: string };

const ROWS = 10;
const COLS = 12;

function emptyGrid(): number[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

const presets: Preset[] = [
  {
    name: "Corridor",
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0],
      [0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0],
      [1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [9, 11],
  },
  {
    name: "Maze",
    grid: [
      [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      [0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0],
      [1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1],
      [0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [9, 11],
  },
  {
    name: "Scattered",
    grid: [
      [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
      [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [9, 11],
  },
];

function keyOf([r, c]: Cell) {
  return `${r}-${c}`;
}

function solveAStar({ grid, start, goal }: GridConfig): { visitedOrder: Cell[]; path: Cell[] } {
  const rows = grid.length;
  const cols = grid[0].length;

  const open: Array<{ cell: Cell; f: number; g: number }> = [
    { cell: start, f: Math.abs(start[0] - goal[0]) + Math.abs(start[1] - goal[1]), g: 0 },
  ];
  const cameFrom = new Map<string, Cell>();
  const gScore = new Map<string, number>([[keyOf(start), 0]]);
  const visitedOrder: Cell[] = [];
  const seen = new Set<string>();

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f || a.g - b.g);
    const current = open.shift();
    if (!current) break;

    const currentKey = keyOf(current.cell);
    if (seen.has(currentKey)) continue;
    seen.add(currentKey);
    visitedOrder.push(current.cell);

    if (current.cell[0] === goal[0] && current.cell[1] === goal[1]) {
      const path: Cell[] = [current.cell];
      let walkKey = currentKey;
      while (cameFrom.has(walkKey)) {
        const prev = cameFrom.get(walkKey)!;
        path.push(prev);
        walkKey = keyOf(prev);
      }
      path.reverse();
      return { visitedOrder, path };
    }

    for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const nr = current.cell[0] + dr;
      const nc = current.cell[1] + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || grid[nr][nc] === 1) continue;

      const neighbor: Cell = [nr, nc];
      const neighborKey = keyOf(neighbor);
      const tentativeG = current.g + 1;

      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        gScore.set(neighborKey, tentativeG);
        cameFrom.set(neighborKey, current.cell);
        const h = Math.abs(nr - goal[0]) + Math.abs(nc - goal[1]);
        open.push({ cell: neighbor, g: tentativeG, f: tentativeG + h });
      }
    }
  }

  return { visitedOrder, path: [] };
}

const TOOLS: { t: EditTool; label: string }[] = [
  { t: "wall", label: "Wall" },
  { t: "erase", label: "Erase" },
  { t: "start", label: "Start" },
  { t: "goal", label: "Goal" },
];

const LEGEND = [
  { cls: "bg-bg-secondary border-border-default", label: "Open" },
  { cls: "bg-slate-800 border-slate-600", label: "Wall" },
  { cls: "bg-emerald-950 border-emerald-700", label: "Explored" },
  { cls: "bg-amber-500/20 border-amber-500", label: "Path" },
  { cls: "bg-cyan-500/20 border-cyan-400", label: "Start" },
  { cls: "bg-rose-500/20 border-rose-400", label: "Goal" },
];

export default function AStarGridPathPlanningViz() {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [presetIndex, setPresetIndex] = useState(0);
  const [customGrid, setCustomGrid] = useState<number[][]>(emptyGrid);
  const [customStart, setCustomStart] = useState<Cell>([0, 0]);
  const [customGoal, setCustomGoal] = useState<Cell>([ROWS - 1, COLS - 1]);
  const [editTool, setEditTool] = useState<EditTool>("wall");
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const isMouseDown = useRef(false);

  const config = useMemo<GridConfig>(
    () =>
      mode === "preset"
        ? presets[presetIndex]
        : { grid: customGrid, start: customStart, goal: customGoal },
    [mode, presetIndex, customGrid, customStart, customGoal],
  );

  const { visitedOrder, path } = useMemo(() => solveAStar(config), [config]);
  const maxStep = visitedOrder.length + path.length;

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setStep((s) => {
        if (s >= maxStep) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 80);
    return () => window.clearInterval(id);
  }, [isPlaying, maxStep]);

  useEffect(() => {
    const onUp = () => {
      isMouseDown.current = false;
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);

  function reset() {
    setStep(0);
    setIsPlaying(false);
  }

  function applyTool(r: number, c: number) {
    if (mode !== "custom") return;
    setStep(0);
    setIsPlaying(false);

    if (editTool === "start") {
      setCustomStart([r, c]);
      if (customGrid[r][c] === 1)
        setCustomGrid((g) => {
          const n = g.map((row) => [...row]);
          n[r][c] = 0;
          return n;
        });
    } else if (editTool === "goal") {
      setCustomGoal([r, c]);
      if (customGrid[r][c] === 1)
        setCustomGrid((g) => {
          const n = g.map((row) => [...row]);
          n[r][c] = 0;
          return n;
        });
    } else {
      const isS = r === customStart[0] && c === customStart[1];
      const isG = r === customGoal[0] && c === customGoal[1];
      if (!isS && !isG)
        setCustomGrid((g) => {
          const n = g.map((row) => [...row]);
          n[r][c] = editTool === "wall" ? 1 : 0;
          return n;
        });
    }
  }

  const visitedSet = new Set(
    visitedOrder.slice(0, Math.min(step, visitedOrder.length)).map(keyOf),
  );
  const pathCount = Math.max(0, step - visitedOrder.length);
  const pathSet = new Set(path.slice(0, pathCount).map(keyOf));

  return (
    <VizErrorBoundary>
      <div>
        <div className="space-y-3 bg-bg-primary p-4">
          {/* Mode tabs */}
          <div className="flex gap-1 rounded-lg bg-bg-tertiary p-1">
            {(["preset", "custom"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  reset();
                }}
                className={`flex-1 rounded-md py-1 text-xs font-medium transition ${
                  mode === m
                    ? "bg-bg-primary text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {m === "preset" ? "Presets" : "Custom"}
              </button>
            ))}
          </div>

          {/* Preset picker */}
          {mode === "preset" && (
            <div className="flex flex-wrap gap-2">
              {presets.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setPresetIndex(i);
                    reset();
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    presetIndex === i
                      ? "bg-accent-green text-bg-primary"
                      : "bg-bg-tertiary text-text-secondary hover:bg-bg-hover"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Custom toolbar */}
          {mode === "custom" && (
            <div className="flex flex-wrap items-center gap-1.5">
              {TOOLS.map(({ t, label }) => (
                <button
                  key={t}
                  onClick={() => setEditTool(t)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    editTool === t
                      ? "border-accent-green bg-accent-green/10 text-accent-green"
                      : "border-border-default text-text-secondary hover:bg-bg-hover"
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => {
                  setCustomGrid(emptyGrid());
                  reset();
                }}
                className="ml-auto rounded-full border border-border-default px-3 py-1 text-xs text-text-muted transition hover:bg-bg-hover"
              >
                Clear
              </button>
            </div>
          )}

          {/* Grid */}
          <div
            className="grid select-none gap-0.5"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          >
            {config.grid.flatMap((row, r) =>
              row.map((cell, c) => {
                const key = keyOf([r, c]);
                const isStart = r === config.start[0] && c === config.start[1];
                const isGoal = r === config.goal[0] && c === config.goal[1];

                let cls = "border-border-default bg-bg-secondary";
                if (cell === 1) cls = "border-slate-600 bg-slate-800";
                if (visitedSet.has(key)) cls = "border-emerald-700 bg-emerald-950";
                if (pathSet.has(key)) cls = "border-amber-500 bg-amber-500/20";
                if (isStart) cls = "border-cyan-400 bg-cyan-500/20";
                if (isGoal) cls = "border-rose-400 bg-rose-500/20";

                return (
                  <div
                    key={key}
                    className={`flex aspect-square items-center justify-center rounded-sm border text-[7px] font-bold ${cls}${mode === "custom" ? " cursor-pointer" : ""}`}
                    onMouseDown={() => {
                      isMouseDown.current = true;
                      applyTool(r, c);
                    }}
                    onMouseEnter={() => {
                      if (isMouseDown.current) applyTool(r, c);
                    }}
                  >
                    {isStart ? "S" : isGoal ? "G" : ""}
                  </div>
                );
              }),
            )}
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-md border border-border-default px-3 py-1.5 text-xs text-text-secondary transition hover:bg-bg-hover disabled:opacity-30"
            >
              ‹ Prev
            </button>
            <button
              onClick={() => {
                if (isPlaying) {
                  setIsPlaying(false);
                } else {
                  if (step >= maxStep) setStep(0);
                  setIsPlaying(true);
                }
              }}
              className="flex-1 rounded-md border border-border-default px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:bg-bg-hover"
            >
              {isPlaying ? "⏸ Pause" : step >= maxStep ? "↺ Replay" : "▶ Play"}
            </button>
            <button
              onClick={() => setStep((s) => Math.min(maxStep, s + 1))}
              disabled={step >= maxStep}
              className="rounded-md border border-border-default px-3 py-1.5 text-xs text-text-secondary transition hover:bg-bg-hover disabled:opacity-30"
            >
              Next ›
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 overflow-hidden rounded-full bg-bg-tertiary">
            <div
              className="h-full rounded-full bg-accent-green transition-all duration-75"
              style={{ width: maxStep > 0 ? `${(step / maxStep) * 100}%` : "0%" }}
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-text-muted">
            {LEGEND.map(({ cls, label }) => (
              <span key={label} className="flex items-center gap-1">
                <span className={`inline-block h-2 w-2 rounded-sm border ${cls}`} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 border-t border-border-default bg-bg-secondary p-4 text-xs text-text-secondary">
          <div>
            Explored
            <div className="font-mono text-accent-green">{visitedSet.size} cells</div>
          </div>
          <div>
            Path length
            <div className="font-mono text-accent-green">
              {pathCount > 0 ? `${path.length} steps` : "—"}
            </div>
          </div>
          <div>
            Status
            <div className="font-mono text-accent-green">
              {step === 0
                ? "Ready"
                : step >= maxStep
                  ? path.length > 0
                    ? "Found ✓"
                    : "No path"
                  : "Searching…"}
            </div>
          </div>
        </div>
      </div>
    </VizErrorBoundary>
  );
}
