"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { VizErrorBoundary } from "./VizErrorBoundary";

function simulatePID(
  kp: number,
  ki: number,
  kd: number,
  setpoint: number,
  dt: number,
  steps: number
) {
  const times: number[] = [];
  const values: number[] = [];
  let current = 0;
  let integral = 0;
  let prevError = 0;

  for (let i = 0; i <= steps; i++) {
    times.push(i * dt);
    values.push(current);
    const error = setpoint - current;
    integral += error * dt;
    const derivative = (error - prevError) / dt;
    const control = kp * error + ki * integral + kd * derivative;
    prevError = error;
    current += control * dt * 0.5;
  }

  return { times, values };
}

function PIDChart({
  kp,
  ki,
  kd,
  setpoint,
}: {
  kp: number;
  ki: number;
  kd: number;
  setpoint: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { times, values } = useMemo(
    () => simulatePID(kp, ki, kd, setpoint, 0.05, 200),
    [kp, ki, kd, setpoint]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 20, right: 20, bottom: 30, left: 45 };
    const pw = w - pad.left - pad.right;
    const ph = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    const tMax = times[times.length - 1];
    const yMax = Math.max(setpoint * 1.6, Math.max(...values) * 1.1, 1.5);
    const yMin = Math.min(0, Math.min(...values) * 1.1);
    const yRange = yMax - yMin;

    const toX = (t: number) => pad.left + (t / tMax) * pw;
    const toY = (v: number) => pad.top + ph - ((v - yMin) / yRange) * ph;

    // Grid lines
    ctx.strokeStyle = "#1e3a2a";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const yVal = yMin + (yRange * i) / 5;
      const y = toY(yVal);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      ctx.fillStyle = "#6b7280";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(yVal.toFixed(1), pad.left - 6, y + 3);
    }

    // Setpoint line (dashed)
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, toY(setpoint));
    ctx.lineTo(w - pad.right, toY(setpoint));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("setpoint", w - pad.right - 45, toY(setpoint) - 6);

    // Response line
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < values.length; i++) {
      const x = toX(times[i]);
      const y = toY(values[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = "#6b7280";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Time (s)", w / 2, h - 4);
    ctx.save();
    ctx.translate(12, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Value", 0, 0);
    ctx.restore();

    // Legend
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(pad.left + 8, pad.top + 4, 12, 3);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Response", pad.left + 24, pad.top + 10);
  }, [times, values, setpoint]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ display: "block" }}
    />
  );
}

export default function PIDControllerViz() {
  const [kp, setKp] = useState(2.0);
  const [ki, setKi] = useState(0.5);
  const [kd, setKd] = useState(0.3);
  const setpoint = 1.0;

  return (
    <VizErrorBoundary>
      <div>
        <div className="h-[240px] bg-bg-primary p-1">
          <PIDChart kp={kp} ki={ki} kd={kd} setpoint={setpoint} />
        </div>
        <div className="space-y-2 border-t border-border-default bg-bg-secondary p-4">
          {[
            { label: "Kp (Proportional)", value: kp, set: setKp, min: 0, max: 10 },
            { label: "Ki (Integral)", value: ki, set: setKi, min: 0, max: 5 },
            { label: "Kd (Derivative)", value: kd, set: setKd, min: 0, max: 5 },
          ].map(({ label, value, set, min, max }) => (
            <div key={label}>
              <label className="mb-0.5 flex items-center justify-between text-xs text-text-secondary">
                <span>{label}</span>
                <span className="font-mono text-accent-green">
                  {value.toFixed(2)}
                </span>
              </label>
              <input
                type="range"
                min={min}
                max={max}
                step={0.05}
                value={value}
                onChange={(e) => set(parseFloat(e.target.value))}
                className="w-full accent-accent-green"
              />
            </div>
          ))}
          <p className="text-[11px] text-text-muted">
            Adjust gains to see how the system response changes. Green = actual,
            Gold dashed = setpoint.
          </p>
        </div>
      </div>
    </VizErrorBoundary>
  );
}
