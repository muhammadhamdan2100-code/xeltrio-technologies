import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Reveal } from "@/components/motion/Reveal";
import { FounderPortrait } from "@/components/founder/FounderPortrait";
import { Founder as FounderCoreSection } from "@/components/sections/Founder";
import {
  FOUNDER,
  FOUNDER_MISSION_STATEMENT,
  FOUNDER_VISION_STATEMENT,
  FOUNDER_COMPANY_VISION,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Founder — Muhammad Hamdan | Xeltrio Technologies",
  description:
    "Muhammad Hamdan, Founder & CEO of Xeltrio Technologies — the story, mission, vision, and roadmap behind an AI-native enterprise operating system.",
};

export default function FounderPage() {
  return (
    <PageShell>
      {/* Premium Hero */}
      <section className="relative overflow-hidden border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] pb-20 pt-[calc(76px+64px)] lg:pb-28 lg:pt-[calc(76px+88px)]">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden="true" />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-50 blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(79,140,255,0.22), transparent 70%)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto grid max-w-[1400px] items-center gap-16 px-6 lg:grid-cols-12 lg:gap-8 lg:px-12">
          <Reveal className="lg:col-span-7">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              FOUNDER & CEO
            </span>
            <h1 className="mt-5 font-display text-[38px] font-semibold leading-[1.1] tracking-[-0.01em] text-[color:var(--color-text-primary)] sm:text-[52px] lg:text-[58px]">
              {FOUNDER.name}
            </h1>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-[color:var(--color-text-secondary)] sm:text-[18px]">
              Building the operating system for the future of business — starting with{" "}
              {FOUNDER.company}.
            </p>
          </Reveal>

          <Reveal delay={0.15} className="lg:col-span-5">
            <FounderPortrait photoUrl={FOUNDER.photoUrl} name={FOUNDER.name} />
          </Reveal>
        </div>
      </section>

      {/* Introduction, Story, Leadership Philosophy, Timeline, Achievements, Quote — reused from the homepage-derived Founder section */}
      <FounderCoreSection />

      {/* Mission */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[900px] px-6 text-center lg:px-12">
          <Reveal>
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              MISSION
            </span>
            <p className="mt-6 font-display text-[24px] font-medium leading-snug text-[color:var(--color-text-primary)] sm:text-[30px]">
              {FOUNDER_MISSION_STATEMENT}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Vision */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[900px] px-6 text-center lg:px-12">
          <Reveal>
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              VISION
            </span>
            <p className="mt-6 font-display text-[24px] font-medium leading-snug text-[color:var(--color-text-primary)] sm:text-[30px]">
              {FOUNDER_VISION_STATEMENT}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Company Vision */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            <Reveal className="lg:col-span-4">
              <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
                COMPANY VISION
              </span>
              <h2 className="mt-5 font-display text-[28px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[34px]">
                From one founder&apos;s vision to a company&apos;s standard.
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-7 lg:col-start-6">
              <p className="text-[15px] leading-relaxed text-[color:var(--color-text-secondary)] sm:text-[16px]">
                {FOUNDER_COMPANY_VISION}
              </p>
              <Link
                href="/#about"
                data-cursor="button"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-accent-secondary)] transition-colors hover:text-[color:var(--color-text-primary)]"
              >
                More on Xeltrio&apos;s company vision
                <ArrowUpRight size={15} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Future Roadmap */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              FUTURE ROADMAP
            </span>
            <h2 className="mt-5 font-display text-[28px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[34px]">
              The plan hasn&apos;t changed — only the scale has.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
              BusinessOS, the wider ecosystem, and Xeltrio&apos;s path to global scale are mapped
              out in detail on the roadmap.
            </p>
            <Link
              href="/roadmap"
              data-cursor="button"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-6 py-3 text-sm font-medium text-[color:var(--color-text-primary)] transition-all duration-300 hover:border-[color:var(--color-accent-primary)] hover:bg-[color:var(--color-accent-primary)]/10"
            >
              View the full roadmap
              <ArrowUpRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-24 lg:py-32">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(79,140,255,0.3), transparent 70%)" }}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-[700px] px-6 text-center lg:px-12">
          <Reveal>
            <h2 className="font-display text-[28px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              See what that vision is building.
            </h2>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/businessos"
                data-cursor="button"
                className="rounded-full bg-[color:var(--color-accent-primary)] px-6 py-3 text-sm font-medium text-[#050816] transition-transform duration-300 hover:scale-[1.03] hover:brightness-110"
              >
                Explore BusinessOS
              </Link>
              <Link
                href="/careers"
                data-cursor="button"
                className="rounded-full border border-[color:var(--color-border)] px-6 py-3 text-sm font-medium text-[color:var(--color-text-primary)] transition-colors duration-300 hover:border-[color:var(--color-accent-primary)]"
              >
                Join the team
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
