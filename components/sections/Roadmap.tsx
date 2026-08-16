"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { ROADMAP_STEPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Roadmap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.75", "end 0.4"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.4 });

  return (
    <section id="roadmap" className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-28 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <Reveal className="max-w-2xl">
          <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
            ROADMAP
          </span>
          <h2 className="mt-5 font-display text-[34px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[42px]">
            From corporate launch to global ecosystem.
          </h2>
        </Reveal>

        <div ref={containerRef} className="relative mt-20 pl-10 sm:pl-14">
          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-[color:var(--color-border)] sm:left-[11px]" aria-hidden="true" />
          <motion.div
            className="absolute left-[7px] top-1 w-px origin-top bg-[color:var(--color-accent-primary)] sm:left-[11px]"
            style={{ scaleY: progress, height: "100%" }}
            aria-hidden="true"
          />

          <ol className="flex flex-col gap-14">
            {ROADMAP_STEPS.map((step) => (
              <li key={step.label} className="relative">
                <span
                  className={cn(
                    "absolute -left-10 top-0.5 flex h-4 w-4 items-center justify-center rounded-full border sm:-left-14",
                    step.status === "current"
                      ? "border-[color:var(--color-accent-primary)] bg-[color:var(--color-accent-primary)]"
                      : "border-[color:var(--color-border)] bg-[color:var(--color-bg-secondary)]"
                  )}
                />
                <p className="font-mono-tech text-[11px] uppercase tracking-[0.1em] text-[color:var(--color-text-muted)]">
                  {step.status === "current" ? "Now" : step.status === "next" ? "Next" : "Future"}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-[color:var(--color-text-primary)] sm:text-2xl">
                  {step.label}
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <Reveal delay={0.1} className="mt-14 flex justify-center">
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-6 py-3 text-sm font-medium text-[color:var(--color-text-primary)] transition-all duration-300 hover:border-[color:var(--color-accent-primary)] hover:bg-[color:var(--color-accent-primary)]/10"
          >
            View the interactive roadmap
            <ArrowUpRight size={15} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
