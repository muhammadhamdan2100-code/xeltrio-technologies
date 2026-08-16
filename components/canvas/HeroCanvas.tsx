"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CanvasErrorBoundary } from "./CanvasErrorBoundary";
import { HeroFallback } from "./HeroFallback";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

function detectWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * This component is only ever mounted client-side (its parent imports it
 * with `ssr:false`), so it is safe to resolve WebGL support during the
 * initial render rather than gating on a post-mount effect.
 */
export default function HeroCanvas() {
  const reducedMotion = useReducedMotion();
  const [webglOk] = useState<boolean>(detectWebGL);

  if (reducedMotion || !webglOk) return <HeroFallback />;

  return (
    <CanvasErrorBoundary fallback={<HeroFallback />}>
      <HeroScene />
    </CanvasErrorBoundary>
  );
}
