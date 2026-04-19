"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { VizErrorBoundary } from "./VizErrorBoundary";

function SimpleGrid() {
  const ref = useRef<THREE.LineSegments>(null);

  useEffect(() => {
    if (!ref.current) return;
    const points: number[] = [];
    for (let i = -5; i <= 5; i++) {
      points.push(i * 0.5, -2.5, -0.05, i * 0.5, 2.5, -0.05);
      points.push(-2.5, i * 0.5, -0.05, 2.5, i * 0.5, -0.05);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );
    ref.current.geometry = geo;
  }, []);

  return (
    <lineSegments ref={ref}>
      <bufferGeometry />
      <lineBasicMaterial color="#1e3a2a" transparent opacity={0.5} />
    </lineSegments>
  );
}

function RobotArm({
  theta1,
  theta2,
  l1,
  l2,
}: {
  theta1: number;
  theta2: number;
  l1: number;
  l2: number;
}) {
  const joint1Ref = useRef<THREE.Group>(null);
  const joint2Ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (joint1Ref.current) joint1Ref.current.rotation.z = theta1;
    if (joint2Ref.current) joint2Ref.current.rotation.z = theta2;
  });

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.1, 32]} />
        <meshStandardMaterial color="#374151" />
      </mesh>

      <group ref={joint1Ref}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        <mesh position={[l1 / 2, 0, 0]}>
          <boxGeometry args={[l1, 0.08, 0.08]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
        <group position={[l1, 0, 0]} ref={joint2Ref}>
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
          <mesh position={[l2 / 2, 0, 0]}>
            <boxGeometry args={[l2, 0.06, 0.06]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>
          <mesh position={[l2, 0, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>
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

export default function ForwardKinematicsViz() {
  const [theta1, setTheta1] = useState(0.5);
  const [theta2, setTheta2] = useState(0.8);
  const l1 = 1;
  const l2 = 0.8;

  const x = l1 * Math.cos(theta1) + l2 * Math.cos(theta1 + theta2);
  const y = l1 * Math.sin(theta1) + l2 * Math.sin(theta1 + theta2);

  return (
    <VizErrorBoundary>
      <div>
        <div className="relative h-[280px] bg-bg-primary">
          <Suspense fallback={<VizFallback />}>
            <Canvas
              camera={{ position: [0, 0, 4], fov: 45 }}
              gl={{ antialias: true, alpha: false }}
              onCreated={({ gl }) => gl.setClearColor("#0a0f0d")}
            >
              <ambientLight intensity={0.8} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <pointLight position={[-3, 3, 3]} intensity={0.5} />
              <RobotArm theta1={theta1} theta2={theta2} l1={l1} l2={l2} />
              <SimpleGrid />
              <OrbitControls enablePan={false} maxDistance={6} minDistance={2} />
            </Canvas>
          </Suspense>
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-bg-primary/80 px-2.5 py-1.5 text-xs font-mono text-accent-green backdrop-blur-sm">
            End-effector: ({x.toFixed(2)}, {y.toFixed(2)})
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
