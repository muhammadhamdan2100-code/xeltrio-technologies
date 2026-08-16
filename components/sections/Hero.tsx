"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const HeroCanvas = dynamic(() => import("@/components/canvas/HeroCanvas"), { ssr: false });

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function Hero() {
  return (
    <section id="home" className="relative flex min-h-[100svh] w-full items-center overflow-hidden bg-[color:var(--color-bg-primary)]">
      <div className="grid-lines absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-bg-primary)_78%)]" aria-hidden="true" />
      <HeroCanvas />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pt-[76px] lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-4 py-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent-primary)]" />
            <span className="font-mono-tech text-[12px] tracking-[0.08em] text-[color:var(--color-text-secondary)]">
              AI Product Company
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: EASE }}
            className="font-display text-[42px] font-semibold leading-[1.08] tracking-[-0.02em] text-[color:var(--color-text-primary)] sm:text-[58px] lg:text-[76px]"
          >
            The intelligence layer<br />
            <span className="text-gradient-accent">behind the enterprise.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.28, ease: EASE }}
            className="mx-auto mt-7 max-w-2xl text-[16px] leading-relaxed text-[color:var(--color-text-secondary)] sm:text-[18px]"
          >
            Xeltrio Technologies builds AI-native operating systems for global enterprise —
            one core intelligence, an entire ecosystem of products, starting with BusinessOS
            and EducationOS.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.42, ease: EASE }}
            className="mt-11 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <a
              href="#ecosystem"
              className="rounded-full bg-[color:var(--color-accent-primary)] px-7 py-3.5 text-[14px] font-medium text-[#050816] transition-transform duration-300 hover:scale-[1.03] hover:brightness-110"
            >
              Explore the ecosystem
            </a>
            <a
              href="#about"
              className="rounded-full border border-[color:var(--color-border)] px-7 py-3.5 text-[14px] font-medium text-[color:var(--color-text-primary)] transition-colors duration-300 hover:border-[color:var(--color-accent-primary)]"
            >
              Learn about Xeltrio
            </a>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute inset-x-0 bottom-10 z-10 flex flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="font-mono-tech text-[11px] tracking-[0.14em] text-[color:var(--color-text-muted)]">SCROLL</span>
        <ArrowDown size={14} className="animate-bounce text-[color:var(--color-text-muted)]" />
      </motion.div>
    </section>
  );
}
