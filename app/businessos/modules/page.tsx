import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { ProductGlyph } from "@/components/ui/ProductGlyph";
import { BUSINESSOS_MODULES_GRID } from "@/lib/constants";

export const metadata: Metadata = {
  title: "BusinessOS Modules — Xeltrio Technologies",
  description:
    "Every module inside BusinessOS — vertical operating systems like EducationOS and HospitalOS, and core modules like CRM, HRMS, Finance, and Projects.",
};

export default function BusinessOSModulesPage() {
  return (
    <>
      <PageHeader
        compact
        eyebrow="MODULES"
        title={
          <>
            Eighteen modules.
            <br />
            One shared core.
          </>
        }
        description="Vertical operating systems and core business modules, all running on the same AI orchestration layer underneath."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BUSINESSOS_MODULES_GRID.map((mod, i) => (
              <RevealItem key={mod.name}>
                <div className="glass-panel group flex h-full flex-col rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-[color:var(--color-accent-primary)]/40">
                  <ProductGlyph seed={i + 1} />
                  <div className="mt-6 flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                      {mod.name}
                    </h3>
                    <span className="whitespace-nowrap rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-mono-tech text-[10px] tracking-[0.06em] text-[color:var(--color-accent-secondary)]">
                      Coming Soon
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                    {mod.description}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </>
  );
}
