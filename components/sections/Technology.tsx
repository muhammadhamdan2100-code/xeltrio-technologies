import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { TECHNOLOGY_PILLARS } from "@/lib/constants";

export function Technology() {
  return (
    <section id="technology" className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-28 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Reveal>
              <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
                02 — TECHNOLOGY
              </span>
              <h2 className="mt-5 font-display text-[34px] font-semibold leading-[1.15] text-[color:var(--color-text-primary)] sm:text-[42px]">
                One core stack.
                <br />
                Every product.
              </h2>
              <p className="mt-6 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
                Every operating system in the Xeltrio ecosystem is built on the same foundation —
                so intelligence, security, and scale are shared, not rebuilt per vertical.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <RevealGroup className="flex flex-col gap-px overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-border-subtle)]">
              {TECHNOLOGY_PILLARS.map((pillar, i) => (
                <RevealItem key={pillar.title}>
                  <div className="flex items-start gap-6 bg-[color:var(--color-bg-secondary)] p-7 transition-colors duration-300 hover:bg-[color:var(--color-bg-elevated)] sm:items-center sm:p-8">
                    <span className="font-mono-tech text-sm text-[color:var(--color-accent-secondary)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-base font-semibold text-[color:var(--color-text-primary)] sm:text-lg">
                        {pillar.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
            <Reveal delay={0.1} className="mt-6 flex justify-end">
              <Link
                href="/technology"
                className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-accent-secondary)] transition-colors hover:text-[color:var(--color-text-primary)]"
              >
                Go deeper on our technology
                <ArrowUpRight size={15} />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
