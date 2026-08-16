import type { Metadata } from "next";
import { Building2, TrendingUp, Boxes, Landmark } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { INVESTOR_RELATIONS_SECTIONS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Investor Relations — Xeltrio Technologies",
  description:
    "Investor Relations for Xeltrio Technologies — company overview, growth roadmap, future products, and funding vision. Currently in preparation.",
};

const IR_ICONS = [Building2, TrendingUp, Boxes, Landmark];

export default function InvestorRelationsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="INVESTOR RELATIONS"
        title={
          <>
            Investor Relations
            <br />
            is coming soon.
          </>
        }
        description="Xeltrio Technologies is early — this section will hold the information investors need, published as it becomes real rather than promotional."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="mx-auto mb-14 max-w-xl rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-8 text-center">
            <p className="font-mono-tech text-[11px] tracking-[0.1em] text-[color:var(--color-text-muted)]">
              STATUS
            </p>
            <p className="mt-3 font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
              Coming Soon
            </p>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {INVESTOR_RELATIONS_SECTIONS.map((section, i) => {
              const Icon = IR_ICONS[i];
              return (
                <RevealItem key={section.title}>
                  <div className="glass-panel flex h-full items-start gap-5 rounded-2xl p-7">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-accent-primary)]/10 text-[color:var(--color-accent-secondary)]">
                      <Icon size={20} strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                        {section.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                        {section.description}
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
