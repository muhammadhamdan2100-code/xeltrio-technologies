"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { HM_SIGNATURE_ASSETS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * The official HM Signature logo. The shimmer is a gradient layer masked
 * to the logo's own alpha shape (via `mask-image`), so the gold sweep only
 * ever plays across the lettering itself — never a flashy full-box effect.
 */
export function HMSignatureLogo({ className, width = 200 }: { className?: string; width?: number }) {
  const reducedMotion = useReducedMotion();
  const maskStyle = {
    WebkitMaskImage: `url(${HM_SIGNATURE_ASSETS.logoImageUrl})`,
    maskImage: `url(${HM_SIGNATURE_ASSETS.logoImageUrl})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  } as const;

  return (
    <motion.div
      className={cn("relative", className)}
      style={{ width, aspectRatio: "760 / 580" }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- masked shimmer needs a plain <img> under a CSS mask, not next/image's wrapper */}
      <img
        src={HM_SIGNATURE_ASSETS.logoImageUrl}
        alt="HM Signature — Haute Parfumerie"
        className="h-full w-full object-contain"
        loading="lazy"
      />

      {!reducedMotion && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            ...maskStyle,
            backgroundImage: "linear-gradient(100deg, transparent 35%, rgba(255,255,255,0.85) 50%, transparent 65%)",
            backgroundSize: "260% 100%",
            backgroundRepeat: "no-repeat",
            mixBlendMode: "overlay",
          }}
          animate={{ backgroundPositionX: ["140%", "-140%"] }}
          transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}
