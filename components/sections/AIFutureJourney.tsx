"use client";

import { useMemo, useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { AI_FUTURE_STAGES } from "@/lib/constants";

const STAGE_COUNT = AI_FUTURE_STAGES.length;

/**
 * A fixed-size node network whose deterministic layout is computed once
 * (not on every render, and never inside a hook call) — density and glow
 * respond to scroll progress via a small, fixed set of transforms.
 */
function NetworkVisual({ progress }: { progress: MotionValue<number> }) {
  const nodes = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const radius = 34 + ((i * 37) % 22);
        return { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius };
      }),
    []
  );

  const connectionOpacity = useTransform(progress, [0, 1], [0.06, 0.55]);
  const nodeOpacity = useTransform(progress, [0, 1], [0.25, 1]);
  const nodeScale = useTransform(progress, [0, 1], [0.6, 1.15]);
  const coreScale = useTransform(progress, [0, 1], [0.4, 1]);
  const coreGlow = useTransform(progress, [0, 1], [0.15, 0.6]);

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="ai-future-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#bcd4ff" />
          <stop offset="100%" stopColor="#2452c9" stopOpacity="0" />
        </radialGradient>
      </defs>

      <motion.g style={{ opacity: connectionOpacity }}>
        {nodes.map((node, i) => (
          <line key={`line-${i}`} x1={50} y1={50} x2={node.x} y2={node.y} stroke="#4f8cff" strokeWidth={0.25} />
        ))}
      </motion.g>

      <motion.g style={{ opacity: nodeOpacity, scale: nodeScale }}>
        {nodes.map((node, i) => (
          <circle key={`node-${i}`} cx={node.x} cy={node.y} r={1.4} fill="#8ab4ff" />
        ))}
      </motion.g>

      <motion.circle cx={50} cy={50} r={16} fill="url(#ai-future-core)" style={{ opacity: coreGlow, scale: coreScale }} />
      <motion.circle cx={50} cy={50} r={4.5} fill="#4f8cff" style={{ scale: coreScale }} />
    </svg>
  );
}

/** One stage's text panel — a single, explicit useTransform pair per instance (never inside a loop). */
function StagePanel({
  index,
  label,
  detail,
  scrollYProgress,
}: {
  index: number;
  label: string;
  detail: string;
  scrollYProgress: MotionValue<number>;
}) {
  const start = index / STAGE_COUNT;
  const mid = (index + 0.5) / STAGE_COUNT;
  const end = (index + 1) / STAGE_COUNT;

  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, start - 0.02), start + 0.03, mid, end - 0.03, Math.min(1, end + 0.02)],
    [0, 1, 1, 1, 0]
  );
  const y = useTransform(scrollYProgress, [start, mid, end], [24, 0, -24]);

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0">
      <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
        {String(index + 1).padStart(2, "0")} / {String(STAGE_COUNT).padStart(2, "0")}
      </span>
      <h3 className="mt-5 font-display text-[32px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[44px]">
        {label}
      </h3>
      <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-[color:var(--color-text-secondary)] sm:text-[16px]">
        {detail}
      </p>
    </motion.div>
  );
}

export function AIFutureJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const progressBarScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className="relative" style={{ height: `${STAGE_COUNT * 100}svh` }}>
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden border-y border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)]">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden="true" />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[70vh] w-[70vh] max-w-[90vw]">
            <NetworkVisual progress={scrollYProgress} />
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 lg:px-12">
          <div className="mx-auto max-w-xl text-center">
            {AI_FUTURE_STAGES.map((stage, i) => (
              <StagePanel key={stage.label} index={i} label={stage.label} detail={stage.detail} scrollYProgress={scrollYProgress} />
            ))}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-10 z-10 flex justify-center px-6" aria-hidden="true">
          <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-[color:var(--color-border)]">
            <motion.div
              className="h-full origin-left rounded-full bg-[color:var(--color-accent-primary)]"
              style={{ scaleX: progressBarScale }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
