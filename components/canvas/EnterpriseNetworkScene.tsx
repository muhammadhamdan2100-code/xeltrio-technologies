"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createCoreMaterial, type CoreShaderMaterial } from "./coreMaterial";

const ACCENT = "#4f8cff";
const ACCENT_BRIGHT = "#bcd4ff";
const NODE_COUNT = 6;

type Driver = { x: number; y: number };

function useDriver(): RefObject<Driver> {
  const driver = useRef<Driver>({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      driver.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      driver.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return driver;
}

/** The central BusinessOS core — same shader language as the homepage hero, smaller and calmer. */
function CoreNode() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<CoreShaderMaterial | null>(null);
  if (matRef.current === null) matRef.current = createCoreMaterial();

  useLayoutEffect(() => {
    const material = matRef.current;
    if (meshRef.current && material) meshRef.current.material = material;
    return () => material?.dispose();
  }, []);

  useFrame((_, delta) => {
    const material = matRef.current;
    if (material) material.uniforms.uTime.value += delta;
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.1;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.62, 10]} />
    </mesh>
  );
}

const NODES = Array.from({ length: NODE_COUNT }, (_, i) => {
  const angle = (i / NODE_COUNT) * Math.PI * 2;
  const radius = 2.3;
  const height = i % 2 === 0 ? 0.4 : -0.4;
  return {
    position: new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius),
    phase: i * 0.7,
  };
});

/** Module nodes connected to the core, with pulses of light traveling along each connection. */
function ModuleNetwork() {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.05;

    const t = state.clock.elapsedTime;
    NODES.forEach((node, i) => {
      const pulse = pulseRefs.current[i];
      if (!pulse) return;
      const progress = (t * 0.35 + node.phase) % 1;
      pulse.position.lerpVectors(new THREE.Vector3(0, 0, 0), node.position, progress);
      const mat = pulse.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(progress * Math.PI);
    });
  });

  return (
    <group ref={groupRef}>
      {NODES.map((node, i) => (
        <group key={i}>
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={(geometry: THREE.BufferGeometry) => {
                geometry.setFromPoints([new THREE.Vector3(0, 0, 0), node.position]);
              }}
            />
            <lineBasicMaterial attach="material" color={ACCENT} transparent opacity={0.25} />
          </line>
          <mesh position={node.position}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color={ACCENT_BRIGHT} />
          </mesh>
          <mesh
            ref={(el) => {
              pulseRefs.current[i] = el;
            }}
          >
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshBasicMaterial color={ACCENT_BRIGHT} transparent opacity={0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Rig({ driver }: { driver: RefObject<Driver> }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current) return;
    const d = driver.current;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, d.y * 0.15, 0.04);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, d.x * 0.2, 0.04);
  });
  return (
    <group ref={groupRef}>
      <CoreNode />
      <ModuleNetwork />
    </group>
  );
}

export default function EnterpriseNetworkScene() {
  const driver = useDriver();
  const dpr = useMemo(() => Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2), []);

  return (
    <Canvas
      dpr={[1, dpr]}
      camera={{ position: [0, 1.1, 5.2], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 2, 4]} intensity={30} color="#8ab4ff" />
      <pointLight position={[-4, -2, -3]} intensity={14} color="#2452c9" />
      <Rig driver={driver} />
      <fog attach="fog" args={["#050816", 5, 12]} />
    </Canvas>
  );
}
