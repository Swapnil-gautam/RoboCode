"use client";

import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { VizErrorBoundary } from "./VizErrorBoundary";

function generatePath(numPoints: number): [number, number][] {
  const path: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * Math.PI * 2;
    path.push([1.5 * Math.cos(t), 1.0 * Math.sin(t)]);
  }
  return path;
}

function findLookaheadPoint(
  path: [number, number][],
  rx: number,
  ry: number,
  ld: number
): [number, number] {
  let closest = 0;
  let minDist = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - rx, path[i][1] - ry);
    if (d < minDist) {
      minDist = d;
      closest = i;
    }
  }
  for (let i = 0; i < path.length; i++) {
    const idx = (closest + i) % path.length;
    if (Math.hypot(path[idx][0] - rx, path[idx][1] - ry) >= ld)
      return path[idx];
  }
  return path[(closest + 10) % path.length];
}

const PATH = generatePath(100);

function PathLine() {
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    if (!ref.current) return;
    const pts = [...PATH, PATH[0]].map(([x, y]) => new THREE.Vector3(x, y, 0));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: "#2d5a3e" });
    const line = new THREE.Line(geo, mat);
    ref.current.add(line);
    return () => {
      ref.current?.remove(line);
      geo.dispose();
      mat.dispose();
    };
  }, []);

  return <group ref={ref} />;
}

function Robot({
  lookahead,
  playing,
  resetKey,
}: {
  lookahead: number;
  playing: boolean;
  resetKey: number;
}) {
  const robotRef = useRef<THREE.Group>(null);
  const goalRef = useRef<THREE.Mesh>(null);
  const stateRef = useRef({ x: 1.5, y: 0, theta: Math.PI / 2 });
  const trailPtsRef = useRef<THREE.Vector3[]>([]);
  const trailGroupRef = useRef<THREE.Group>(null);
  const trailLineRef = useRef<THREE.Line | null>(null);

  useEffect(() => {
    if (trailGroupRef.current && !trailLineRef.current) {
      const geo = new THREE.BufferGeometry();
      const mat = new THREE.LineBasicMaterial({
        color: "#22c55e",
        transparent: true,
        opacity: 0.4,
      });
      const line = new THREE.Line(geo, mat);
      trailLineRef.current = line;
      trailGroupRef.current.add(line);
    }
  }, []);

  useEffect(() => {
    stateRef.current = { x: 1.5, y: 0, theta: Math.PI / 2 };
    trailPtsRef.current = [];
    if (robotRef.current) {
      robotRef.current.position.set(1.5, 0, 0.05);
      robotRef.current.rotation.z = Math.PI / 2;
    }
    if (trailLineRef.current) {
      trailLineRef.current.geometry.setFromPoints([new THREE.Vector3()]);
    }
  }, [resetKey]);

  useFrame((_, delta) => {
    if (!playing || !robotRef.current) return;
    const dt = Math.min(delta, 0.05);
    const s = stateRef.current;
    const wb = 0.3;
    const speed = 1.2;

    const goal = findLookaheadPoint(PATH, s.x, s.y, lookahead);
    if (goalRef.current) goalRef.current.position.set(goal[0], goal[1], 0.05);

    const dx = goal[0] - s.x;
    const dy = goal[1] - s.y;
    const yLocal = -Math.sin(s.theta) * dx + Math.cos(s.theta) * dy;
    const curv = (2 * yLocal) / (lookahead * lookahead);
    const steer = Math.atan(curv * wb);

    s.x += speed * Math.cos(s.theta) * dt;
    s.y += speed * Math.sin(s.theta) * dt;
    s.theta += (speed / wb) * Math.tan(steer) * dt;

    robotRef.current.position.set(s.x, s.y, 0.05);
    robotRef.current.rotation.z = s.theta;

    trailPtsRef.current.push(new THREE.Vector3(s.x, s.y, 0.02));
    if (trailPtsRef.current.length > 500) trailPtsRef.current.shift();
    if (trailLineRef.current && trailPtsRef.current.length > 1) {
      trailLineRef.current.geometry.setFromPoints(trailPtsRef.current);
    }
  });

  return (
    <group>
      <group ref={robotRef} position={[1.5, 0, 0.05]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <boxGeometry args={[0.2, 0.12, 0.06]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
        <mesh position={[0.12, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.04, 0.08, 8]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
      </group>

      <mesh ref={goalRef} position={[1.5, 0, 0.05]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>

      <group ref={trailGroupRef} />
    </group>
  );
}

function VizFallback() {
  return (
    <div className="flex h-[280px] items-center justify-center bg-bg-primary">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle cx={12} cy={12} r={10} stroke="currentColor" strokeWidth={3}
            fill="none" strokeDasharray="32" strokeDashoffset="12" />
        </svg>
        Loading 3D visualization...
      </div>
    </div>
  );
}

export default function PurePursuitViz() {
  const [lookahead, setLookahead] = useState(0.5);
  const [playing, setPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setResetKey((k) => k + 1);
  }, []);

  return (
    <VizErrorBoundary>
      <div>
        <div className="relative h-[280px] bg-bg-primary">
          <Suspense fallback={<VizFallback />}>
            <Canvas
              camera={{ position: [0, 0, 4.5], fov: 40 }}
              gl={{ antialias: true, alpha: false }}
              onCreated={({ gl }) => gl.setClearColor("#0a0f0d")}
            >
              <ambientLight intensity={0.8} />
              <directionalLight position={[0, 0, 5]} intensity={0.6} />
              <PathLine />
              <Robot lookahead={lookahead} playing={playing} resetKey={resetKey} />
              <OrbitControls
                enablePan={false}
                enableRotate={false}
                maxDistance={8}
                minDistance={2}
              />
            </Canvas>
          </Suspense>
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-bg-primary/80 px-2.5 py-1.5 text-[11px] text-text-muted backdrop-blur-sm">
            {playing ? "Robot tracking the elliptical path..." : "Press Play to start simulation"}
          </div>
        </div>
        <div className="space-y-3 border-t border-border-default bg-bg-secondary p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPlaying(!playing)}
              className="flex items-center gap-1.5 rounded-md bg-accent-green px-3 py-1.5 text-xs font-semibold text-bg-primary"
            >
              {playing ? (
                <>
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="rounded-md bg-bg-tertiary px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-hover"
            >
              Reset
            </button>
            <div className="flex-1">
              <label className="mb-0.5 flex items-center justify-between text-xs text-text-secondary">
                <span>Lookahead Distance</span>
                <span className="font-mono text-accent-green">
                  {lookahead.toFixed(2)}
                </span>
              </label>
              <input
                type="range" min={0.2} max={1.5} step={0.05}
                value={lookahead}
                onChange={(e) => setLookahead(parseFloat(e.target.value))}
                className="w-full accent-accent-green"
              />
            </div>
          </div>
          <p className="text-[11px] text-text-muted">
            Green robot follows the path. Red dot = lookahead target.
            Shorter lookahead = tighter tracking but more oscillation.
          </p>
        </div>
      </div>
    </VizErrorBoundary>
  );
}
