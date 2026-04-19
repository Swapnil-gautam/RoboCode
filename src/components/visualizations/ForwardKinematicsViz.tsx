"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { VizErrorBoundary } from "./VizErrorBoundary";

interface TracePoint {
  x: number;
  y: number;
  age: number;
}

const CANVAS_W = 500;
const CANVAS_H = 320;
const SCALE = 70;
const ORIGIN_X = CANVAS_W / 2;
const ORIGIN_Y = CANVAS_H / 2 + 20;
const MAX_TRACE = 200;
const TRACE_LIFETIME = 120;

function toScreen(x: number, y: number): [number, number] {
  return [ORIGIN_X + x * SCALE, ORIGIN_Y - y * SCALE];
}

export default function ForwardKinematicsViz() {
  const [theta1, setTheta1] = useState(0.5);
  const [theta2, setTheta2] = useState(0.8);
  const l1 = 1;
  const l2 = 0.8;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const traceRef = useRef<TracePoint[]>([]);
  const prevPos = useRef<{ x: number; y: number } | null>(null);
  const animRef = useRef<number>(0);

  const elbowX = l1 * Math.cos(theta1);
  const elbowY = l1 * Math.sin(theta1);
  const endX = elbowX + l2 * Math.cos(theta1 + theta2);
  const endY = elbowY + l2 * Math.sin(theta1 + theta2);

  const addTracePoint = useCallback((x: number, y: number) => {
    const prev = prevPos.current;
    if (prev && Math.abs(prev.x - x) < 0.001 && Math.abs(prev.y - y) < 0.001) {
      return;
    }
    prevPos.current = { x, y };
    traceRef.current.push({ x, y, age: 0 });
    if (traceRef.current.length > MAX_TRACE) {
      traceRef.current = traceRef.current.slice(-MAX_TRACE);
    }
  }, []);

  useEffect(() => {
    addTracePoint(endX, endY);
  }, [endX, endY, addTracePoint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.scale(dpr, dpr);

    let running = true;

    function draw() {
      if (!running || !ctx) return;

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.fillStyle = "#0a0f0d";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      drawGrid(ctx);
      drawTrace(ctx, traceRef.current);
      drawArm(ctx, theta1, theta2, l1, l2);
      traceRef.current.forEach((p) => p.age++);
      traceRef.current = traceRef.current.filter((p) => p.age < TRACE_LIFETIME);

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [theta1, theta2, l1, l2]);

  return (
    <VizErrorBoundary>
      <div>
        <div className="relative" style={{ height: CANVAS_H }}>
          <canvas
            ref={canvasRef}
            style={{ width: CANVAS_W, height: CANVAS_H, display: "block", margin: "0 auto" }}
            className="w-full"
          />
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-bg-primary/80 px-2.5 py-1.5 text-xs font-mono text-accent-green backdrop-blur-sm">
            End-effector: ({endX.toFixed(2)}, {endY.toFixed(2)})
          </div>
        </div>
        <div className="space-y-3 border-t border-border-default bg-bg-secondary p-4">
          <div>
            <label className="mb-1 flex items-center justify-between text-xs text-text-secondary">
              <span>&theta;<sub>1</sub> (Joint 1)</span>
              <span className="font-mono text-accent-green">
                {((theta1 * 180) / Math.PI).toFixed(1)}&deg;
              </span>
            </label>
            <input
              type="range" min={-Math.PI} max={Math.PI} step={0.01}
              value={theta1}
              onChange={(e) => setTheta1(parseFloat(e.target.value))}
              className="w-full accent-accent-green"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center justify-between text-xs text-text-secondary">
              <span>&theta;<sub>2</sub> (Joint 2)</span>
              <span className="font-mono text-accent-green">
                {((theta2 * 180) / Math.PI).toFixed(1)}&deg;
              </span>
            </label>
            <input
              type="range" min={-Math.PI} max={Math.PI} step={0.01}
              value={theta2}
              onChange={(e) => setTheta2(parseFloat(e.target.value))}
              className="w-full accent-accent-green"
            />
          </div>
        </div>
      </div>
    </VizErrorBoundary>
  );
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "rgba(30, 58, 42, 0.4)";
  ctx.lineWidth = 0.5;

  for (let i = -4; i <= 4; i++) {
    const [sx, sy] = toScreen(i, -3);
    const [ex, ey] = toScreen(i, 3);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  for (let i = -3; i <= 3; i++) {
    const [sx, sy] = toScreen(-4, i);
    const [ex, ey] = toScreen(4, i);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(30, 58, 42, 0.8)";
  ctx.lineWidth = 1;
  const [axOx, axOy] = toScreen(-4, 0);
  const [axEx, axEy] = toScreen(4, 0);
  ctx.beginPath();
  ctx.moveTo(axOx, axOy);
  ctx.lineTo(axEx, axEy);
  ctx.stroke();

  const [ayOx, ayOy] = toScreen(0, -3);
  const [ayEx, ayEy] = toScreen(0, 3);
  ctx.beginPath();
  ctx.moveTo(ayOx, ayOy);
  ctx.lineTo(ayEx, ayEy);
  ctx.stroke();

  ctx.fillStyle = "rgba(156, 163, 175, 0.3)";
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const [lx, ly] = toScreen(i, 0);
    ctx.fillText(`${i}`, lx, ly + 12);
  }
  ctx.textAlign = "right";
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    const [lx, ly] = toScreen(0, i);
    ctx.fillText(`${i}`, lx - 5, ly + 3);
  }
}

function drawTrace(ctx: CanvasRenderingContext2D, trace: TracePoint[]) {
  if (trace.length < 2) return;

  for (let i = 1; i < trace.length; i++) {
    const p0 = trace[i - 1];
    const p1 = trace[i];
    const alpha0 = Math.max(0, 1 - p0.age / TRACE_LIFETIME);
    const alpha1 = Math.max(0, 1 - p1.age / TRACE_LIFETIME);
    const alpha = (alpha0 + alpha1) / 2;

    if (alpha < 0.01) continue;

    const [x0, y0] = toScreen(p0.x, p0.y);
    const [x1, y1] = toScreen(p1.x, p1.y);

    ctx.strokeStyle = `rgba(34, 197, 94, ${alpha * 0.6})`;
    ctx.lineWidth = 2 * alpha + 0.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  for (let i = 0; i < trace.length; i++) {
    const p = trace[i];
    const alpha = Math.max(0, 1 - p.age / TRACE_LIFETIME);
    if (alpha < 0.05) continue;

    const [px, py] = toScreen(p.x, p.y);
    const radius = 1.5 * alpha + 0.3;

    ctx.fillStyle = `rgba(34, 197, 94, ${alpha * 0.4})`;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawArm(
  ctx: CanvasRenderingContext2D,
  theta1: number,
  theta2: number,
  l1: number,
  l2: number
) {
  const elbowX = l1 * Math.cos(theta1);
  const elbowY = l1 * Math.sin(theta1);
  const endX = elbowX + l2 * Math.cos(theta1 + theta2);
  const endY = elbowY + l2 * Math.sin(theta1 + theta2);

  const [ox, oy] = toScreen(0, 0);
  const [ex, ey] = toScreen(elbowX, elbowY);
  const [tx, ty] = toScreen(endX, endY);

  ctx.shadowColor = "rgba(34, 197, 94, 0.3)";
  ctx.shadowBlur = 8;

  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  ctx.shadowBlur = 0;

  ctx.fillStyle = "#374151";
  ctx.strokeStyle = "#6b7280";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ox, oy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f59e0b";
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ox, oy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f59e0b";
  ctx.strokeStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(ex, ey, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = "rgba(239, 68, 68, 0.5)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#ef4444";
  ctx.strokeStyle = "#fca5a5";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(tx, ty, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  drawAngleArc(ctx, ox, oy, theta1, 0, 25, "#f59e0b", "θ₁");
  drawAngleArc(ctx, ex, ey, theta1 + theta2, theta1, 20, "#fbbf24", "θ₂");
}

function drawAngleArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  startAngle: number,
  radius: number,
  color: string,
  label: string
) {
  const start = -startAngle;
  const end = -angle;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, end, angle > startAngle);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const midAngle = -(startAngle + angle) / 2;
  const lx = cx + (radius + 10) * Math.cos(midAngle);
  const ly = cy + (radius + 10) * Math.sin(midAngle);
  ctx.fillStyle = color;
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 0.7;
  ctx.fillText(label, lx, ly);
  ctx.globalAlpha = 1;
}

