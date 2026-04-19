"use client";

import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { VizErrorBoundary } from "./VizErrorBoundary";

function solveIK(
  l1: number,
  l2: number,
  tx: number,
  ty: number
): { theta1: number; theta2: number; reachable: boolean } {
  const dist = tx * tx + ty * ty;
  const cosT2 = (dist - l1 * l1 - l2 * l2) / (2 * l1 * l2);
  if (Math.abs(cosT2) > 1)
    return { theta1: 0, theta2: 0, reachable: false };
  const theta2 = Math.atan2(Math.sqrt(1 - cosT2 * cosT2), cosT2);
  const theta1 =
    Math.atan2(ty, tx) -
    Math.atan2(l2 * Math.sin(theta2), l1 + l2 * Math.cos(theta2));
  return { theta1, theta2, reachable: true };
}

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
    geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    ref.current.geometry = geo;
  }, []);
  return (
    <lineSegments ref={ref}>
      <bufferGeometry />
      <lineBasicMaterial color="#1e3a2a" transparent opacity={0.5} />
    </lineSegments>
  );
}

function ClickPlane({
  onClickPosition,
}: {
  onClickPosition: (x: number, y: number) => void;
}) {
  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onClickPosition(e.point.x, e.point.y);
    },
    [onClickPosition]
  );

  return (
    <mesh position={[0, 0, -0.1]} onClick={handleClick}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ArmWithIK({
  targetX,
  targetY,
  l1,
  l2,
}: {
  targetX: number;
  targetY: number;
  l1: number;
  l2: number;
}) {
  const { theta1, theta2, reachable } = solveIK(l1, l2, targetX, targetY);
  const joint1Ref = useRef<THREE.Group>(null);
  const joint2Ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!reachable) return;
    if (joint1Ref.current) joint1Ref.current.rotation.z = theta1;
    if (joint2Ref.current) joint2Ref.current.rotation.z = theta2;
  });

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.1, 32]} />
        <meshStandardMaterial color="#374151" />
      </mesh>

      {reachable && (
        <group ref={joint1Ref}>
          <mesh>
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
      )}

      <mesh position={[targetX, targetY, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={reachable ? "#ef4444" : "#6b7280"}
          emissive={reachable ? "#ef4444" : "#6b7280"}
          emissiveIntensity={0.4}
        />
      </mesh>
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

export default function InverseKinematicsViz() {
  const [target, setTarget] = useState({ x: 1.2, y: 0.8 });
  const l1 = 1;
  const l2 = 0.8;

  const { theta1, theta2, reachable } = solveIK(l1, l2, target.x, target.y);

  const handleClick = useCallback((x: number, y: number) => {
    setTarget({ x, y });
  }, []);

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
              <ArmWithIK targetX={target.x} targetY={target.y} l1={l1} l2={l2} />
              <ClickPlane onClickPosition={handleClick} />
              <SimpleGrid />
              <OrbitControls
                enablePan={false}
                maxDistance={6}
                minDistance={2}
                enableRotate={false}
              />
            </Canvas>
          </Suspense>
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-bg-primary/80 px-2.5 py-1.5 backdrop-blur-sm">
            <div className="text-xs font-mono">
              <span className="text-text-muted">Target: </span>
              <span className="text-text-secondary">
                ({target.x.toFixed(2)}, {target.y.toFixed(2)})
              </span>
              {reachable ? (
                <>
                  <span className="ml-3 text-text-muted">Angles: </span>
                  <span className="text-accent-green">
                    {((theta1 * 180) / Math.PI).toFixed(1)}&deg;,{" "}
                    {((theta2 * 180) / Math.PI).toFixed(1)}&deg;
                  </span>
                </>
              ) : (
                <span className="ml-3 text-error">Unreachable</span>
              )}
            </div>
          </div>
          <div className="pointer-events-none absolute top-3 left-3 rounded-md bg-bg-primary/80 px-2 py-1 text-[11px] text-text-muted backdrop-blur-sm">
            Click anywhere to set target position
          </div>
        </div>
      </div>
    </VizErrorBoundary>
  );
}
