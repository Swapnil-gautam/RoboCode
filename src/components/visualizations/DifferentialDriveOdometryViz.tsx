"use client";

import { useState } from "react";
import { VizErrorBoundary } from "./VizErrorBoundary";

const W = 560, H = 290;
const CX = W / 2, CY = H / 2;   // robot is always here in SVG coords
const SCALE = 80;                 // px per world metre
const WHEELBASE = 0.6;

// Robot visual size (px) — independent of SCALE
const R_HL = 20, R_RH = 14, R_WW = 7, R_WH = 20;

const C = {
  bg:        "#07100d",
  grid:      "#0d1a14",
  axis:      "#1f4a30",
  robot:     "#22c55e",
  robotFill: "#14532d",
  wheel:     "#86efac",
  trail:     "#22c55e",
  preview:   "#f59e0b",   // amber — step preview & d arrow
  dTheta:    "#a855f7",   // purple — heading change arc
  ghost:     "#4ade80",   // lighter green — ghost robot
};

type Pose = { x: number; y: number; theta: number };

function updatePose(p: Pose, dL: number, dR: number): Pose {
  const d      = (dL + dR) / 2;
  const dTheta = (dR - dL) / WHEELBASE;
  const tMid   = p.theta + dTheta / 2;
  return { x: p.x + d * Math.cos(tMid), y: p.y + d * Math.sin(tMid), theta: p.theta + dTheta };
}

// World coords → SVG pixels; camera is locked to (camX, camY) in world
function toScreen(wx: number, wy: number, camX: number, camY: number) {
  return { x: CX + (wx - camX) * SCALE, y: CY - (wy - camY) * SCALE };
}

// Euler-integrated preview arc from `from` pose over step (d, dTheta)
function buildStepArc(from: Pose, d: number, dTheta: number, camX: number, camY: number): string {
  if (Math.abs(d) < 0.005) return "";
  const N = 24;
  const parts: string[] = [];
  let x = from.x, y = from.y, theta = from.theta;
  const ds = d / N, dt = dTheta / N;
  for (let i = 0; i <= N; i++) {
    const s = toScreen(x, y, camX, camY);
    parts.push(`${i === 0 ? "M" : "L"} ${s.x.toFixed(1)} ${s.y.toFixed(1)}`);
    const tMid = theta + dt / 2;
    x += ds * Math.cos(tMid);
    y += ds * Math.sin(tMid);
    theta += dt;
  }
  return parts.join(" ");
}

// Small arc at (cx,cy) visualising the Δθ rotation for this step
function headingArcPath(cx: number, cy: number, theta: number, dTheta: number, r: number): string {
  if (Math.abs(dTheta) < 0.02) return "";
  const sx = cx + r * Math.cos(theta),           sy = cy - r * Math.sin(theta);
  const ex = cx + r * Math.cos(theta + dTheta),  ey = cy - r * Math.sin(theta + dTheta);
  const large = Math.abs(dTheta) > Math.PI ? 1 : 0;
  // CCW in world (dTheta > 0) = CCW in screen (y-flipped) = sweep-flag 0
  const sweep = dTheta < 0 ? 1 : 0;
  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 ${large} ${sweep} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
}

function Arrow({ x1, y1, x2, y2, color, width = 2, head = 8, opacity = 1, dashed = false }: {
  x1: number; y1: number; x2: number; y2: number;
  color: string; width?: number; head?: number; opacity?: number; dashed?: boolean;
}) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy);
  if (len < 5) return null;
  const ux = dx / len, uy = dy / len, px = -uy, py = ux;
  const bx = x2 - head * ux, by = y2 - head * uy;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width}
        strokeDasharray={dashed ? "6 3" : undefined} strokeLinecap="round" />
      <polygon fill={color}
        points={`${x2},${y2} ${bx + head * .45 * px},${by + head * .45 * py} ${bx - head * .45 * px},${by - head * .45 * py}`} />
    </g>
  );
}

