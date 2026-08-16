"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CONTACT_FAQ } from "@/lib/constants";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function ContactFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {CONTACT_FAQ.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.question} className="overflow-hidden rounded-2xl border border-[color:var(--color-border-subtle)]">
            <button
              type="button"
              data-cursor="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className={cn(
                "flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-300",
                isOpen ? "bg-[color:var(--color-bg-elevated)]" : "bg-[color:var(--color-bg-secondary)]"
              )}
            >
              <span className="font-display text-base font-semibold text-[color:var(--color-text-primary)]">
                {item.question}
              </span>
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
                  transition={{ duration: 0.35, ease: EASE }}
                  className="overflow-hidden bg-[color:var(--color-bg-elevated)]"
                >
                  <p className="px-6 pb-6 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
