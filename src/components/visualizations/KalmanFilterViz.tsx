"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { VizErrorBoundary } from "./VizErrorBoundary";

function generateData(R: number, Q: number, steps: number, seed: number) {
  const trueValues: number[] = [];
  const measurements: number[] = [];
  const filtered: number[] = [];

  let x = 0;
  let P = 1;

  // Simple seedable pseudo-random
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };

  for (let i = 0; i < steps; i++) {
    const t = i * 0.1;
    const trueVal = 2 * Math.sin(t * 0.5) + 0.5 * Math.sin(t * 1.3);
    trueValues.push(trueVal);

    const noise = (rand() - 0.5) * 2 * Math.sqrt(R);
    const z = trueVal + noise;
    measurements.push(z);

    const xPred = x;
    const PPred = P + Q;
    const K = PPred / (PPred + R);
    x = xPred + K * (z - xPred);
    P = (1 - K) * PPred;
    filtered.push(x);
  }

  return { trueValues, measurements, filtered };
}

function KalmanChart({ R, Q }: { R: number; Q: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const steps = 100;
  const { trueValues, measurements, filtered } = useMemo(
    () => generateData(R, Q, steps, 42),
    [R, Q]
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
    const pad = { top: 25, right: 20, bottom: 25, left: 40 };
    const pw = w - pad.left - pad.right;
    const ph = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    const allVals = [...trueValues, ...measurements, ...filtered];
    const yMin = Math.min(...allVals) - 0.5;
    const yMax = Math.max(...allVals) + 0.5;
    const yRange = yMax - yMin;

    const toX = (i: number) => pad.left + (i / steps) * pw;
    const toY = (v: number) => pad.top + ph - ((v - yMin) / yRange) * ph;

    // Grid
    ctx.strokeStyle = "#1e3a2a";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ph * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
    }

    // Measurement dots
    ctx.fillStyle = "rgba(107, 114, 128, 0.4)";
    for (let i = 0; i < measurements.length; i++) {
      ctx.beginPath();
      ctx.arc(toX(i), toY(measurements[i]), 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // True signal
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < trueValues.length; i++) {
      if (i === 0) ctx.moveTo(toX(i), toY(trueValues[i]));
      else ctx.lineTo(toX(i), toY(trueValues[i]));
    }
    ctx.stroke();

    // Filtered signal
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < filtered.length; i++) {
      if (i === 0) ctx.moveTo(toX(i), toY(filtered[i]));
      else ctx.lineTo(toX(i), toY(filtered[i]));
    }
    ctx.stroke();

    // Legend
    const lx = pad.left + 10;
    const ly = pad.top + 4;
    ctx.font = "10px sans-serif";

    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(lx, ly, 12, 3);
    ctx.fillStyle = "#9ca3af";
    ctx.fillText("True signal", lx + 16, ly + 5);

    ctx.fillStyle = "#22c55e";
    ctx.fillRect(lx + 90, ly, 12, 3);
    ctx.fillStyle = "#9ca3af";
    ctx.fillText("Kalman filtered", lx + 106, ly + 5);

    ctx.fillStyle = "rgba(107, 114, 128, 0.7)";
    ctx.beginPath();
    ctx.arc(lx + 200, ly + 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#9ca3af";
    ctx.fillText("Measurements", lx + 207, ly + 5);
  }, [trueValues, measurements, filtered, steps]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ display: "block" }}
    />
  );
}

export default function KalmanFilterViz() {
  const [R, setR] = useState(1.0);
  const [Q, setQ] = useState(0.1);

  return (
    <VizErrorBoundary>
      <div>
        <div className="h-[240px] bg-bg-primary p-1">
          <KalmanChart R={R} Q={Q} />
        </div>
        <div className="space-y-2 border-t border-border-default bg-bg-secondary p-4">
          <div>
            <label className="mb-0.5 flex items-center justify-between text-xs text-text-secondary">
              <span>Measurement Noise (R)</span>
              <span className="font-mono text-accent-green">{R.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0.01}
              max={5}
              step={0.05}
              value={R}
              onChange={(e) => setR(parseFloat(e.target.value))}
              className="w-full accent-accent-green"
            />
          </div>
          <div>
            <label className="mb-0.5 flex items-center justify-between text-xs text-text-secondary">
              <span>Process Noise (Q)</span>
              <span className="font-mono text-accent-green">{Q.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0.001}
              max={2}
              step={0.01}
              value={Q}
              onChange={(e) => setQ(parseFloat(e.target.value))}
              className="w-full accent-accent-green"
            />
          </div>
          <p className="text-[11px] text-text-muted">
            Increase R to add sensor noise. Increase Q to make the filter more
            responsive. Grey dots = noisy readings.
          </p>
        </div>
      </div>
    </VizErrorBoundary>
  );
}
