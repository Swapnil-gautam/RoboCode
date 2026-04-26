"use client";

import { useState } from "react";
import { VizErrorBoundary } from "./VizErrorBoundary";

const W = 560;
const H = 310;
const CX = 265;
const CY = 195;
const SCALE = 150;
const WHEELBASE = 0.5;
const WHEEL_RADIUS = 0.1;
const HL = (WHEELBASE / 2) * SCALE; // 37.5 px

const RH = 26;
const WW = 13;       // wider wheels for visible animation
const WH = RH + 10;  // 36

const STRIPE_PERIOD = 14; // px per stripe cycle

const LWX = CX - HL - WW;  // left wheel x  = 214.5
const RWX = CX + HL;        // right wheel x = 302.5
const WYT = CY - WH;        // wheel top y   = 159
const WHEIGHT = WH * 2;     // wheel height  = 72

const C = {
  bg: "#07100d",
  grid: "#0d1a14",
  robot: "#22c55e",
  robotFill: "#14532d",
  wheel: "#86efac",   // both wheels — cohesive green family
  rev: "#f87171",
  stopped: "#374151",
  icr: "#a855f7",
  arc: "#22c55e",
  vVec: "#ef4444",
};

function Arrow({
  x1, y1, x2, y2, color, width = 2, head = 8, opacity = 1, dashed = false,
}: {
  x1: number; y1: number; x2: number; y2: number;
  color: string; width?: number; head?: number; opacity?: number; dashed?: boolean;
}) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 5) return null;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const bx = x2 - head * ux, by = y2 - head * uy;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={bx} y2={by}
        stroke={color} strokeWidth={width}
        strokeDasharray={dashed ? "6 3" : undefined}
        strokeLinecap="round" />
      <polygon
        points={`${x2},${y2} ${bx + head * 0.45 * px},${by + head * 0.45 * py} ${bx - head * 0.45 * px},${by - head * 0.45 * py}`}
        fill={color} />
    </g>
  );
}

function Tag({
  x, y, text, color, size = 9.5, anchor = "start",
}: {
  x: number; y: number; text: string; color: string; size?: number; anchor?: "start" | "middle" | "end";
}) {
  const w = text.length * 5.4 + 8;
  const rx = anchor === "middle" ? x - w / 2 - 2 : anchor === "end" ? x - w - 2 : x - 2;
  return (
    <g>
      <rect x={rx} y={y - 11} width={w + 4} height={15} rx="2.5" fill="rgba(5,12,9,0.92)" />
      <text x={x} y={y} fill={color} fontSize={size} fontWeight="600" textAnchor={anchor}>{text}</text>
    </g>
  );
}

function buildArc(v: number, omega: number): string {
  if (Math.abs(v) < 0.002) return "";
  const parts: string[] = [];
  const dt = 0.04;
  const maxT = Math.abs(omega) > 0.1
    ? Math.min(3 * Math.PI / Math.abs(omega), 5)
    : 4;
  let x = 0, y = 0, theta = Math.PI / 2;
  let first = true;
  for (let t = 0; t <= maxT; t += dt) {
    const sx = CX + x * SCALE;
    const sy = CY - y * SCALE;
    if (sx < 5 || sx > W - 5 || sy < 5 || sy > H - 5) break;
    parts.push(`${first ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)}`);
    first = false;
    x += v * Math.cos(theta) * dt;
    y += v * Math.sin(theta) * dt;
    theta += omega * dt;
  }
  return parts.join(" ");
}

const PRESETS = [
  { label: "Straight",      l: 2.5,  r: 2.5  },
  { label: "Curve left",    l: 1.0,  r: 3.0  },
  { label: "Curve right",   l: 3.0,  r: 1.0  },
  { label: "Spin in place", l: -2.0, r: 2.0  },
  { label: "Reverse",       l: -2.5, r: -2.5 },
];

// Stripe indices: start one period above wheel top so the entering stripe is seamless
const STRIPE_COUNT = Math.ceil((WHEIGHT + STRIPE_PERIOD) / STRIPE_PERIOD) + 1;

