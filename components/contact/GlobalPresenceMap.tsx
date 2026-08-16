"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GLOBAL_PRESENCE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const FUTURE_POSITIONS = [
  { x: 74, y: 32 },
  { x: 50, y: 20 },
  { x: 22, y: 34 },
  { x: 66, y: 62 },
  { x: 84, y: 58 },
];

export function GlobalPresenceMap() {
  const [activeCity, setActiveCity] = useState(GLOBAL_PRESENCE.current.city);
  const allCities = [GLOBAL_PRESENCE.current, ...GLOBAL_PRESENCE.future];
  const activeEntry = allCities.find((c) => c.city === activeCity) ?? GLOBAL_PRESENCE.current;

  return (
    <div className="glass-panel relative overflow-hidden rounded-3xl p-8 sm:p-10">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />

      <div className="relative flex items-center justify-between gap-4">
        <div>
          <span className="font-mono-tech text-[11px] tracking-[0.1em] text-[color:var(--color-text-muted)]">
            GLOBAL PRESENCE — ILLUSTRATIVE, NOT A LITERAL MAP
          </span>
        </div>
        <span className="rounded-full border border-[color:var(--color-border)] px-3 py-1 font-mono-tech text-[10px] tracking-[0.06em] text-[color:var(--color-accent-secondary)]">
          Coming Soon
        </span>
      </div>

      <div className="relative mt-10 h-[280px] sm:h-[340px]">
        <svg viewBox="0 0 100 80" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="presence-line" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f8cff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4f8cff" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {FUTURE_POSITIONS.map((pos, i) => (
            <line key={i} x1={38} y1={44} x2={pos.x} y2={pos.y} stroke="url(#presence-line)" strokeWidth={0.3} />
          ))}
        </svg>

        {/* Pakistan — current hub */}
        <button
          type="button"
          data-cursor="button"
          onClick={() => setActiveCity(GLOBAL_PRESENCE.current.city)}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: "38%", top: "55%" }}
        >
          <motion.span
            animate={{ boxShadow: ["0 0 0 0 rgba(79,140,255,0.5)", "0 0 0 14px rgba(79,140,255,0)"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full border-2",
              activeCity === GLOBAL_PRESENCE.current.city
                ? "border-[color:var(--color-accent-secondary)] bg-[color:var(--color-accent-primary)]"
                : "border-[color:var(--color-accent-primary)] bg-[color:var(--color-accent-primary)]"
            )}
          />
          <span className="mt-2 block whitespace-nowrap font-mono-tech text-[10px] tracking-[0.04em] text-[color:var(--color-text-primary)]">
            {GLOBAL_PRESENCE.current.city}
          </span>
        </button>

        {GLOBAL_PRESENCE.future.map((entry, i) => {
          const pos = FUTURE_POSITIONS[i];
          return (
            <button
              key={entry.city}
              type="button"
              data-cursor="button"
              onClick={() => setActiveCity(entry.city)}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <span
                className={cn(
                  "block h-2.5 w-2.5 rounded-full border transition-colors duration-300",
                  activeCity === entry.city
                    ? "border-[color:var(--color-accent-secondary)] bg-[color:var(--color-accent-secondary)]"
                    : "border-[color:var(--color-border)] bg-[color:var(--color-bg-secondary)]"
                )}
              />
              <span className="mt-2 block whitespace-nowrap font-mono-tech text-[10px] tracking-[0.04em] text-[color:var(--color-text-muted)]">
                {entry.city}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative mt-6 border-t border-[color:var(--color-border-subtle)] pt-6 text-center">
        <p className="font-mono-tech text-[11px] tracking-[0.08em] text-[color:var(--color-text-muted)]">
          {activeEntry.status === "current" ? "CURRENT HEADQUARTERS" : "FUTURE OFFICE"}
        </p>
        <p className="mt-1.5 font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
          {activeEntry.city}
        </p>
      </div>
    </div>
  );
}
