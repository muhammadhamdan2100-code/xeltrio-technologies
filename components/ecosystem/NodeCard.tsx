"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

type NodeCardProps = {
  icon: LucideIcon;
  name: string;
  tagline: string;
  badge?: string;
  active: boolean;
  onSelect: () => void;
  floatDelay?: number;
  floatDuration?: number;
  className?: string;
};

export function NodeCard({
  icon: Icon,
  name,
  tagline,
  badge,
  active,
  onSelect,
  floatDelay = 0,
  floatDuration = 3.6,
  className,
}: NodeCardProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      data-cursor="button"
      aria-pressed={active}
      animate={
        reducedMotion
          ? undefined
          : { y: [0, -8, 0] }
      }
      transition={
        reducedMotion
          ? undefined
          : { duration: floatDuration, delay: floatDelay, repeat: Infinity, ease: "easeInOut" }
      }
      className={cn(
        "glass-panel group flex w-[200px] flex-col items-start gap-2.5 rounded-2xl p-4 text-left transition-all duration-300 sm:w-[220px]",
        active
          ? "border-[color:var(--color-accent-primary)]/60 shadow-[0_0_28px_rgba(79,140,255,0.28)]"
          : "hover:border-[color:var(--color-accent-primary)]/35 hover:shadow-[0_0_20px_rgba(79,140,255,0.16)]",
        className
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-300",
            active ? "bg-[color:var(--color-accent-primary)]/20" : "bg-[color:var(--color-accent-primary)]/10"
          )}
        >
          <Icon size={17} strokeWidth={1.75} className="text-[color:var(--color-accent-secondary)]" />
        </div>
        {badge && (
          <span className="rounded-full border border-[color:var(--color-border)] px-2 py-0.5 font-mono-tech text-[9px] tracking-[0.06em] text-[color:var(--color-text-muted)]">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="font-display text-sm font-semibold text-[color:var(--color-text-primary)]">{name}</p>
        <p className="mt-0.5 text-xs leading-snug text-[color:var(--color-text-muted)]">{tagline}</p>
      </div>
    </motion.button>
  );
}
