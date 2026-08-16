import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { GLOBAL_EXPANSION_PHASES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Global Expansion — Xeltrio Technologies",
  description:
    "Xeltrio Technologies' path to global scale — starting in Pakistan, expanding across South Asia and the Middle East, and building toward a global enterprise platform.",
};

export default function GlobalExpansionPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="GLOBAL EXPANSION"
        title={
          <>
            Built in Pakistan.
            <br />
            Built for the world.
          </>
        }
        description="Xeltrio starts in the market its founder understands best, then earns its way outward — the same platform, one region at a time."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1000px] px-6 lg:px-12">
          <RevealGroup className="flex flex-col gap-6">
            {GLOBAL_EXPANSION_PHASES.map((phase) => (
              <RevealItem key={phase.phase}>
                <div className="glass-panel flex flex-col gap-4 rounded-2xl p-8 sm:flex-row sm:items-center sm:gap-8">
                  <div className="sm:w-40 sm:shrink-0">
                    <span className="font-mono-tech text-[11px] tracking-[0.1em] text-[color:var(--color-text-muted)]">
                      {phase.phase}
                    </span>
                    <h3 className="mt-1 font-display text-xl font-semibold text-[color:var(--color-text-primary)]">
                      {phase.region}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-[color:var(--color-text-secondary)] sm:max-w-lg">
                    {phase.detail}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              WHY THIS ORDER
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              Depth before breadth.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
              Every new market adds compliance, language, and operational nuance BusinessOS has to
              actually get right — not just translate. Expanding region by region, after proving
              the platform works in the market Xeltrio knows best, is slower than a global launch
              on day one. It&apos;s also the version that doesn&apos;t break.
            </p>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
