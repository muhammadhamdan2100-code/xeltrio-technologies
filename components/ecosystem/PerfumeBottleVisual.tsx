"use client";

import Image from "next/image";
import { useRef, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { HM_SIGNATURE_ASSETS } from "@/lib/constants";

/**
 * The official HM Signature bottle photograph — the only bottle asset used
 * anywhere on the site. This component only ever handles premium presentation
 * motion around that real photo. Each motion concern gets its own nested
 * layer (parallax → scroll reveal → float/rotation/hover) so none of them
 * fight over the same transform property on a single element.
 */
export function PerfumeBottleVisual() {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 120, damping: 18 });
  const springY = useSpring(rawY, { stiffness: 120, damping: 18 });
  const parallaxX = useTransform(springX, [-1, 1], [-8, 8]);
  const parallaxY = useTransform(springY, [-1, 1], [-6, 6]);

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
      className="relative mx-auto w-full max-w-[300px]"
    >
      {/* Luxury shadow beneath the bottle */}
      <div
        className="absolute left-1/2 top-[92%] h-8 w-40 -translate-x-1/2 rounded-full opacity-60 blur-2xl"
        style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.55), transparent 75%)" }}
        aria-hidden="true"
      />
      {/* Soft gold luxury glow */}
      <div
        className="pointer-events-none absolute -inset-8 rounded-[2rem] opacity-70 blur-2xl"
        style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(212,175,90,0.28), transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Layer 1 — mouse parallax */}
      <motion.div style={reducedMotion ? undefined : { x: parallaxX, y: parallaxY }}>
        {/* Layer 2 — scroll reveal (settles once, then holds) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Layer 3 — continuous float, slow rotation, hover lift */}
          <motion.div
            animate={reducedMotion ? undefined : { y: [0, -12, 0], rotate: [-2.5, 2.5, -2.5] }}
            whileHover={reducedMotion ? undefined : { scale: 1.035 }}
            transition={reducedMotion ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-[0_35px_70px_rgba(0,0,0,0.55)]">
              <Image
                src={HM_SIGNATURE_ASSETS.bottleImageUrl}
                alt="HM Signature — Mystic Oud Eau de Parfum, the official HM Signature luxury bottle"
                fill
                sizes="(max-width: 768px) 80vw, 300px"
                className="object-cover"
                priority
              />

              {/* Glass shine — a soft diagonal highlight sweeping across the bottle */}
              {!reducedMotion && (
                <motion.div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.28) 50%, transparent 58%)",
                    backgroundSize: "300% 100%",
                    backgroundRepeat: "no-repeat",
                    mixBlendMode: "screen",
                  }}
                  animate={{ backgroundPositionX: ["120%", "-120%"] }}
                  transition={{ duration: 5, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
                />
              )}

              {/* Cool blue accent rim, tying the shot back to Xeltrio's brand palette */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "linear-gradient(200deg, rgba(79,140,255,0.14) 0%, transparent 35%)" }}
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
