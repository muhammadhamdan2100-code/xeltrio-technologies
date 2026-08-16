"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Building2, Boxes, Gem, Rocket } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { NodeCard } from "@/components/ecosystem/NodeCard";
import { ConnectionLines } from "@/components/ecosystem/ConnectionLines";
import { EcosystemDetailPanel } from "@/components/ecosystem/EcosystemDetailPanel";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ECOSYSTEM_NODES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NODE_ICONS = [Bot, Building2, Boxes, Gem, Rocket];

/** Evenly spaced points on an ellipse around the center, starting from the top. */
function useRadialPositions(count: number) {
  return useMemo(() => {
    const rx = 42;
    const ry = 36;
    return Array.from({ length: count }, (_, i) => {
      const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
      return { x: 50 + Math.cos(angle) * rx, y: 50 + Math.sin(angle) * ry };
    });
  }, [count]);
}

export function EcosystemHub() {
  const [activeId, setActiveId] = useState(ECOSYSTEM_NODES[0].id);
  const activeIndex = ECOSYSTEM_NODES.findIndex((n) => n.id === activeId);
  const activeNode = ECOSYSTEM_NODES[activeIndex];
  const positions = useRadialPositions(ECOSYSTEM_NODES.length);
  const reducedMotion = useReducedMotion();

  return (
    <section id="our-ecosystem" className="relative overflow-hidden border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-28 lg:py-36">
      <div className="grid-lines absolute inset-0 opacity-30" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[560px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(79,140,255,0.25), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
            OUR ECOSYSTEM
          </span>
          <h2 className="mt-5 font-display text-[34px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[46px]">
            One parent company.
            <br />
            A growing family of brands.
          </h2>
          <p className="mt-6 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)] sm:text-[16px]">
            Xeltrio Technologies isn&apos;t a single product — it&apos;s the company behind an AI
            services agency, an enterprise platform, a growing SaaS ecosystem, and beyond.
          </p>
        </Reveal>

        {/* Desktop radial visualization */}
        <div className="relative mx-auto mt-20 hidden h-[560px] max-w-[1000px] lg:block">
          <ConnectionLines
            center={{ x: 50, y: 50 }}
            points={positions}
            activeIndex={activeIndex}
            animated={!reducedMotion}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel absolute left-1/2 top-1/2 flex w-[220px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-3xl border-[color:var(--color-accent-primary)]/40 p-7 text-center shadow-[0_0_60px_rgba(79,140,255,0.3)]"
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-70"
              style={{ background: "radial-gradient(circle at 50% 30%, rgba(138,180,255,0.18), transparent 70%)" }}
              aria-hidden="true"
            />
            <span className="relative font-display text-base font-semibold tracking-[0.08em] text-[color:var(--color-text-primary)]">
              XELTRIO
            </span>
            <span className="relative font-mono-tech text-[10px] tracking-[0.1em] text-[color:var(--color-text-muted)]">
              TECHNOLOGIES
            </span>
          </motion.div>

          {ECOSYSTEM_NODES.map((node, i) => {
            const Icon = NODE_ICONS[i];
            const pos = positions[i];
            return (
              <div
                key={node.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <NodeCard
                  icon={Icon}
                  name={node.name}
                  tagline={node.tagline}
                  badge={node.badge}
                  active={activeId === node.id}
                  onSelect={() => setActiveId(node.id)}
                  floatDelay={i * 0.3}
                  floatDuration={3.4 + i * 0.35}
                />
              </div>
            );
          })}
        </div>

        {/* Mobile / tablet stacked layout */}
        <div className="mt-16 flex flex-col items-center gap-6 lg:hidden">
          <div className="glass-panel relative flex w-[220px] flex-col items-center gap-1 rounded-3xl border-[color:var(--color-accent-primary)]/40 p-7 text-center shadow-[0_0_50px_rgba(79,140,255,0.25)]">
            <span className="font-display text-base font-semibold tracking-[0.08em] text-[color:var(--color-text-primary)]">
              XELTRIO
            </span>
            <span className="font-mono-tech text-[10px] tracking-[0.1em] text-[color:var(--color-text-muted)]">
              TECHNOLOGIES
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {ECOSYSTEM_NODES.map((node, i) => {
              const Icon = NODE_ICONS[i];
              return (
                <NodeCard
                  key={node.id}
                  icon={Icon}
                  name={node.name}
                  tagline={node.tagline}
                  badge={node.badge}
                  active={activeId === node.id}
                  onSelect={() => setActiveId(node.id)}
                  floatDelay={i * 0.25}
                  floatDuration={3.4 + i * 0.3}
                  className="!w-full"
                />
              );
            })}
          </div>
        </div>

        <div className={cn("mx-auto mt-14 max-w-3xl", "lg:mt-16")}>
          <EcosystemDetailPanel node={activeNode} />
        </div>
      </div>
    </section>
  );
}
