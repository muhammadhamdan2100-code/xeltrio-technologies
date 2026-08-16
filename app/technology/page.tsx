import type { Metadata } from "next";
import {
  Brain,
  Sparkles,
  Bot,
  Workflow,
  Repeat,
  Cloud,
  Boxes,
  Building2,
  Layers,
  ShieldCheck,
  TrendingUp,
  Rocket,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { TECHNOLOGY_DEEP_DIVE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Technology — Xeltrio Technologies",
  description:
    "The technology foundation behind the Xeltrio ecosystem — artificial intelligence, machine learning, AI agents, automation, cloud computing, microservices, security, and scalability, engineered as one stack.",
};

const TECH_ICONS = [Brain, Sparkles, Bot, Workflow, Repeat, Cloud, Boxes, Building2, Layers, ShieldCheck, TrendingUp, Rocket];

export default function TechnologyPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="TECHNOLOGY"
        title={
          <>
            The foundation underneath
            <br />
            every product we build.
          </>
        }
        description="Every product in the Xeltrio ecosystem is built on the same technology foundation — engineered once, so intelligence, security, and scale never have to be rebuilt per vertical."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <RevealGroup className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-border-subtle)] sm:grid-cols-2">
            {TECHNOLOGY_DEEP_DIVE.map((pillar, i) => {
              const Icon = TECH_ICONS[i];
              return (
                <RevealItem key={pillar.title}>
                  <div className="flex h-full items-start gap-5 bg-[color:var(--color-bg-secondary)] p-8 transition-colors duration-300 hover:bg-[color:var(--color-bg-elevated)]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-accent-primary)]/10 text-[color:var(--color-accent-secondary)]">
                      <Icon size={20} strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                        {pillar.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>
    </PageShell>
  );
}
