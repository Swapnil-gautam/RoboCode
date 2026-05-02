"use client";

import { useEffect, useState } from "react";
import { VizErrorBoundary } from "./VizErrorBoundary";

type StateName = "IDLE" | "NAVIGATING" | "AVOIDING_OBSTACLE" | "DOCKING" | "CHARGING";

const NW = 96, NH = 40;
const HW = NW / 2, HH = NH / 2;

const nodePos: Record<StateName, { x: number; y: number }> = {
  IDLE:              { x:  76, y: 152 },
  NAVIGATING:        { x: 244, y:  82 },
  AVOIDING_OBSTACLE: { x: 442, y:  82 },
  DOCKING:           { x: 244, y: 222 },
  CHARGING:          { x: 442, y: 222 },
};

const nodeLabels: Record<StateName, string[]> = {
  IDLE:              ["IDLE"],
  NAVIGATING:        ["NAVIGATING"],
  AVOIDING_OBSTACLE: ["AVOIDING", "OBSTACLE"],
  DOCKING:           ["DOCKING"],
  CHARGING:          ["CHARGING"],
};

const transitions: Record<StateName, Partial<Record<string, StateName>>> = {
  IDLE:              { start_mission: "NAVIGATING" },
  NAVIGATING:        { obstacle_detected: "AVOIDING_OBSTACLE", battery_low: "DOCKING" },
  AVOIDING_OBSTACLE: { path_cleared: "NAVIGATING", battery_low: "DOCKING" },
  DOCKING:           { dock_reached: "CHARGING" },
  CHARGING:          { charged: "IDLE" },
};

type EdgeDef = { from: StateName; to: StateName; event: string; bend?: number };

const edgeDefs: EdgeDef[] = [
  { from: "IDLE",              to: "NAVIGATING",        event: "start_mission" },
  { from: "NAVIGATING",        to: "AVOIDING_OBSTACLE", event: "obstacle_detected", bend: -28 },
  { from: "AVOIDING_OBSTACLE", to: "NAVIGATING",        event: "path_cleared",      bend: -28 },
  { from: "NAVIGATING",        to: "DOCKING",           event: "battery_low" },
  { from: "AVOIDING_OBSTACLE", to: "DOCKING",           event: "battery_low" },
  { from: "DOCKING",           to: "CHARGING",          event: "dock_reached" },
  { from: "CHARGING",          to: "IDLE",              event: "charged" },
];


const demoSequence = [
  "start_mission",
  "obstacle_detected",
  "path_cleared",
  "battery_low",
  "dock_reached",
  "charged",
];

function nodeEdgePt(center: { x: number; y: number }, toward: { x: number; y: number }) {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  if (!dx && !dy) return center;
  const t = Math.min(Math.abs(HW / dx), Math.abs(HH / dy));
  return { x: center.x + dx * t, y: center.y + dy * t };
}

type EdgePath = { d: string; lx: number; ly: number; labelAbove: boolean };