// Robot body centred at (0,0) in local coords, facing UP (-y)
function RobotShape({ stroke, fill, wFill, op = 1 }: {
  stroke: string; fill: string; wFill: string; op?: number;
}) {
  return (
    <g opacity={op}>
      <rect x={-R_HL - R_WW} y={-R_WH} width={R_WW} height={R_WH * 2} rx="2" fill={wFill} />
      <rect x={R_HL}          y={-R_WH} width={R_WW} height={R_WH * 2} rx="2" fill={wFill} />
      <rect x={-R_HL} y={-R_RH} width={R_HL * 2} height={R_RH * 2}
        rx="5" fill={fill} stroke={stroke} strokeWidth="1.5" />
      <polygon points={`0,${-R_RH - 5} -7,${-R_RH + 8} 7,${-R_RH + 8}`} fill={stroke} />
      <circle r="2.5" fill={stroke} />
    </g>
  );
}

const PRESETS = [
  { label: "Straight",    dL: 0.50, dR: 0.50 },
  { label: "Curve left",  dL: 0.30, dR: 0.60 },
  { label: "Curve right", dL: 0.60, dR: 0.30 },
  { label: "Spin",        dL: -0.3, dR: 0.30 },
];

export default function DifferentialDriveOdometryViz() {
  const [dL, setDL] = useState(0.8);
  const [dR, setDR] = useState(0.8);
  const [pose,  setPose]  = useState<Pose>({ x: 0, y: 0, theta: 0 });
  const [trail, setTrail] = useState<Pose[]>([{ x: 0, y: 0, theta: 0 }]);

  // Live step values — recompute on every slider change
  const d      = (dL + dR) / 2;
  const dTheta = (dR - dL) / WHEELBASE;
  const tMid   = pose.theta + dTheta / 2;
  const next   = updatePose(pose, dL, dR);

  // Camera locked to current robot pose → robot is always at (CX, CY)
  const toS = (wx: number, wy: number) => toScreen(wx, wy, pose.x, pose.y);

  const stepArc = buildStepArc(pose, d, dTheta, pose.x, pose.y);
  const hArc    = headingArcPath(CX, CY, pose.theta, dTheta, 34);

  function applyN(n: number) {
    let cur = pose;
    const newTrail = [...trail];
    for (let i = 0; i < n; i++) {
      cur = updatePose(cur, dL, dR);
      newTrail.push(cur);
    }
    setPose(cur);
    setTrail(newTrail);
  }

  function reset() {
    const start: Pose = { x: 0, y: 0, theta: 0 };
    setPose(start);
    setTrail([start]);
  }

  const nextS     = toS(next.x, next.y);
  const rotateDeg = (t: number) => 90 - t * (180 / Math.PI);

  // Infinite grid: which integer-metre grid lines are currently visible?
  const gMinX = Math.floor(pose.x - W / (2 * SCALE)) - 1;
  const gMaxX = Math.ceil(pose.x  + W / (2 * SCALE)) + 1;
  const gMinY = Math.floor(pose.y - H / (2 * SCALE)) - 1;
  const gMaxY = Math.ceil(pose.y  + H / (2 * SCALE)) + 1;

  const originS    = toS(0, 0);
  const showOrigin = originS.x > -20 && originS.x < W + 20 && originS.y > -20 && originS.y < H + 20;

  // Midpoint heading arrow: length proportional to |d|, capped for readability
  const arrowLen = Math.max(8, Math.min(Math.abs(d) * SCALE, 72));
  const mAx = CX + arrowLen * Math.cos(tMid);
  const mAy = CY - arrowLen * Math.sin(tMid);

  const showPreview = Math.abs(d) > 0.02 || Math.abs(dTheta) > 0.03;

  return (
    <VizErrorBoundary>
      <div className="select-none">
        <div style={{ background: C.bg }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "280px" }}>
            <rect width={W} height={H} fill={C.bg} />

            {/* Infinite scrolling grid — follows camera */}
            {Array.from({ length: gMaxX - gMinX + 1 }, (_, i) => gMinX + i).map(gx => {
              const sx = toS(gx, 0).x;
              return <line key={`gx${gx}`} x1={sx} y1={0} x2={sx} y2={H}
                stroke={gx === 0 ? C.axis : C.grid} strokeWidth={gx === 0 ? 1 : 0.7} />;
            })}
            {Array.from({ length: gMaxY - gMinY + 1 }, (_, i) => gMinY + i).map(gy => {
              const sy = toS(0, gy).y;
              return <line key={`gy${gy}`} x1={0} y1={sy} x2={W} y2={sy}
                stroke={gy === 0 ? C.axis : C.grid} strokeWidth={gy === 0 ? 1 : 0.7} />;
            })}

            {/* World origin marker (O) */}
            {showOrigin && (
              <g>
                <circle cx={originS.x} cy={originS.y} r="3.5" fill={C.axis} opacity="0.85" />
                <text x={originS.x + 6} y={originS.y - 4} fill={C.axis} fontSize="8" opacity="0.7">O</text>
              </g>
            )}

            {/* Committed trail path */}
            <polyline
              points={trail.map(p => { const s = toS(p.x, p.y); return `${s.x},${s.y}`; }).join(" ")}
              fill="none" stroke={C.trail} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />

            {/* Heading tick at each committed trail pose */}
            {trail.map((p, i) => {
              const s = toS(p.x, p.y);
              const tx = s.x + 8 * Math.cos(p.theta);
              const ty = s.y - 8 * Math.sin(p.theta);
              return (
                <g key={i} opacity={0.8}>
                  <circle cx={s.x} cy={s.y} r={i === 0 ? 4 : 2.5}
                    fill={i === 0 ? C.axis : C.trail} />
                  {/* skip tick on last pose — robot itself shows current heading */}
                  {i < trail.length - 1 && (
                    <line x1={s.x} y1={s.y} x2={tx} y2={ty}
                      stroke={C.trail} strokeWidth="1.5" strokeLinecap="round" />
                  )}
                </g>
              );
            })}

            {/* Preview: dashed arc showing the path of this step */}
            {stepArc && (
              <path d={stepArc} fill="none"
                stroke={C.preview} strokeWidth="2" strokeDasharray="8 4" opacity="0.6" />
            )}

            {/* Preview: θ_mid arrow — the actual direction of movement */}
            {Math.abs(d) > 0.01 && (
              <Arrow x1={CX} y1={CY} x2={mAx} y2={mAy}
                color={C.preview} width={1.5} head={7} opacity={0.7} dashed />
            )}

            {/* Δθ arc — heading change for this step */}
            {hArc && (
              <g>
                <path d={hArc} fill="none" stroke={C.dTheta} strokeWidth="2" opacity="0.8" />
                {/* dot at new heading direction */}
                <circle
                  cx={CX + 34 * Math.cos(pose.theta + dTheta)}
                  cy={CY - 34 * Math.sin(pose.theta + dTheta)}
                  r="3" fill={C.dTheta} opacity="0.9" />
              </g>
            )}

            {/* Ghost robot at predicted next pose */}
            {showPreview && (
              <g transform={`translate(${nextS.x}, ${nextS.y}) rotate(${rotateDeg(next.theta)})`}>
                <RobotShape stroke={C.ghost} fill={C.robotFill} wFill={C.wheel} op={0.3} />
              </g>
            )}

            {/* Current robot — always at SVG centre */}
            <g transform={`translate(${CX}, ${CY}) rotate(${rotateDeg(pose.theta)})`}>
              <RobotShape stroke={C.robot} fill={C.robotFill} wFill={C.wheel} />
            </g>

            {/* Info badge */}
            <rect x={8} y={8} width={264} height={37} rx="4" fill="rgba(5,12,9,0.92)" />
            <text x={16} y={22} fill={C.robot} fontSize="10.5" fontWeight="700">
              {`Step ${trail.length - 1}`}
            </text>
            <text x={56} y={22} fill="#6b7280" fontSize="10.5">
              {`  x=${pose.x.toFixed(2)}  y=${pose.y.toFixed(2)}  θ=${pose.theta.toFixed(2)}`}
            </text>
            <text x={16} y={36} fontSize="9.5">
              <tspan fill={C.preview}>d={d.toFixed(3)}</tspan>
              <tspan fill="#4b5563">{"  "}</tspan>
              <tspan fill={C.dTheta}>Δθ={dTheta.toFixed(3)}</tspan>
              <tspan fill="#4b5563">{"  "}</tspan>
              <tspan fill="#9ca3af">θ_mid={tMid.toFixed(3)}</tspan>
            </text>
          </svg>
        </div>

        {/* Controls */}
        <div className="space-y-3 border-t border-border-default bg-bg-secondary p-4">
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            <span className="self-center text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Try:
            </span>
            {PRESETS.map(({ label, dL: pl, dR: pr }) => (
              <button key={label}
                onClick={() => { setDL(pl); setDR(pr); }}
                className="rounded-full border border-border-default px-3 py-0.5 text-xs text-text-muted hover:border-border-bright hover:text-text-secondary transition-all">
                {label}
              </button>
            ))}
          </div>

          {/* Sliders */}
          <label className="block space-y-1">
            <span className="flex justify-between text-xs">
              <span className="text-text-secondary">Left wheel distance d_L</span>
              <span className="font-mono text-accent-green">{dL.toFixed(2)} m</span>
            </span>
            <input type="range" min={-0.6} max={1.2} step={0.05} value={dL}
              onChange={e => setDL(parseFloat(e.target.value))}
              className="w-full accent-accent-green" />
          </label>
          <label className="block space-y-1">
            <span className="flex justify-between text-xs">
              <span className="text-text-secondary">Right wheel distance d_R</span>
              <span className="font-mono text-accent-green">{dR.toFixed(2)} m</span>
            </span>
            <input type="range" min={-0.6} max={1.2} step={0.05} value={dR}
              onChange={e => setDR(parseFloat(e.target.value))}
              className="w-full accent-accent-green" />
          </label>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button onClick={() => applyN(1)}
              className="rounded-md bg-accent-green px-4 py-2 text-xs font-semibold text-bg-primary transition hover:opacity-90">
              Apply Step
            </button>
            <button onClick={() => applyN(8)}
              className="rounded-md border border-border-default px-4 py-2 text-xs font-semibold text-text-secondary transition hover:bg-bg-hover">
              × 8
            </button>
            <button onClick={reset}
              className="rounded-md border border-border-default px-4 py-2 text-xs font-semibold text-text-secondary transition hover:bg-bg-hover">
              Reset
            </button>
          </div>

          {/* Live equation chain */}
          <div className="rounded-lg border border-border-default bg-bg-primary/60 px-3 py-2.5 font-mono text-[10.5px] leading-[2]">
            <div>
              <span className="text-text-muted">d     = (d_R + d_L) / 2    =  </span>
              <span style={{ color: C.preview }}>{d.toFixed(4)}</span>
              <span className="text-text-muted"> m</span>
            </div>
            <div>
              <span className="text-text-muted">Δθ    = (d_R − d_L) / L    =  </span>
              <span style={{ color: C.dTheta }}>{dTheta.toFixed(4)}</span>
              <span className="text-text-muted"> rad</span>
            </div>
            <div>
              <span className="text-text-muted">θ_mid = θ + Δθ/2           =  </span>
              <span className="text-[#9ca3af]">{tMid.toFixed(4)}</span>
              <span className="text-text-muted"> rad</span>
            </div>
            <div>
              <span className="text-accent-green">x′</span>
              <span className="text-text-muted"> = x + d·cos(θ_mid)        =  </span>
              <span className="text-accent-green">{next.x.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-accent-green">y′</span>
              <span className="text-text-muted"> = y + d·sin(θ_mid)        =  </span>
              <span className="text-accent-green">{next.y.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-accent-green">θ′</span>
              <span className="text-text-muted"> = θ + Δθ                  =  </span>
              <span className="text-accent-green">{next.theta.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>
    </VizErrorBoundary>
  );
}
