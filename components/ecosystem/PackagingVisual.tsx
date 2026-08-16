"use client";

import Image from "next/image";
import { useRef, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { HM_SIGNATURE_ASSETS } from "@/lib/constants";

/**
 * The official HM Signature packaging photograph — the only packaging
 * asset used anywhere on the site. Presentation motion only: fade/float
 * reveal, a subtle mouse-driven 3D tilt, hover elevation, and a soft
 * reflection sweep across the lid.
 */
export function PackagingVisual() {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 140, damping: 16 });
  const springY = useSpring(rawY, { stiffness: 140, damping: 16 });
  const tiltX = useTransform(springY, [-1, 1], [6, -6]);
  const tiltY = useTransform(springX, [-1, 1], [-6, 6]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    rawX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    rawY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto w-full max-w-[340px]"
      style={{ perspective: 900 }}
    >
      <div
        className="absolute left-1/2 top-[88%] h-8 w-48 -translate-x-1/2 rounded-full opacity-55 blur-2xl"
        style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 75%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -inset-8 rounded-[2rem] opacity-60 blur-2xl"
        style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(212,175,90,0.24), transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Scroll reveal */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Gentle float + hover elevation */}
        <motion.div
          animate={reducedMotion ? undefined : { y: [0, -9, 0] }}
          whileHover={reducedMotion ? undefined : { y: -6, scale: 1.02 }}
          transition={reducedMotion ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Mouse tilt */}
          <motion.div style={reducedMotion ? undefined : { rotateX: tiltX, rotateY: tiltY }}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_30px_65px_rgba(0,0,0,0.55)]">
              <Image
                src={HM_SIGNATURE_ASSETS.packagingImageUrl}
                alt="HM Signature — official luxury packaging box"
                fill
                sizes="(max-width: 768px) 85vw, 340px"
                className="object-cover"
              />

              {/* Reflection sweep across the lid */}
              {!reducedMotion && (
                <motion.div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.2) 50%, transparent 58%)",
                    backgroundSize: "300% 100%",
                    backgroundRepeat: "no-repeat",
                    mixBlendMode: "screen",
                  }}
                  animate={{ backgroundPositionX: ["120%", "-120%"] }}
                  transition={{ duration: 5.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                />
              )}

              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "linear-gradient(200deg, rgba(79,140,255,0.12) 0%, transparent 35%)" }}
                aria-hidden="true"
              />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" aria-hidden="true" />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
