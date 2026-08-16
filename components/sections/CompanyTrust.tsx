import { ShieldCheck, Target, Compass, Lock, Lightbulb, Building2, ScrollText, Globe2 } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { COMPANY_TRUST_PILLARS } from "@/lib/constants";

const TRUST_ICONS = [Target, Compass, ShieldCheck, Lock, Lightbulb, Building2, ScrollText, Globe2];

export function CompanyTrust() {
  return (
    <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-28 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
            COMPANY TRUST
          </span>
          <h2 className="mt-5 font-display text-[34px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[42px]">
            What we hold ourselves to.
          </h2>
        </Reveal>

        <RevealGroup className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-border-subtle)] sm:grid-cols-2 lg:grid-cols-4">
          {COMPANY_TRUST_PILLARS.map((pillar, i) => {
            const Icon = TRUST_ICONS[i];
            return (
              <RevealItem key={pillar.title}>
                <div className="flex h-full flex-col bg-[color:var(--color-bg-primary)] p-7 transition-colors duration-300 hover:bg-[color:var(--color-bg-elevated)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--color-accent-primary)]/10 text-[color:var(--color-accent-secondary)]">
                    <Icon size={18} strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-5 font-display text-base font-semibold text-[color:var(--color-text-primary)]">
                    {pillar.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                    {pillar.description}
                  </p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
