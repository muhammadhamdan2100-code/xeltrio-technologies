"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { EcosystemNode } from "@/lib/constants";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function EcosystemDetailPanel({ node }: { node: EcosystemNode }) {
  return (
    <div className="glass-panel relative min-h-[220px] overflow-hidden rounded-3xl p-8 sm:p-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={node.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)] sm:text-3xl">
              {node.name}
            </h3>
            {node.badge && (
              <span className="rounded-full border border-[color:var(--color-border)] px-3 py-1 font-mono-tech text-[10px] tracking-[0.06em] text-[color:var(--color-accent-secondary)]">
                {node.badge}
              </span>
            )}
          </div>
          <p className="mt-1 font-mono-tech text-xs tracking-[0.06em] text-[color:var(--color-text-muted)]">
            {node.tagline}
          </p>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
            {node.description}
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {node.bullets.map((bullet) => (
              <li
                key={bullet}
                className="rounded-full border border-[color:var(--color-border-subtle)] px-3 py-1.5 text-xs text-[color:var(--color-text-secondary)]"
              >
                {bullet}
              </li>
            ))}
          </ul>

          {node.href && node.linkLabel && (
            <Link
              href={node.href}
              data-cursor="button"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-accent-primary)] px-6 py-3 text-sm font-medium text-[#050816] transition-transform duration-300 hover:scale-[1.03] hover:brightness-110"
            >
              {node.linkLabel}
              <ArrowUpRight size={15} />
            </Link>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
