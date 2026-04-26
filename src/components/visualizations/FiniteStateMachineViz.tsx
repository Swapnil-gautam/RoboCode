"use client";

import { useState } from "react";
import { VizErrorBoundary } from "./VizErrorBoundary";

type StateName =
  | "IDLE"
  | "NAVIGATING"
  | "AVOIDING_OBSTACLE"
  | "DOCKING"
  | "CHARGING";

const transitions: Record<StateName, Partial<Record<string, StateName>>> = {
  IDLE: {
    start_mission: "NAVIGATING",
  },
  NAVIGATING: {
    obstacle_detected: "AVOIDING_OBSTACLE",
    battery_low: "DOCKING",
  },
  AVOIDING_OBSTACLE: {
    path_cleared: "NAVIGATING",
    battery_low: "DOCKING",
  },
  DOCKING: {
    dock_reached: "CHARGING",
  },
  CHARGING: {
    charged: "IDLE",
  },
};

const positions: Record<StateName, { x: number; y: number }> = {
  IDLE: { x: 90, y: 120 },
  NAVIGATING: { x: 220, y: 70 },
  AVOIDING_OBSTACLE: { x: 380, y: 70 },
  DOCKING: { x: 220, y: 190 },
  CHARGING: { x: 380, y: 190 },
};

const events = [
  "start_mission",
  "obstacle_detected",
  "path_cleared",
  "battery_low",
  "dock_reached",
  "charged",
];

export default function FiniteStateMachineViz() {
  const [currentState, setCurrentState] = useState<StateName>("IDLE");
  const [history, setHistory] = useState<string[]>([]);

  function handleEvent(event: string) {
    const next = transitions[currentState][event] ?? currentState;
    setCurrentState(next);
    setHistory((prev) => [`${currentState} --${event}--> ${next}`, ...prev].slice(0, 5));
  }

  function reset() {
    setCurrentState("IDLE");
    setHistory([]);
  }

  return (
    <VizErrorBoundary>
      <div>
        <div className="bg-bg-primary p-3">
          <svg viewBox="0 0 500 260" className="h-[240px] w-full">
            <rect width="500" height="260" fill="#0a0f0d" />

            {[
              ["IDLE", "NAVIGATING"],
              ["NAVIGATING", "AVOIDING_OBSTACLE"],
              ["NAVIGATING", "DOCKING"],
              ["AVOIDING_OBSTACLE", "NAVIGATING"],
              ["AVOIDING_OBSTACLE", "DOCKING"],
              ["DOCKING", "CHARGING"],
              ["CHARGING", "IDLE"],
            ].map(([from, to]) => {
              const a = positions[from as StateName];
              const b = positions[to as StateName];
              return (
                <line
                  key={`${from}-${to}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#32513d"
                  strokeWidth="2"
                  markerEnd="url(#arrow)"
                />
              );
            })}

            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M 0 0 L 8 4 L 0 8 z" fill="#32513d" />
              </marker>
            </defs>

            {(Object.keys(positions) as StateName[]).map((state) => {
              const pos = positions[state];
              const active = currentState === state;
              return (
                <g key={state}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="36"
                    fill={active ? "#14532d" : "#111827"}
                    stroke={active ? "#22c55e" : "#4b5563"}
                    strokeWidth="3"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    fill="#f8fafc"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                  >
                    {state}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-3 border-t border-border-default bg-bg-secondary p-4">
          <div className="flex flex-wrap gap-2">
            {events.map((event) => (
              <button
                key={event}
                onClick={() => handleEvent(event)}
                className="rounded-full bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-bg-hover hover:text-text-primary"
              >
                {event}
              </button>
            ))}
            <button
              onClick={reset}
              className="rounded-full border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-bg-hover"
            >
              Reset
            </button>
          </div>

          <div className="rounded-lg border border-border-default bg-bg-primary/60 p-3 text-xs text-text-secondary">
            Current state: <span className="font-mono text-accent-green">{currentState}</span>
          </div>

          <div className="rounded-lg border border-border-default bg-bg-primary/60 p-3 text-xs text-text-secondary">
            <div className="mb-2 font-semibold text-text-primary">Recent transitions</div>
            {history.length === 0 ? (
              <div className="text-text-muted">Trigger events to watch the FSM move.</div>
            ) : (
              <div className="space-y-1 font-mono text-[11px]">
                {history.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </VizErrorBoundary>
  );
}
