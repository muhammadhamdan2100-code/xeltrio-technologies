import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { BUSINESSOS_TECH_STACK } from "@/lib/constants";

export const metadata: Metadata = {
  title: "BusinessOS Technology — Xeltrio Technologies",
  description:
    "The technology stack behind BusinessOS — Next.js, React, TypeScript, Supabase, PostgreSQL, n8n, and the AI and automation layers built on top of them.",
};

export default function BusinessOSTechnologyPage() {
  return (
    <>
      <PageHeader
        compact
        eyebrow="TECHNOLOGY"
        title={
          <>
            Built on proven tools.
            <br />
            Engineered as one system.
          </>
        }
        description="BusinessOS isn't a research project. It's built on the same production-grade tools serious software companies use, assembled into a single AI-native platform."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <RevealGroup className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-border-subtle)] sm:grid-cols-2 lg:grid-cols-3">
            {BUSINESSOS_TECH_STACK.map((tech, i) => (
              <RevealItem key={tech.name}>
                <div className="flex h-full flex-col justify-between bg-[color:var(--color-bg-secondary)] p-7 transition-colors duration-300 hover:bg-[color:var(--color-bg-elevated)]">
                  <span className="font-mono-tech text-xs text-[color:var(--color-accent-secondary)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="mt-6">
                    <h3 className="font-display text-base font-semibold text-[color:var(--color-text-primary)]">
                      {tech.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                      {tech.description}
                    </p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </>
  );
}
