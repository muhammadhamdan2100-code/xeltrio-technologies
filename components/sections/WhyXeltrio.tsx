import { Cpu, Building2, ShieldCheck, Layers, Rocket, Cloud } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { WHY_XELTRIO } from "@/lib/constants";

const ICONS = [Cpu, Building2, ShieldCheck, Layers, Rocket, Cloud];

export function WhyXeltrio() {
  return (
    <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-28 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <Reveal className="max-w-2xl">
          <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
            WHY XELTRIO
          </span>
          <h2 className="mt-5 font-display text-[34px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[42px]">
            Software built for the organizations<br className="hidden sm:block" /> that can&apos;t afford to get it wrong.
          </h2>
        </Reveal>

        <RevealGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_XELTRIO.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <RevealItem key={item.title}>
                <div className="glass-panel h-full rounded-2xl p-8 transition-transform duration-500 hover:-translate-y-1.5">
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
  );
}
