import type { Metadata } from "next";
import { FileText, BookOpen, FileStack, Compass, Newspaper, Library, GraduationCap } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { RESOURCES_SECTIONS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Resources — Xeltrio Technologies",
  description:
    "Documentation, case studies, whitepapers, product guides, and learning resources for the Xeltrio ecosystem — coming online as BusinessOS ships.",
};

const RESOURCE_ICONS = [FileText, Compass, FileStack, BookOpen, Newspaper, Library, GraduationCap];

export default function ResourcesPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="RESOURCES"
        title={
          <>
            Everything you&apos;ll need
            <br />
            to run on BusinessOS.
          </>
        }
        description="These sections fill in as BusinessOS ships. Here's what each one will hold."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RESOURCES_SECTIONS.map((section, i) => {
              const Icon = RESOURCE_ICONS[i];
              return (
                <RevealItem key={section.title}>
                  <div className="glass-panel h-full rounded-2xl p-7">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-accent-primary)]/10 text-[color:var(--color-accent-secondary)]">
                        <Icon size={20} strokeWidth={1.75} />
                      </div>
                      <span className="whitespace-nowrap rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-mono-tech text-[10px] tracking-[0.06em] text-[color:var(--color-text-muted)]">
                        Coming Soon
                      </span>
                    </div>
                    <h3 className="mt-6 font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                      {section.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                      {section.description}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>
    </PageShell>
  );
}