function buildEdge(e: EdgeDef): EdgePath {
  const a = nodePos[e.from];
  const b = nodePos[e.to];

  if (!e.bend) {
    const s = nodeEdgePt(a, b);
    const en = nodeEdgePt(b, a);
    const dx = en.x - s.x, dy = en.y - s.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ex = en.x - (dx / len) * 9;
    const ey = en.y - (dy / len) * 9;
    // Perpendicular offset for label (pick the side with less obstruction)
    const px = -dy / len, py = dx / len;
    return {
      d: `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      lx: (s.x + ex) / 2 + px * 10,
      ly: (s.y + ey) / 2 + py * 10,
      labelAbove: false,
    };
  }

  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const cpx = mx - (dy / len) * e.bend;
  const cpy = my + (dx / len) * e.bend;

  const s = nodeEdgePt(a, { x: cpx, y: cpy });
  const en = nodeEdgePt(b, { x: cpx, y: cpy });
  const edx = en.x - cpx, edy = en.y - cpy;
  const elen = Math.sqrt(edx * edx + edy * edy);
  const ex = en.x - (edx / elen) * 9;
  const ey = en.y - (edy / elen) * 9;

  const avgY = (a.y + b.y) / 2;
  const above = cpy < avgY;
  return {
    d: `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
    lx: cpx,
    ly: cpy + (above ? -10 : 10),
    labelAbove: above,
  };
}

const builtEdges = edgeDefs.map(buildEdge);

export default function FiniteStateMachineViz() {
  const [current, setCurrent] = useState<StateName>("IDLE");
  const [lastEdge, setLastEdge] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ from: StateName; event: string; to: StateName }>>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const validEvents = new Set(Object.keys(transitions[current]));

  // Clear edge highlight after 700ms
  useEffect(() => {
    if (!lastEdge) return;
    const id = window.setTimeout(() => setLastEdge(null), 700);
    return () => window.clearTimeout(id);
  }, [lastEdge]);

  // Demo auto-play — current is a dep so the closure always reads the live state
  useEffect(() => {
    if (!isDemo) return;
    if (demoStep >= demoSequence.length) {
      setIsDemo(false);
      setDemoStep(0);
      return;
    }
    const event = demoSequence[demoStep];
    const id = window.setTimeout(() => {
      const next = transitions[current][event];
      if (next) {
        setLastEdge(`${current}--${event}--${next}`);
        setHistory((h) => [{ from: current, event, to: next }, ...h].slice(0, 7));
        setCurrent(next);
      }
      setDemoStep((s) => s + 1);
    }, 950);
    return () => window.clearTimeout(id);
  }, [isDemo, demoStep, current]);

  function reset() {
    setCurrent("IDLE");
    setHistory([]);
    setLastEdge(null);
    setIsDemo(false);
    setDemoStep(0);
  }

  return (
    <VizErrorBoundary>
      <div>
        <div className="bg-bg-primary p-3">
          <svg viewBox="0 0 540 305" className="h-[290px] w-full">
            <defs>
              <marker id="fsm-arr" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <path d="M 0 1 L 8 4.5 L 0 8 z" fill="#4b5563" />
              </marker>
              <marker id="fsm-arr-hot" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <path d="M 0 1 L 8 4.5 L 0 8 z" fill="#22c55e" />
              </marker>
              <marker id="fsm-arr-dim" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <path d="M 0 1 L 8 4.5 L 0 8 z" fill="#374151" />
              </marker>
            </defs>

            {/* Edges */}
            {edgeDefs.map((e, i) => {
              const { d, lx, ly } = builtEdges[i];
              const edgeKey = `${e.from}--${e.event}--${e.to}`;
              const isHot = lastEdge === edgeKey;
              const isReachable = e.from === current && validEvents.has(e.event);

              const stroke = isHot ? "#22c55e" : isReachable ? "#4ade80" : "#1f2937";
              const sw = isHot ? 2.5 : isReachable ? 1.5 : 1.5;
              const marker = isHot ? "url(#fsm-arr-hot)" : isReachable ? "url(#fsm-arr)" : "url(#fsm-arr-dim)";
              const labelColor = isHot ? "#86efac" : isReachable ? "#6ee7b7" : "#374151";

              const words = e.event.split("_");

              return (
                <g key={edgeKey}>
                  <path
                    d={d}
                    stroke={stroke}
                    strokeWidth={sw}
                    fill="none"
                    markerEnd={marker}
                  />
                  {/* Label background */}
                  <rect
                    x={lx - 22}
                    y={ly - (words.length > 1 ? 16 : 8)}
                    width={44}
                    height={words.length > 1 ? 20 : 12}
                    rx="2"
                    fill="#0a0f0d"
                    opacity="0.85"
                  />
                  {words.map((word, wi) => (
                    <text
                      key={wi}
                      x={lx}
                      y={ly - (words.length - 1) * 5 + wi * 10}
                      fill={labelColor}
                      textAnchor="middle"
                      fontSize="7.5"
                      fontFamily="monospace"
                    >
                      {word}
                    </text>
                  ))}
                </g>
              );
            })}

            {/* Nodes */}
            {(Object.keys(nodePos) as StateName[]).map((state) => {
              const { x, y } = nodePos[state];
              const active = current === state;
              const lines = nodeLabels[state];

              return (
                <g key={state}>
                  {/* Glow ring */}
                  {active && (
                    <rect
                      x={x - HW - 4}
                      y={y - HH - 4}
                      width={NW + 8}
                      height={NH + 8}
                      rx="11"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                      opacity="0.25"
                    />
                  )}
                  <rect
                    x={x - HW}
                    y={y - HH}
                    width={NW}
                    height={NH}
                    rx="8"
                    fill={active ? "#052e16" : "#0f172a"}
                    stroke={active ? "#22c55e" : "#1e293b"}
                    strokeWidth={active ? 2 : 1.5}
                  />
                  {lines.map((line, li) => (
                    <text
                      key={li}
                      x={x}
                      y={y + li * 12 - (lines.length - 1) * 6 + 4}
                      fill={active ? "#86efac" : "#64748b"}
                      textAnchor="middle"
                      fontSize={lines.length > 1 ? "8.5" : "9"}
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-3 border-t border-border-default bg-bg-secondary p-4">
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrent("IDLE");
                setHistory([]);
                setLastEdge(null);
                setDemoStep(0);
                setIsDemo(true);
              }}
              disabled={isDemo}
              className="rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-bg-hover disabled:opacity-50"
            >
              {isDemo ? `Running… (${demoStep}/${demoSequence.length})` : "▶ Demo cycle"}
            </button>
            <button
              onClick={reset}
              className="rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-bg-hover"
            >
              Reset
            </button>
            <div className="ml-auto text-xs text-text-secondary">
              State:{" "}
              <span className="font-mono text-accent-green">{current}</span>
            </div>
          </div>

          {/* Transition log */}
          <div className="rounded-lg border border-border-default bg-bg-primary/60 p-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Transition log
            </div>
            {history.length === 0 ? (
              <div className="text-xs text-text-muted">Fire an event to see transitions.</div>
            ) : (
              <div className="space-y-1">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className={`flex flex-wrap items-center gap-1 font-mono text-[11px] ${i === 0 ? "" : "opacity-50"}`}
                  >
                    <span className="text-cyan-400">{h.from}</span>
                    <span className="text-text-muted">─</span>
                    <span className={i === 0 ? "text-amber-400" : "text-text-muted"}>{h.event}</span>
                    <span className="text-text-muted">→</span>
                    <span className={i === 0 ? "text-accent-green" : "text-text-muted"}>{h.to}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </VizErrorBoundary>
  );
}
