"use client";

import { useState } from "react";
import { VizErrorBoundary } from "./VizErrorBoundary";

const W = 560;
const H = 360;
const SCALE = 50;
const OX = 195;
const OY = 230; // shifted down for better balance with default robotY=1.5

const C = {
  bg: "#07100d",
  grid: "#111a16",
  gridMajor: "#182118",
  world: "#4a6058",
  worldLabel: "#5d7a6e",
  robot: "#22c55e",
  robotFill: "#14532d",
  lx: "#f59e0b",
  ly: "#38bdf8",
  point: "#ef4444",
  rotVec: "#a855f7",
  trans: "#22c55e",
};

// Per-step accent colours (index = step)
const STEP_COLOR = ["", C.lx, C.rotVec, C.trans] as const;

function sc(wx: number, wy: number): [number, number] {
  return [OX + wx * SCALE, OY - wy * SCALE];
}

type Step = 0 | 1 | 2 | 3;

// ── Arrow ─────────────────────────────────────────────────────────────────────
function Arrow({
  x1, y1, x2, y2, color, width = 2, dashed = false, headSize = 9, opacity = 1,
}: {
  x1: number; y1: number; x2: number; y2: number;
  color: string; width?: number; dashed?: boolean; headSize?: number; opacity?: number;
}) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 3) return null;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const bx = x2 - headSize * ux, by = y2 - headSize * uy;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={bx} y2={by}
        stroke={color} strokeWidth={width}
        strokeDasharray={dashed ? "7 4" : undefined}
        strokeLinecap="round" />
      <polygon
        points={`${x2},${y2} ${bx + headSize * 0.5 * px},${by + headSize * 0.5 * py} ${bx - headSize * 0.5 * px},${by - headSize * 0.5 * py}`}
        fill={color} />
    </g>
  );
}

// ── Arc (math-space angles, y-flipped to SVG) ─────────────────────────────────
function Arc({
  cx, cy, r, a1, a2, color, width = 1.5,
}: {
  cx: number; cy: number; r: number;
  a1: number; a2: number; color: string; width?: number;
}) {
  const delta = a2 - a1;
  if (Math.abs(delta) < 0.02) return null;
  const x1s = cx + r * Math.cos(a1), y1s = cy - r * Math.sin(a1);
  const x2s = cx + r * Math.cos(a2), y2s = cy - r * Math.sin(a2);
  const largeArc = Math.abs(delta) > Math.PI ? 1 : 0;
  // CCW in math-space (delta>0) → sweep=0 in SVG with y-flip
  const sweep = delta > 0 ? 0 : 1;
  return (
    <path
      d={`M ${x1s} ${y1s} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2s} ${y2s}`}
      fill="none" stroke={color} strokeWidth={width} strokeDasharray="5 3" />
  );
}

// ── Robot triangle ────────────────────────────────────────────────────────────
function Robot({ cx, cy, theta }: { cx: number; cy: number; theta: number }) {
  const cos = Math.cos(theta), sin = Math.sin(theta);
  const fw = 15, hw = 11;
  const tip = [cx + fw * cos,                    cy - fw * sin                  ] as const;
  const bl  = [cx - hw * 0.5 * cos + hw * sin,  cy + hw * 0.5 * sin + hw * cos] as const;
  const br  = [cx - hw * 0.5 * cos - hw * sin,  cy + hw * 0.5 * sin - hw * cos] as const;
  return (
    <g>
      <polygon
        points={`${tip[0]},${tip[1]} ${bl[0]},${bl[1]} ${br[0]},${br[1]}`}
        fill={C.robotFill} stroke={C.robot} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r="3.5" fill={C.robot} />
    </g>
  );
}

// ── Tag — dark pill behind floating canvas text for readability ────────────────
function Tag({
  x, y, text, color, size = 9.5,
}: {
  x: number; y: number; text: string; color: string; size?: number;
}) {
  const w = text.length * 5.6 + 9;
  return (
    <g>
      <rect x={x - 3} y={y - 10} width={w} height={14} rx="2.5"
        fill="rgba(5,12,9,0.9)" />
      <text x={x} y={y} fill={color} fontSize={size} fontWeight="600">{text}</text>
    </g>
  );
}

