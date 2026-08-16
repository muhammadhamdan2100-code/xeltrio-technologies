"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { ROADMAP_STEPS, ROADMAP_YEAR } from "@/lib/constants";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type RoadmapStep = {
  label: string;
  status: string;
  detail: string;
};

type RoadmapTimelineProps = {
  steps?: RoadmapStep[];
  year?: string;
};

export function RoadmapTimeline({ steps = ROADMAP_STEPS, year = ROADMAP_YEAR }: RoadmapTimelineProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="relative pl-10 sm:pl-14">
      <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-4 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent-primary)]" />
        <span className="font-mono-tech text-[12px] tracking-[0.08em] text-[color:var(--color-text-secondary)]">
          {year} AND BEYOND
        </span>
      </div>

      <div className="absolute left-[7px] top-[76px] bottom-1 w-px bg-[color:var(--color-border)] sm:left-[11px]" aria-hidden="true" />

      <RevealGroup className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const isOpen = openIndex === i;
          return (
            <RevealItem key={step.label} className="relative">
              <span
                className={cn(
                  "absolute -left-10 top-6 z-10 flex h-4 w-4 items-center justify-center rounded-full border sm:-left-14",
                  step.status === "current"
                    ? "border-[color:var(--color-accent-primary)] bg-[color:var(--color-accent-primary)]"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-bg-secondary)]"
                )}
              />
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                data-cursor="button"
                className={cn(
                  "glass-panel flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-5 text-left transition-colors duration-300",
                  isOpen && "border-[color:var(--color-accent-primary)]/40"
                )}
                aria-expanded={isOpen}
              >
                <div>
                  <p className="font-mono-tech text-[11px] uppercase tracking-[0.1em] text-[color:var(--color-text-muted)]">
                    {step.status === "current" ? "Now" : step.status === "next" ? "Next" : "Future"}
                  </p>
                  <h3 className="mt-1.5 font-display text-lg font-semibold text-[color:var(--color-text-primary)] sm:text-xl">
                    {step.label}
                  </h3>
                </div>
                <ChevronDown
                  size={18}
                  className={cn(
                    "shrink-0 text-[color:var(--color-text-muted)] transition-transform duration-300",
                    isOpen && "rotate-180 text-[color:var(--color-accent-secondary)]"
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 pt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)] sm:max-w-xl">
                      {step.detail}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </div>
  );
}
