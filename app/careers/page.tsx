import type { Metadata } from "next";
import { Users, Lightbulb, GraduationCap, TrendingUp } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { CAREERS_PILLARS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Careers — Xeltrio Technologies",
  description:
    "What it's like to build at Xeltrio Technologies — culture, innovation, learning, and future growth. Open roles will be posted here as the team grows.",
};

const CAREERS_ICONS = [Users, Lightbulb, GraduationCap, TrendingUp];

export default function CareersPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="CAREERS"
        title={
          <>
            Building the team
            <br />
            behind the ecosystem.
          </>
        }
        description="Xeltrio isn't hiring at scale yet — but here's the culture the team is being built around, so you know what you'd be joining before a single role is posted."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {CAREERS_PILLARS.map((pillar, i) => {
              const Icon = CAREERS_ICONS[i];
              return (
                <RevealItem key={pillar.title}>
                  <div className="glass-panel h-full rounded-2xl p-8">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-accent-primary)]/10 text-[color:var(--color-accent-secondary)]">
                      <Icon size={20} strokeWidth={1.75} />
                    </div>
                    <h3 className="mt-6 font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                      {pillar.description}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>

          <Reveal delay={0.1} className="mt-14 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-8 text-center sm:p-10">
            <p className="font-mono-tech text-[11px] tracking-[0.1em] text-[color:var(--color-text-muted)]">
              OPEN ROLES
            </p>
            <p className="mt-3 font-display text-lg font-semibold text-[color:var(--color-text-primary)] sm:text-xl">
              No open positions right now — check back as BusinessOS moves from development into launch.
            </p>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
