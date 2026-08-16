import type { Metadata } from "next";
import { ShieldCheck, KeyRound, Lock, FileLock2, Cloud, DatabaseBackup, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { SECURITY_PILLARS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Security — Xeltrio Technologies",
  description:
    "BusinessOS's security architecture — authentication, authorization, encryption, cloud infrastructure, backup, and the compliance standards it's built toward.",
};

const SECURITY_ICONS = [ShieldCheck, KeyRound, Lock, FileLock2, Cloud, DatabaseBackup, ScrollText];

export default function SecurityPage() {
  return (
    <>
      <PageHeader
        compact
        eyebrow="SECURITY"
        title={
          <>
            Security as architecture,
            <br />
            not an afterthought.
          </>
        }
        description="Every institution running BusinessOS is trusting it with real operational data. Here's how that trust is engineered in, not bolted on."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <RevealGroup className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-border-subtle)] sm:grid-cols-2">
            {SECURITY_PILLARS.map((pillar, i) => {
              const Icon = SECURITY_ICONS[i];
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
    </>
  );
}
