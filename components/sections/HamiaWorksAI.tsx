import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { HAMIAWORKS_SERVICES } from "@/lib/constants";

export function HamiaWorksAI() {
  return (
    <section id="hamiaworks" className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-28 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Reveal>
              <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
                AI SERVICES DIVISION
              </span>
              <h2 className="mt-5 font-display text-[34px] font-semibold leading-[1.15] text-[color:var(--color-text-primary)] sm:text-[42px]">
                HamiaWorks AI
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
                HamiaWorks AI is not a separate company — it is the AI services division of
                Xeltrio Technologies, delivering hands-on automation and custom AI systems to
                businesses that need results before they need a platform.
              </p>
              <div className="mt-10 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6">
                <p className="font-mono-tech text-xs tracking-[0.08em] text-[color:var(--color-text-muted)]">
                  DIVISION OF
                </p>
                <p className="mt-2 font-display text-base font-semibold text-[color:var(--color-text-primary)]">
                  Xeltrio Technologies Private Limited
                </p>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {HAMIAWORKS_SERVICES.map((service) => (
                <RevealItem key={service.title}>
                  <div className="h-full rounded-xl border border-[color:var(--color-border-subtle)] p-6 transition-colors duration-300 hover:border-[color:var(--color-accent-primary)]/40 hover:bg-[color:var(--color-bg-elevated)]">
                    <h3 className="font-display text-base font-semibold text-[color:var(--color-text-primary)]">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                      {service.description}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
            <Reveal delay={0.1} className="mt-6 flex justify-end">
              <Link
                href="/hamiaworks-ai"
                className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-accent-secondary)] transition-colors hover:text-[color:var(--color-text-primary)]"
              >
                Explore HamiaWorks AI
                <ArrowUpRight size={15} />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
