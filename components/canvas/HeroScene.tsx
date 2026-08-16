"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createCoreMaterial, type CoreShaderMaterial } from "./coreMaterial";

const ACCENT = "#4f8cff";
const ACCENT_BRIGHT = "#bcd4ff";

/** Pointer + scroll progress bridge, mutated outside React for zero re-renders. */
type SceneDriver = { x: number; y: number; scroll: number };

function useSceneDriver(): RefObject<SceneDriver> {
  const driver = useRef<SceneDriver>({ x: 0, y: 0, scroll: 0 });

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      driver.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      driver.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      driver.current.scroll = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return driver;
}

function DigitalCore({ driver }: { driver: RefObject<SceneDriver> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<CoreShaderMaterial | null>(null);
  if (matRef.current === null) matRef.current = createCoreMaterial();

  useLayoutEffect(() => {
    const material = matRef.current;
    if (meshRef.current && material) meshRef.current.material = material;
    return () => material?.dispose();
  }, []);

  useFrame((state, delta) => {
    const d = driver.current;
    const material = matRef.current;
    if (material) material.uniforms.uTime.value += delta;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.08;
      meshRef.current.rotation.x += delta * 0.02;
    }
    if (groupRef.current) {
      const targetX = d.y * 0.25;
      const targetY = d.x * 0.35;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.04);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.04);
    }
    const s = state.camera.position;
    s.z = THREE.MathUtils.lerp(s.z, 5.4 - d.scroll * 1.6, 0.06);
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.15, 12]} />
      </mesh>
      <mesh scale={1.24}>
        <icosahedronGeometry args={[1.15, 2]} />
        <meshBasicMaterial color={ACCENT} wireframe transparent opacity={0.06} />
      </mesh>
    </group>
  );
}

const ORBITAL_RINGS = [
  { radius: 2.05, tilt: 0.55, speed: 0.05, nodes: 5 },
  { radius: 2.55, tilt: -0.35, speed: -0.035, nodes: 7 },
  { radius: 3.05, tilt: 0.15, speed: 0.025, nodes: 9 },
] as const;

/** Circuit-style orbital rings echoing the logo's traced-line, node-terminated icon language. */
function OrbitalRings() {
  const ringGroup = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ringGroup.current) return;
    ringGroup.current.children.forEach((child, i) => {
      child.rotation.z += ORBITAL_RINGS[i].speed * delta * 8;
    });
  });

  return (
    <group ref={ringGroup} rotation={[0.3, 0, 0]}>
      {ORBITAL_RINGS.map((ring, i) => (
        <group key={i} rotation={[ring.tilt, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[ring.radius, 0.004, 8, 96]} />
            <meshBasicMaterial color={ACCENT} transparent opacity={0.22} />
          </mesh>
          {Array.from({ length: ring.nodes }).map((_, n) => {
            const angle = (n / ring.nodes) * Math.PI * 2;
            const x = Math.cos(angle) * ring.radius;
            const z = Math.sin(angle) * ring.radius;
            return (
              <mesh key={n} position={[x, 0, z]}>
                <sphereGeometry args={[0.028, 12, 12]} />
                <meshBasicMaterial color={n % 3 === 0 ? ACCENT_BRIGHT : ACCENT} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

/**
 * Generated once at module scope (not inside a component render) so the
 * particle field is a stable, pure constant rather than a render-time
 * side effect.
 */
function generateParticlePositions(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  let seed = 1337;
  const rand = () => {
    // Deterministic LCG — avoids calling Math.random during render.
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < count; i++) {
    const r = 6 + rand() * 9;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(rand() * 2 - 1);
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
}

const PARTICLE_POSITIONS = generateParticlePositions(900);

function ParticleField() {
  const points = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * 0.006;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[PARTICLE_POSITIONS, 3]} />
      </bufferGeometry>
      <pointsMaterial color={ACCENT_BRIGHT} size={0.02} sizeAttenuation transparent opacity={0.5} />
    </points>
  );
}

function CameraRig() {
  const { camera } = useThree();
  useFrame(() => {
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene() {
  const driver = useSceneDriver();
  const dpr = useMemo(() => Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2), []);

  return (
    <Canvas
      dpr={[1, dpr]}
      camera={{ position: [0, 0, 5.4], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 3, 5]} intensity={40} color="#8ab4ff" />
      <pointLight position={[-5, -3, -4]} intensity={18} color="#2452c9" />
      <DigitalCore driver={driver} />
      <OrbitalRings />
      <ParticleField />
      <CameraRig />
      <fog attach="fog" args={["#050816", 6, 15]} />
    </Canvas>
  );
}
