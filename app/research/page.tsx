import type { Metadata } from "next";
import { Cpu, Building2, Rocket, BarChart3, Bot, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { RESEARCH_AREAS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Research & Development — Xeltrio Technologies",
  description:
    "What Xeltrio Technologies is researching — artificial intelligence, enterprise software, future automation, business intelligence, AI employees, and digital transformation.",
};

const RESEARCH_ICONS = [Cpu, Building2, Rocket, BarChart3, Bot, Sparkles];

export default function ResearchPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="RESEARCH & DEVELOPMENT"
        title={
          <>
            Built on continuous research,
            <br />
            not a single launch.
          </>
        }
        description="BusinessOS isn't a fixed product. It's the output of ongoing research into how AI, automation, and enterprise software actually intersect in practice."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RESEARCH_AREAS.map((area, i) => {
              const Icon = RESEARCH_ICONS[i];
              return (
                <RevealItem key={area.title}>
                  <div className="glass-panel h-full rounded-2xl p-7 transition-transform duration-500 hover:-translate-y-1.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-accent-primary)]/10 text-[color:var(--color-accent-secondary)]">
                      <Icon size={20} strokeWidth={1.75} />
                    </div>
                    <h3 className="mt-6 font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                      {area.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                      {area.description}
                    </p>
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
