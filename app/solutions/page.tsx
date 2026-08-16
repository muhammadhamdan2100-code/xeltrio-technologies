import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { SOLUTIONS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Solutions — Xeltrio Technologies",
  description:
    "How BusinessOS solves real operational problems across education, healthcare, retail, manufacturing, logistics, and more.",
};

export default function SolutionsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="SOLUTIONS"
        title={
          <>
            The same core.
            <br />
            A different problem, solved.
          </>
        }
        description="BusinessOS doesn't change from industry to industry — the problems it's aimed at do. Here's how the same intelligence layer solves very different operational problems."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <RevealGroup className="flex flex-col gap-6">
            {SOLUTIONS.map((solution) => (
              <RevealItem key={solution.industry}>
                <div className="glass-panel grid gap-6 rounded-2xl p-8 sm:p-10 lg:grid-cols-12 lg:items-center lg:gap-8">
                  <div className="lg:col-span-3">
                    <span className="font-mono-tech text-[11px] tracking-[0.1em] text-[color:var(--color-accent-secondary)]">
                      INDUSTRY
                    </span>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">
                      {solution.industry}
                    </h3>
                    <p className="mt-3 text-xs font-medium uppercase tracking-[0.06em] text-[color:var(--color-text-muted)]">
                      {solution.product}
                    </p>
                  </div>

                  <div className="lg:col-span-4">
                    <p className="font-mono-tech text-[11px] tracking-[0.08em] text-[color:var(--color-text-muted)]">
                      THE PROBLEM
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                      {solution.problem}
                    </p>
                  </div>

                  <div className="hidden justify-center lg:col-span-1 lg:flex">
                    <ArrowRight size={18} className="text-[color:var(--color-accent-primary)]" />
                  </div>

                  <div className="lg:col-span-4">
                    <p className="font-mono-tech text-[11px] tracking-[0.08em] text-[color:var(--color-accent-secondary)]">
                      THE SOLUTION
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                      {solution.solution}
                    </p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal delay={0.1} className="mt-16 flex justify-center">
            <Link
              href="/industries"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-6 py-3 text-sm font-medium text-[color:var(--color-text-primary)] transition-all duration-300 hover:border-[color:var(--color-accent-primary)] hover:bg-[color:var(--color-accent-primary)]/10"
            >
              See all industries at a glance
              <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
