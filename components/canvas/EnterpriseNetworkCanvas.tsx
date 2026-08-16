"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CanvasErrorBoundary } from "./CanvasErrorBoundary";
import { HeroFallback } from "./HeroFallback";

const EnterpriseNetworkScene = dynamic(() => import("./EnterpriseNetworkScene"), { ssr: false });

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
 * Only ever mounted client-side (imported with `ssr:false` by its parent),
 * so resolving WebGL support during the initial render is safe.
 */
export default function EnterpriseNetworkCanvas() {
  const reducedMotion = useReducedMotion();
  const [webglOk] = useState<boolean>(detectWebGL);

  if (reducedMotion || !webglOk) return <HeroFallback />;

  return (
    <CanvasErrorBoundary fallback={<HeroFallback />}>
      <EnterpriseNetworkScene />
    </CanvasErrorBoundary>
  );
}
