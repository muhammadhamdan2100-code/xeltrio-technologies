"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { BUSINESSOS_FLOW_STEPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function FlowDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.3"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.4 });

  return (
    <div ref={containerRef} className="relative pl-10 sm:pl-14">
      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-[color:var(--color-border)] sm:left-[11px]" aria-hidden="true" />
      <motion.div
        className="absolute left-[7px] top-1 w-px origin-top bg-[color:var(--color-accent-primary)] sm:left-[11px]"
        style={{ scaleY: progress, height: "100%" }}
        aria-hidden="true"
      />

      <RevealGroup className="flex flex-col gap-3">
        {BUSINESSOS_FLOW_STEPS.map((step, i) => {
          const isOpen = openIndex === i;
          return (
            <RevealItem key={step.label} className="relative">
              <span
                className={cn(
                  "absolute -left-10 top-6 z-10 flex h-4 w-4 items-center justify-center rounded-full border sm:-left-14",
                  i === 0
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
                <div className="flex items-center gap-4">
                  <span className="font-mono-tech text-xs text-[color:var(--color-accent-secondary)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)] sm:text-xl">
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
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
