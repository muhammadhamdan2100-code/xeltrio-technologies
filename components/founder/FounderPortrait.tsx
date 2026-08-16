"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { User } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Renders the founder photo when `photoUrl` is set, or an elegant
 * placeholder when it isn't — the same framing, glow, and floating motion
 * either way, so swapping in a real (or CMS-hosted) photo later never
 * requires a design change, only setting `FOUNDER.photoUrl`.
 */
export function FounderPortrait({ photoUrl, name }: { photoUrl?: string | null; name: string }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[380px]"
      animate={reducedMotion ? undefined : { y: [0, -10, 0] }}
      transition={reducedMotion ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-70 blur-2xl"
        style={{ background: "radial-gradient(ellipse at 50% 35%, rgba(79,140,255,0.35), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="glass-panel relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border-[color:var(--color-accent-primary)]/30 shadow-[0_30px_80px_rgba(5,8,22,0.6)]">
        {photoUrl ? (
          <>
            <Image
              src={photoUrl}
              alt={`${name}, Founder & CEO of Xeltrio Technologies`}
              fill
              sizes="(max-width: 768px) 90vw, 380px"
              className="object-cover"
              priority
            />
            {/* Studio-light treatment: cool blue rim + soft vignette, done in CSS rather than the photo itself */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(155deg, rgba(79,140,255,0.16) 0%, transparent 30%), radial-gradient(ellipse at 50% 100%, rgba(5,8,22,0.65), transparent 60%)",
              }}
              aria-hidden="true"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" aria-hidden="true" />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[color:var(--color-bg-elevated)]">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--color-accent-primary)]/10">
              <User size={32} strokeWidth={1.5} className="text-[color:var(--color-accent-secondary)]" />
            </div>
            <p className="font-mono-tech text-xs tracking-[0.08em] text-[color:var(--color-text-muted)]">
              PORTRAIT COMING SOON
            </p>
          </div>
        )}
      </div>

      {/* Glass reflection accent beneath the frame */}
      <div
        className="pointer-events-none absolute -bottom-3 left-1/2 h-8 w-[85%] -translate-x-1/2 rounded-full opacity-40 blur-xl"
        style={{ background: "radial-gradient(ellipse, rgba(79,140,255,0.4), transparent 75%)" }}
        aria-hidden="true"
      />
    </motion.div>
  );
}
