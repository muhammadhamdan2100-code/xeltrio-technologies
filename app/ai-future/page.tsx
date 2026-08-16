import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { AIFutureJourney } from "@/components/sections/AIFutureJourney";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "AI Future — Xeltrio Technologies",
  description:
    "Where Xeltrio Technologies is headed — from disconnected businesses, through BusinessOS, AI Directors, and AI Employees, to a global digital ecosystem.",
};

export default function AIFuturePage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="AI FUTURE"
        title={
          <>
            Where this
            <br />
            is all headed.
          </>
        }
        description="Scroll to walk through it — from businesses running on disconnected tools today, to a single global digital ecosystem running on BusinessOS."
      />

      <AIFutureJourney />

      <section className="relative bg-[color:var(--color-bg-secondary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              THE HONEST VERSION
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              This is a direction, not a promise with a date on it.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
              BusinessOS and EducationOS are in active development today. AI Directors, a mature
              Agent Ecosystem, and a truly global footprint are further out. We&apos;d rather show
              you where we&apos;re headed honestly than dress up a roadmap as a done deal.
            </p>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
