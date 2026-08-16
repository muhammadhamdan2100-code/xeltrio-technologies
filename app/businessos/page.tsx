import type { Metadata } from "next";
import Link from "next/link";
import { Cpu, Cloud, Building2, Layers } from "lucide-react";
import { BusinessOSHero } from "@/components/sections/BusinessOSHero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { ArchitectureDiagram } from "@/components/sections/ArchitectureDiagram";
import { BUSINESSOS_MODULES, BUSINESSOS_PILLARS, ECOSYSTEM_PRODUCTS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "BusinessOS — Xeltrio Technologies",
  description:
    "BusinessOS is Xeltrio's flagship enterprise AI operating system — not ERP software with AI added on, but an intelligent platform that powers a business through AI from the ground up.",
};

const PILLAR_ICONS = [Cpu, Cloud, Building2, Layers];

export default function BusinessOSPage() {
  return (
    <>
      <BusinessOSHero />

      {/* Overview */}
      <section className="relative border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-4">
              <Reveal>
                <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
                  OVERVIEW
                </span>
                <h2 className="mt-5 font-display text-[30px] font-semibold leading-[1.15] text-[color:var(--color-text-primary)] sm:text-[36px]">
                  What BusinessOS actually is.
                </h2>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <Reveal delay={0.1}>
                <p className="text-[17px] leading-relaxed text-[color:var(--color-text-secondary)] sm:text-[18px]">
                  Traditional ERP software records what happened. BusinessOS decides what should
                  happen next. It&apos;s a single AI-native platform underneath every operational
                  function of a business — CRM, HRMS, Finance, Inventory, and a growing family of
                  industry-specific modules — coordinated by autonomous agents rather than
                  disconnected dashboards.
                </p>
                <p className="mt-6 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
                  Every vertical operating system in the Xeltrio ecosystem — EducationOS,
                  HospitalOS, RetailOS, and beyond — is BusinessOS, configured for a specific
                  industry. One core, engineered once, reused everywhere.
                </p>
              </Reveal>

              <Reveal delay={0.18} className="mt-12 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-8">
                <span className="font-mono-tech text-[11px] tracking-[0.1em] text-[color:var(--color-accent-secondary)]">
                  VISION
                </span>
                <p className="mt-3 font-display text-xl font-semibold leading-snug text-[color:var(--color-text-primary)] sm:text-2xl">
                  A business should be able to describe what it needs — and have BusinessOS
                  orchestrate the rest.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Why BusinessOS: AI Powered / Cloud Native / Enterprise Ready / Scalable */}
      <section className="relative border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              WHY BUSINESSOS
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              Four commitments, non-negotiable.
            </h2>
          </Reveal>

          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BUSINESSOS_PILLARS.map((pillar, i) => {
              const Icon = PILLAR_ICONS[i];
              return (
                <RevealItem key={pillar.title}>
                  <div className="glass-panel h-full rounded-2xl p-7">
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
        </div>
      </section>

      {/* Core Architecture */}
      <section className="relative border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              CORE ARCHITECTURE
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              Five layers. One platform.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
              From the interface someone touches down to the data layer nobody sees, BusinessOS is
              engineered as a single stack — not a bundle of acquired products stitched together.
            </p>
          </Reveal>

          <Reveal delay={0.12} className="mt-14">
            <ArchitectureDiagram />
          </Reveal>

          <Reveal delay={0.18} className="mt-8 flex justify-center">
            <Link
              href="/businessos/architecture"
              data-cursor="button"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-6 py-3 text-sm font-medium text-[color:var(--color-text-primary)] transition-all duration-300 hover:border-[color:var(--color-accent-primary)] hover:bg-[color:var(--color-accent-primary)]/10"
            >
              See the full interactive architecture
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Modules preview */}
      <section className="relative border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              MODULES PREVIEW
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              Sixteen modules. One shared core.
            </h2>
          </Reveal>

          <RevealGroup className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-border-subtle)] sm:grid-cols-2 lg:grid-cols-4">
            {BUSINESSOS_MODULES.map((mod) => (
              <RevealItem key={mod.name}>
                <div className="flex h-full flex-col justify-between bg-[color:var(--color-bg-primary)] p-6 transition-colors duration-300 hover:bg-[color:var(--color-bg-elevated)]">
                  <span className="font-mono-tech text-[10px] uppercase tracking-[0.1em] text-[color:var(--color-text-muted)]">
                    {mod.category}
                  </span>
                  <div className="mt-6">
                    <h3 className="font-display text-base font-semibold text-[color:var(--color-text-primary)]">
                      {mod.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                      {mod.description}
                    </p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal delay={0.1} className="mt-10 flex justify-center">
            <Link
              href="/businessos/modules"
              data-cursor="button"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-6 py-3 text-sm font-medium text-[color:var(--color-text-primary)] transition-all duration-300 hover:border-[color:var(--color-accent-primary)] hover:bg-[color:var(--color-accent-primary)]/10"
            >
              Browse every module
            </Link>
          </Reveal>
        </div>
      </section>
      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              THE BUSINESSOS ECOSYSTEM
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              Every future product starts here.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
              {ECOSYSTEM_PRODUCTS.length} products are planned across the Xeltrio ecosystem — each
              one BusinessOS, adapted to a vertical. See the full lineup on the{" "}
              <Link href="/products" className="text-[color:var(--color-accent-secondary)] underline underline-offset-4">
                Products page
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
