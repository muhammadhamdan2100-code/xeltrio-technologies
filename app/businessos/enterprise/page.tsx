import type { Metadata } from "next";
import { Building2, UserCog, CheckCircle2, ScrollText, Plug, Layers } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { ENTERPRISE_FEATURES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Enterprise Features — Xeltrio Technologies",
  description:
    "The enterprise-grade guarantees behind BusinessOS — multi-tenant isolation, granular role management, approval workflows, audit-readiness, and deployment flexibility.",
};

const ENTERPRISE_ICONS = [Building2, UserCog, CheckCircle2, ScrollText, Plug, Layers];

export default function EnterpriseFeaturesPage() {
  return (
    <>
      <PageHeader
        compact
        eyebrow="ENTERPRISE FEATURES"
        title={
          <>
            Built for the complexity
            <br />
            real institutions run on.
          </>
        }
        description="Features are one thing. Running reliably across departments, branches, and roles at institutional scale is another — this is what BusinessOS guarantees at that level."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ENTERPRISE_FEATURES.map((item, i) => {
              const Icon = ENTERPRISE_ICONS[i];
              return (
                <RevealItem key={item.title}>
                  <div className="glass-panel h-full rounded-2xl p-7 transition-transform duration-500 hover:-translate-y-1.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-accent-primary)]/10 text-[color:var(--color-accent-secondary)]">
                      <Icon size={20} strokeWidth={1.75} />
                    </div>
                    <h3 className="mt-6 font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                      {item.description}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>
    </>
  );
}