// ── Step descriptions ─────────────────────────────────────────────────────────
const STEP_DESCS: Record<1 | 2 | 3, {
  title: string;
  body: (p: { tDeg: number; lx: number; ly: number; rx: number; ry: number; wx: number; wy: number }) => string;
}> = {
  1: {
    title: "Point in the robot frame",
    body: ({ lx, ly }) =>
      `The sensor reports P = (${lx.toFixed(1)}, ${ly.toFixed(1)}) relative to the robot. X_r (amber) and Y_r (blue) are fixed to the robot — they rotate whenever the robot rotates. The dashed lines show the decomposition along those local axes.`,
  },
  2: {
    title: "Apply rotation R(θ)",
    body: ({ tDeg, rx, ry }) =>
      `Rotate the local vector by heading θ = ${tDeg}°. The ghost shows what happens if you skip rotation — the wrong answer. The purple arrow R(θ)·p = (${rx.toFixed(2)}, ${ry.toFixed(2)}) is the same vector now expressed in world orientation. Both start at the world origin.`,
  },
  3: {
    title: "Apply translation",
    body: ({ wx, wy }) =>
      `Shift the rotated vector from the world origin to the robot's world position. The green arrow is the translation. The point arrives at its true world position P_world = (${wx.toFixed(2)}, ${wy.toFixed(2)}).`,
  },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function CoordinateFramesViz() {
  const [robotX, setRobotX] = useState(1.5);
  const [robotY, setRobotY] = useState(1.5);
  const [theta,  setTheta]  = useState(0);
  const [localX, setLocalX] = useState(1);
  const [localY, setLocalY] = useState(1);
  const [step,   setStep]   = useState<Step>(0);

  const cos = Math.cos(theta), sin = Math.sin(theta);
  const rotX   = cos * localX - sin * localY;
  const rotY   = sin * localX + cos * localY;
  const worldX = robotX + rotX;
  const worldY = robotY + rotY;
  const tDeg   = Math.round(theta * 180 / Math.PI);

  const [rxs,  rys]  = sc(robotX, robotY);
  const [wxs,  wys]  = sc(worldX, worldY);
  const [rvxs, rvys] = sc(rotX,   rotY);
  const [ulxs, ulys] = sc(localX, localY);
  const [lxTx, lxTy] = sc(robotX + cos, robotY + sin);
  const [lyTx, lyTy] = sc(robotX - sin, robotY + cos);
  const compMidX = rxs + SCALE * localX * cos;
  const compMidY = rys - SCALE * localX * sin;

  // Grid
  const grid = [];
  for (let i = -4; i <= 9; i++) {
    const [gx] = sc(i, 0);
    const [, gy] = sc(0, i);
    const major = i % 2 === 0;
    grid.push(
      <line key={`gx${i}`} x1={gx} y1={0} x2={gx} y2={H}
        stroke={major ? C.gridMajor : C.grid} strokeWidth={major ? 1 : 0.75} />,
      <line key={`gy${i}`} x1={0} y1={gy} x2={W} y2={gy}
        stroke={major ? C.gridMajor : C.grid} strokeWidth={major ? 1 : 0.75} />,
    );
  }

  return (
    <VizErrorBoundary>
      <div className="select-none">

        {/* ── Canvas ────────────────────────────────────────────────────────── */}
        <div style={{ background: C.bg }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "310px" }}>
            <rect width={W} height={H} fill={C.bg} />
            {grid}

            {/* World axes */}
            <g opacity={step === 2 ? 0.45 : 1}>
              <Arrow x1={22} y1={OY} x2={W - 18} y2={OY} color={C.world} width={1.5} headSize={8} />
              <Tag x={W - 28} y={OY + 15} text="X_w" color={C.worldLabel} />
              <Arrow x1={OX} y1={H - 22} x2={OX} y2={16} color={C.world} width={1.5} headSize={8} />
              <Tag x={OX + 6} y={14} text="Y_w" color={C.worldLabel} />
              <circle cx={OX} cy={OY} r="3.5" fill={C.world} />
              <Tag x={OX + 6} y={OY + 14} text="O" color={C.worldLabel} size={9} />
              {[-3, -2, -1, 1, 2, 3, 4].map(i => {
                const [tx] = sc(i, 0);
                const [, ty] = sc(0, i);
                return (
                  <g key={i} opacity="0.45">
                    <text x={tx} y={OY + 14} fill={C.worldLabel} fontSize="8" textAnchor="middle">{i}</text>
                    <text x={OX - 12} y={ty + 3}  fill={C.worldLabel} fontSize="8" textAnchor="middle">{i}</text>
                  </g>
                );
              })}
            </g>

            {/* Step 2 — ghost: naive result without rotation */}
            {step === 2 && Math.abs(theta) > 0.05 && (
              <g>
                <Arrow x1={OX} y1={OY} x2={ulxs} y2={ulys}
                  color="#3a4a42" width={1.5} dashed headSize={7} />
                <Tag x={ulxs + 8} y={ulys - 7} text="skip rotation  ✗" color="#4a5c52" />
              </g>
            )}

            {/* Step 2 — hint when heading = 0 */}
            {step === 2 && Math.abs(theta) <= 0.05 && (
              <text x={OX + 16} y={OY - 90}
                fill={C.rotVec} fontSize="11" fontWeight="500" opacity="0.7">
                ← drag the Heading slider to see R(θ) rotate the vector
              </text>
            )}

            {/* Rotated vector from world origin (focus in step 2, faint in overview) */}
            {(step === 0 || step === 2) && (
              <g opacity={step === 0 ? 0.3 : 1}>
                <Arrow x1={OX} y1={OY} x2={rvxs} y2={rvys}
                  color={C.rotVec} width={step === 2 ? 2.5 : 1.5} headSize={8} />
                {step === 2 && (
                  <>
                    <circle cx={rvxs} cy={rvys} r="6" fill={C.rotVec} opacity="0.85" />
                    <Tag x={rvxs + 11} y={rvys - 9} text="R(θ)·p" color={C.rotVec} size={10} />
                    <Tag x={rvxs + 11} y={rvys + 5} text={`(${rotX.toFixed(2)}, ${rotY.toFixed(2)})`} color="#d8b4fe" size={9} />
                    <Arc cx={OX} cy={OY} r={46}
                      a1={Math.atan2(localY, localX)}
                      a2={Math.atan2(rotY, rotX)}
                      color={C.lx} width={2} />
                    {(() => {
                      const mid = (Math.atan2(localY, localX) + Math.atan2(rotY, rotX)) / 2;
                      return (
                        <Tag
                          x={OX + 57 * Math.cos(mid) - 12}
                          y={OY - 57 * Math.sin(mid) + 4}
                          text={`θ=${tDeg}°`} color={C.lx} size={9.5} />
                      );
                    })()}
                  </>
                )}
              </g>
            )}

            {/* Step 3 — translation arrow + dim rotated vec from robot */}
            {step === 3 && (
              <g>
                <Arrow x1={OX} y1={OY} x2={rxs} y2={rys}
                  color={C.trans} width={2.5} headSize={9} />
                <Tag
                  x={(OX + rxs) / 2 + 8} y={(OY + rys) / 2 - 9}
                  text="+robot_pos" color={C.trans} />
                <Arrow x1={rxs} y1={rys} x2={wxs} y2={wys}
                  color={C.rotVec} width={1.5} dashed opacity={0.45} headSize={7} />
              </g>
            )}

            {/* Local frame axes at robot */}
            <g opacity={step === 2 || step === 3 ? 0.1 : 1}>
              <Arrow x1={rxs} y1={rys} x2={lxTx} y2={lxTy} color={C.lx} width={2.5} headSize={8} />
              <Tag
                x={lxTx + Math.round(6 * cos)}
                y={lxTy - Math.round(6 * sin)}
                text="X_r" color={C.lx} size={11} />

              <Arrow x1={rxs} y1={rys} x2={lyTx} y2={lyTy} color={C.ly} width={2.5} headSize={8} />
              <Tag
                x={lyTx - Math.round(7 * sin) - 2}
                y={lyTy - Math.round(7 * cos)}
                text="Y_r" color={C.ly} size={11} />
            </g>

            {/* Robot body */}
            <g opacity={step === 2 ? 0.2 : 1}>
              <Robot cx={rxs} cy={rys} theta={theta} />
            </g>

            {/* Robot label — show coords in step 3 */}
            {step !== 2 && (
              <g>
                <Tag
                  x={rxs + Math.round(22 * cos - 16 * sin)}
                  y={rys - Math.round(22 * sin + 14 * cos)}
                  text="robot" color={C.robot} size={9} />
                {step === 3 && (
                  <Tag
                    x={rxs + Math.round(22 * cos - 16 * sin)}
                    y={rys - Math.round(22 * sin + 14 * cos) + 13}
                    text={`(${robotX.toFixed(1)}, ${robotY.toFixed(1)})`}
                    color="#86efac" size={8.5} />
                )}
              </g>
            )}

            {/* Dashed vector robot→point + component breakdown in step 1 */}
            {(step === 0 || step === 1) && (
              <g>
                {step === 1 && (
                  <>
                    <line x1={rxs} y1={rys} x2={compMidX} y2={compMidY}
                      stroke={C.lx} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.8" />
                    <line x1={compMidX} y1={compMidY} x2={wxs} y2={wys}
                      stroke={C.ly} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.8" />
                    <Tag
                      x={(rxs + compMidX) / 2 + Math.round(-4 * sin) - 2}
                      y={(rys + compMidY) / 2 - Math.round(4 * cos) - 4}
                      text={localX.toFixed(1)} color={C.lx} size={9} />
                    <Tag
                      x={(compMidX + wxs) / 2 + Math.round(4 * cos) + 3}
                      y={(compMidY + wys) / 2 - Math.round(4 * sin) - 4}
                      text={localY.toFixed(1)} color={C.ly} size={9} />
                  </>
                )}
                <line x1={rxs} y1={rys} x2={wxs} y2={wys}
                  stroke={C.point} strokeWidth={step === 1 ? 2 : 1.5}
                  strokeDasharray="8 5" opacity={step === 1 ? 1 : 0.55} />
              </g>
            )}

            {/* World / local point */}
            {(step === 0 || step === 1 || step === 3) && (
              <g>

                <circle cx={wxs} cy={wys} r="7" fill={C.point} />
                {step === 1 ? (
                  <>
                    <Tag x={wxs + 14} y={wys - 8} text="P_local" color={C.point} size={10} />
                    <Tag x={wxs + 14} y={wys + 6} text={`(${localX.toFixed(1)}, ${localY.toFixed(1)})`} color="#fca5a5" size={9} />
                  </>
                ) : (
                  <>
                    <Tag x={wxs + 14} y={wys - 8} text="P_world" color={C.point} size={10} />
                    <Tag x={wxs + 14} y={wys + 6} text={`(${worldX.toFixed(2)}, ${worldY.toFixed(2)})`} color="#fca5a5" size={9} />
                  </>
                )}
              </g>
            )}
          </svg>
        </div>

        {/* ── Color legend ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border-default bg-bg-primary/20 px-4 py-1.5">
          {[
            { col: C.lx,     label: "X_r axis"    },
            { col: C.ly,     label: "Y_r axis"    },
            { col: C.point,  label: "Point P"     },
            { col: C.rotVec, label: "R(θ)·p"      },
            { col: C.trans,  label: "Translation" },
          ].map(({ col, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-[10px] text-text-muted">
              <span className="inline-block h-[3px] w-3.5 rounded-full" style={{ background: col }} />
              {label}
            </span>
          ))}
        </div>

        {/* ── Step pills ───────────────────────────────────────────────────── */}
        <div className="flex gap-2 border-t border-border-default bg-bg-secondary px-4 py-2.5">
          {(["Overview", "Local Frame", "Rotate", "Translate"] as const).map((label, i) => (
            <button
              key={i}
              onClick={() => setStep(i as Step)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                step === i
                  ? "bg-accent-green text-bg-primary"
                  : "border border-border-default text-text-muted hover:border-border-bright hover:text-text-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Step description ─────────────────────────────────────────────── */}
        {step > 0 && (() => {
          const cfg = STEP_DESCS[step as 1 | 2 | 3];
          const body = cfg.body({ tDeg, lx: localX, ly: localY, rx: rotX, ry: rotY, wx: worldX, wy: worldY });
          return (
            <div
              className="border-t border-border-default border-l-2 bg-bg-primary/40 px-4 py-2.5 text-xs"
              style={{ borderLeftColor: STEP_COLOR[step] }}
            >
              <span className="font-semibold" style={{ color: STEP_COLOR[step] }}>
                {cfg.title} —{" "}
              </span>
              <span className="text-text-secondary">{body}</span>
            </div>
          );
        })()}

        {/* ── Controls ─────────────────────────────────────────────────────── */}
        <div className="border-t border-border-default bg-bg-secondary p-4">
          <div className="grid grid-cols-2 gap-x-6 text-xs">

            {/* Left: Robot Pose */}
            <div>
              <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Robot Pose
              </div>
              <div className="space-y-3">
                {[
                  { label: "Robot X",   val: robotX, set: setRobotX, min: -2, max: 4,        st: 0.1,  col: C.robot, disp: undefined    },
                  { label: "Robot Y",   val: robotY, set: setRobotY, min: -2, max: 3,        st: 0.1,  col: C.robot, disp: undefined    },
                  { label: "Heading θ", val: theta,  set: setTheta,  min: -Math.PI, max: Math.PI, st: 0.05, col: C.robot, disp: `${tDeg}°` },
                ].map(({ label, val, set, min, max, st, col, disp }) => (
                  <label key={label} className="block space-y-1">
                    <span className="flex justify-between text-text-secondary">
                      <span>{label}</span>
                      <span className="font-mono" style={{ color: col }}>{disp ?? val.toFixed(2)}</span>
                    </span>
                    <input type="range" min={min} max={max} step={st} value={val}
                      onChange={e => set(parseFloat(e.target.value))}
                      className="w-full accent-accent-green" />
                  </label>
                ))}
              </div>
            </div>

            {/* Right: Local Point */}
            <div>
              <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Local Point
              </div>
              <div className="space-y-3">
                {[
                  { label: "Local X", val: localX, set: setLocalX, min: -2, max: 2.5, st: 0.1, col: C.lx },
                  { label: "Local Y", val: localY, set: setLocalY, min: -2, max: 2,   st: 0.1, col: C.ly },
                ].map(({ label, val, set, min, max, st, col }) => (
                  <label key={label} className="block space-y-1">
                    <span className="flex justify-between text-text-secondary">
                      <span>{label}</span>
                      <span className="font-mono" style={{ color: col }}>{val.toFixed(2)}</span>
                    </span>
                    <input type="range" min={min} max={max} step={st} value={val}
                      onChange={e => set(parseFloat(e.target.value))}
                      className="w-full accent-accent-green" />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Live equation */}
          <div className="mt-3 rounded-lg border border-border-default bg-bg-primary/60 px-3 py-2.5 font-mono text-[10.5px] leading-[1.9]">
            <div className="text-text-muted">p_world = robot_pos + R(θ) · p_local</div>
            <div>
              <span style={{ color: C.lx }}>x_w</span>
              <span className="text-text-muted">
                {" "}= {robotX.toFixed(2)} + cos({tDeg}°)·{localX.toFixed(2)} − sin({tDeg}°)·{localY.toFixed(2)} ={" "}
              </span>
              <span style={{ color: "#4ade80" }}>{worldX.toFixed(3)}</span>
            </div>
            <div>
              <span style={{ color: C.ly }}>y_w</span>
              <span className="text-text-muted">
                {" "}= {robotY.toFixed(2)} + sin({tDeg}°)·{localX.toFixed(2)} + cos({tDeg}°)·{localY.toFixed(2)} ={" "}
              </span>
              <span style={{ color: "#4ade80" }}>{worldY.toFixed(3)}</span>
            </div>
          </div>
        </div>

      </div>
    </VizErrorBoundary>
  );
}