export default function DifferentialDriveViz() {
  const [leftW,  setLeftW]  = useState(2.5);
  const [rightW, setRightW] = useState(2.5);

  const vL = WHEEL_RADIUS * leftW;
  const vR = WHEEL_RADIUS * rightW;
  const v     = (vL + vR) / 2;
  const omega = (vR - vL) / WHEELBASE;

  const straight  = Math.abs(omega) < 0.02;
  const spinning  = Math.abs(v) < 0.005 && Math.abs(omega) > 0.02;
  const R         = !straight ? v / omega : null;
  const icrSvgX   = R !== null ? CX - R * SCALE : null;
  const showICR   = icrSvgX !== null && icrSvgX > 15 && icrSvgX < W - 15;

  const arcPath = buildArc(v, omega);

  const lCol = leftW  >  0.05 ? C.wheel : leftW  < -0.05 ? C.rev : C.stopped;
  const rCol = rightW >  0.05 ? C.wheel : rightW < -0.05 ? C.rev : C.stopped;

  const AX   = 185;
  const lAY  = CY - vL * AX;
  const rAY  = CY - vR * AX;
  const vAY  = CY - v  * AX * 0.85;

  const lArrowX = CX - HL - WW - 22;
  const rArrowX = CX + HL + WW + 22;

  const mode = spinning
    ? "Spinning in place"
    : straight
      ? (v > 0.001 ? "Straight forward" : v < -0.001 ? "Reverse" : "Stopped")
      : omega > 0 ? "Turning left" : "Turning right";
  const modeCol = spinning ? C.icr
    : straight ? C.robot
    : omega > 0 ? C.wheel : C.wheel;

  // Animation: duration scales inversely with |ω| — faster spin = faster scrolling
  const lDur = Math.abs(leftW)  > 0.05 ? (2 / Math.abs(leftW)).toFixed(2)  : null;
  const rDur = Math.abs(rightW) > 0.05 ? (2 / Math.abs(rightW)).toFixed(2) : null;
  const lAnim = lDur ? `${leftW  > 0 ? "wfwd" : "wrev"} ${lDur}s linear infinite` : "none";
  const rAnim = rDur ? `${rightW > 0 ? "wfwd" : "wrev"} ${rDur}s linear infinite` : "none";

  return (
    <VizErrorBoundary>
      <div className="select-none">
        <div style={{ background: C.bg }}>
          <style>{`
            @keyframes wfwd { 0% { transform: translateY(0); } 100% { transform: translateY(${STRIPE_PERIOD}px);  } }
            @keyframes wrev { 0% { transform: translateY(0); } 100% { transform: translateY(-${STRIPE_PERIOD}px); } }
          `}</style>

          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "295px" }}>
            <rect width={W} height={H} fill={C.bg} />

            <defs>
              <clipPath id="ddlw">
                <rect x={LWX} y={WYT} width={WW} height={WHEIGHT} rx="3" />
              </clipPath>
              <clipPath id="ddrw">
                <rect x={RWX} y={WYT} width={WW} height={WHEIGHT} rx="3" />
              </clipPath>
            </defs>

            {/* Grid */}
            {Array.from({ length: Math.ceil(W / 50) + 1 }, (_, i) => (
              <line key={`gx${i}`} x1={i * 50} y1={0} x2={i * 50} y2={H}
                stroke={C.grid} strokeWidth="0.8" />
            ))}
            {Array.from({ length: Math.ceil(H / 50) + 1 }, (_, i) => (
              <line key={`gy${i}`} x1={0} y1={i * 50} x2={W} y2={i * 50}
                stroke={C.grid} strokeWidth="0.8" />
            ))}

            {/* Trajectory arc */}
            {arcPath && (
              <path d={arcPath} fill="none" stroke={C.arc}
                strokeWidth="2.5" strokeDasharray="9 5" opacity="0.55" />
            )}

            {/* ICR */}
            {showICR && R !== null && (
              <g>
                <line
                  x1={omega > 0 ? CX - HL - WW : CX + HL + WW}
                  y1={CY}
                  x2={icrSvgX!} y2={CY}
                  stroke={C.icr} strokeWidth="1" strokeDasharray="4 3" opacity="0.55" />
                <circle cx={icrSvgX!} cy={CY} r="5.5" fill={C.icr} opacity="0.9" />
                <circle cx={icrSvgX!} cy={CY} r="13" fill="none"
                  stroke={C.icr} strokeWidth="1" strokeDasharray="3 2" opacity="0.3" />
                <Tag
                  x={icrSvgX! + (omega > 0 ? -3 : 3)}
                  y={CY - 20}
                  text="ICR" color={C.icr} size={9}
                  anchor={omega > 0 ? "end" : "start"} />
                <Tag
                  x={icrSvgX! + (omega > 0 ? -3 : 3)}
                  y={CY - 7}
                  text={`R=${Math.abs(R).toFixed(2)}m`} color={C.icr} size={8.5}
                  anchor={omega > 0 ? "end" : "start"} />
              </g>
            )}

            {/* Spin ring */}
            {spinning && (
              <circle cx={CX} cy={CY} r="24" fill="none"
                stroke={C.icr} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.45" />
            )}

            {/* Wheel velocity arrows */}
            <Arrow x1={lArrowX} y1={CY} x2={lArrowX} y2={lAY}
              color={lCol} width={2.5} head={9} />
            <Tag
              x={lArrowX} y={vL >= 0 ? lAY - 14 : lAY + 16}
              text={`vL=${vL.toFixed(2)}`} color={lCol} size={9} anchor="middle" />

            <Arrow x1={rArrowX} y1={CY} x2={rArrowX} y2={rAY}
              color={rCol} width={2.5} head={9} />
            <Tag
              x={rArrowX} y={vR >= 0 ? rAY - 14 : rAY + 16}
              text={`vR=${vR.toFixed(2)}`} color={rCol} size={9} anchor="middle" />

            {/* Left wheel base + scrolling tread stripes */}
            <rect x={LWX} y={WYT} width={WW} height={WHEIGHT} rx="3" fill={lCol} opacity="0.9" />
            <g clipPath="url(#ddlw)" style={{ animation: lAnim } as React.CSSProperties}>
              {Array.from({ length: STRIPE_COUNT }, (_, i) => (
                <rect key={i}
                  x={LWX} y={WYT - STRIPE_PERIOD + i * STRIPE_PERIOD}
                  width={WW} height={7}
                  fill="rgba(0,0,0,0.48)" />
              ))}
            </g>

            {/* Right wheel base + scrolling tread stripes */}
            <rect x={RWX} y={WYT} width={WW} height={WHEIGHT} rx="3" fill={rCol} opacity="0.9" />
            <g clipPath="url(#ddrw)" style={{ animation: rAnim } as React.CSSProperties}>
              {Array.from({ length: STRIPE_COUNT }, (_, i) => (
                <rect key={i}
                  x={RWX} y={WYT - STRIPE_PERIOD + i * STRIPE_PERIOD}
                  width={WW} height={7}
                  fill="rgba(0,0,0,0.48)" />
              ))}
            </g>

            {/* Robot body */}
            <rect x={CX - HL} y={CY - RH}
              width={HL * 2} height={RH * 2}
              rx="8" fill={C.robotFill} stroke={C.robot} strokeWidth="1.5" />
            {/* Front direction triangle */}
            <polygon
              points={`${CX},${CY - RH - 6} ${CX - 10},${CY - RH + 11} ${CX + 10},${CY - RH + 11}`}
              fill={C.robot} />
            {/* Center dot */}
            <circle cx={CX} cy={CY} r="3" fill={C.robot} />

            {/* v arrow (length proportional to |v|, no label) */}
            {Math.abs(v) > 0.003 && (
              <Arrow x1={CX} y1={CY} x2={CX} y2={vAY}
                color={C.vVec} width={2} head={7} opacity={0.9} />
            )}

            {/* Info badge: mode + v + ω */}
            <rect x={8} y={8} width={218} height={37} rx="4" fill="rgba(5,12,9,0.92)" />
            <text x={16} y={23} fill={modeCol} fontSize="11" fontWeight="700">{mode}</text>
            <text x={16} y={38} fontSize="9.5">
              <tspan fill={C.vVec} fontWeight="600">v</tspan>
              <tspan fill="#6b7280"> = </tspan>
              <tspan fill={C.vVec} fontFamily="monospace">{v >= 0 ? " " : ""}{v.toFixed(3)}</tspan>
              <tspan fill="#6b7280"> m/s    </tspan>
              <tspan fill="#f59e0b" fontWeight="600">ω</tspan>
              <tspan fill="#6b7280"> = </tspan>
              <tspan fill="#f59e0b" fontFamily="monospace">{omega >= 0 ? " " : ""}{omega.toFixed(3)}</tspan>
              <tspan fill="#6b7280"> rad/s</tspan>
            </text>
          </svg>
        </div>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 border-t border-border-default bg-bg-secondary px-4 py-2">
          <span className="self-center text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Try:
          </span>
          {PRESETS.map(({ label, l, r }) => (
            <button key={label}
              onClick={() => { setLeftW(l); setRightW(r); }}
              className="rounded-full border border-border-default px-3 py-0.5 text-xs text-text-muted hover:border-border-bright hover:text-text-secondary transition-all">
              {label}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="space-y-3 border-t border-border-default bg-bg-secondary p-4">
          <label className="block space-y-1">
            <span className="flex justify-between text-xs">
              <span style={{ color: C.wheel }}>Left wheel ω_L</span>
              <span className="font-mono" style={{ color: C.wheel }}>{leftW.toFixed(2)} rad/s</span>
            </span>
            <input type="range" min={-4} max={4} step={0.1} value={leftW}
              onChange={e => setLeftW(parseFloat(e.target.value))}
              className="w-full accent-accent-green" />
          </label>
          <label className="block space-y-1">
            <span className="flex justify-between text-xs">
              <span style={{ color: C.wheel }}>Right wheel ω_R</span>
              <span className="font-mono" style={{ color: C.wheel }}>{rightW.toFixed(2)} rad/s</span>
            </span>
            <input type="range" min={-4} max={4} step={0.1} value={rightW}
              onChange={e => setRightW(parseFloat(e.target.value))}
              className="w-full accent-accent-green" />
          </label>

          {/* Live equations */}
          <div className="rounded-lg border border-border-default bg-bg-primary/60 px-3 py-2.5 font-mono text-[10.5px] leading-[2]">
            <div>
              <span style={{ color: C.wheel }}>v_L</span>
              <span className="text-text-muted"> = r × ω_L = 0.1 × {leftW.toFixed(2)} = </span>
              <span style={{ color: C.wheel }}>{vL.toFixed(4)}</span>
              <span className="text-text-muted"> m/s</span>
            </div>
            <div>
              <span style={{ color: C.wheel }}>v_R</span>
              <span className="text-text-muted"> = r × ω_R = 0.1 × {rightW.toFixed(2)} = </span>
              <span style={{ color: C.wheel }}>{vR.toFixed(4)}</span>
              <span className="text-text-muted"> m/s</span>
            </div>
            <div>
              <span className="text-accent-green">v</span>
              <span className="text-text-muted"> = (v_R + v_L) / 2 = </span>
              <span className="text-accent-green">{v.toFixed(4)}</span>
              <span className="text-text-muted"> m/s</span>
            </div>
            <div>
              <span className="text-accent-green">ω</span>
              <span className="text-text-muted"> = (v_R − v_L) / L = </span>
              <span className="text-accent-green">{omega.toFixed(4)}</span>
              <span className="text-text-muted"> rad/s</span>
            </div>
          </div>
        </div>
      </div>
    </VizErrorBoundary>
  );
}
