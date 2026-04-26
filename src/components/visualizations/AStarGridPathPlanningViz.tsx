"use client";

import { useEffect, useMemo, useState } from "react";
import { VizErrorBoundary } from "./VizErrorBoundary";

type Cell = [number, number];
type Preset = {
  name: string;
  grid: number[][];
  start: Cell;
  goal: Cell;
};

const presets: Preset[] = [
  {
    name: "Corridor",
    grid: [
      [0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 1, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [4, 5],
  },
  {
    name: "Maze",
    grid: [
      [0, 0, 1, 0, 0, 0],
      [1, 0, 1, 0, 1, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 0],
    ],
    start: [0, 0],
    goal: [4, 5],
  },
  {
    name: "Blocked",
    grid: [
      [0, 1, 0, 0, 0, 0],
      [0, 1, 0, 1, 1, 0],
      [0, 1, 0, 1, 0, 0],
      [0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 0],
    ],
    start: [0, 0],
    goal: [4, 5],
  },
];

function keyOf(cell: Cell) {
  return `${cell[0]}-${cell[1]}`;
}

function solveAStar({ grid, start, goal }: Preset) {
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
        const prev = cameFrom.get(walkKey);
        if (!prev) break;
        path.push(prev);
        walkKey = keyOf(prev);
      }
      path.reverse();
      return { visitedOrder, path };
    }

    for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const nr = current.cell[0] + dr;
      const nc = current.cell[1] + dc;

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc] === 1) continue;

      const neighbor: Cell = [nr, nc];
      const neighborKey = keyOf(neighbor);
      const tentativeG = current.g + 1;

      if (tentativeG < (gScore.get(neighborKey) ?? Number.POSITIVE_INFINITY)) {
        gScore.set(neighborKey, tentativeG);
        cameFrom.set(neighborKey, current.cell);
        const h = Math.abs(nr - goal[0]) + Math.abs(nc - goal[1]);
        open.push({ cell: neighbor, g: tentativeG, f: tentativeG + h });
      }
    }
  }

  return { visitedOrder, path: [] as Cell[] };
}

export default function AStarGridPathPlanningViz() {
  const [presetIndex, setPresetIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [runToken, setRunToken] = useState(0);
  const preset = presets[presetIndex];

  const { visitedOrder, path } = useMemo(() => solveAStar(preset), [preset]);
  const maxStep = visitedOrder.length + path.length;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStep((current) => {
        if (current >= maxStep) {
          window.clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [maxStep, runToken]);

  const visitedSet = new Set(visitedOrder.slice(0, Math.min(step, visitedOrder.length)).map(keyOf));
  const pathCount = Math.max(0, step - visitedOrder.length);
  const pathSet = new Set(path.slice(0, pathCount).map(keyOf));

  return (
    <VizErrorBoundary>
      <div>
        <div className="space-y-3 bg-bg-primary p-4">
          <div className="flex flex-wrap gap-2">
            {presets.map((item, index) => (
              <button
                key={item.name}
                onClick={() => {
                  setPresetIndex(index);
                  setStep(0);
                  setRunToken((current) => current + 1);
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  presetIndex === index
                    ? "bg-accent-green text-bg-primary"
                    : "bg-bg-tertiary text-text-secondary hover:bg-bg-hover"
                }`}
              >
                {item.name}
              </button>
            ))}
            <button
              onClick={() => {
                setStep(0);
                setRunToken((current) => current + 1);
              }}
              className="rounded-full border border-border-default px-3 py-1 text-xs font-medium text-text-secondary transition hover:bg-bg-hover"
            >
              Restart animation
            </button>
          </div>

          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${preset.grid[0].length}, minmax(0, 1fr))` }}
          >
            {preset.grid.flatMap((row, r) =>
              row.map((cell, c) => {
                const key = keyOf([r, c]);
                const isStart = r === preset.start[0] && c === preset.start[1];
                const isGoal = r === preset.goal[0] && c === preset.goal[1];

                let className = "border-border-default bg-bg-secondary";
                if (cell === 1) className = "border-border-default bg-slate-800";
                if (visitedSet.has(key)) className = "border-emerald-700 bg-emerald-950";
                if (pathSet.has(key)) className = "border-amber-500 bg-amber-500/20";
                if (isStart) className = "border-cyan-400 bg-cyan-500/20";
                if (isGoal) className = "border-rose-400 bg-rose-500/20";

                return (
                  <div
                    key={key}
                    className={`flex aspect-square items-center justify-center rounded-md border text-[11px] font-semibold ${className}`}
                  >
                    {isStart ? "S" : isGoal ? "G" : ""}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-border-default bg-bg-secondary p-4 text-xs text-text-secondary">
          <div>
            Expanded
            <div className="font-mono text-accent-green">{visitedSet.size}</div>
          </div>
          <div>
            Path length
            <div className="font-mono text-accent-green">{path.length || 0}</div>
          </div>
          <div>
            Status
            <div className="font-mono text-accent-green">{path.length > 0 ? "Path found" : "No path"}</div>
          </div>
        </div>
      </div>
    </VizErrorBoundary>
  );
}
