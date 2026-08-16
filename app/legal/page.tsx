import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { LEGAL_PAGES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Legal — Xeltrio Technologies",
  description: "Privacy policy, terms of service, cookie policy, and disclaimer for Xeltrio Technologies — currently in placeholder form.",
};

export default function LegalIndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="LEGAL"
        title="Legal information"
        description="These pages are placeholders today. Full, reviewed policies will be published here before BusinessOS launches publicly."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1000px] px-6 lg:px-12">
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {LEGAL_PAGES.map((page) => (
              <RevealItem key={page.slug}>
                <Link
                  href={`/legal/${page.slug}`}
                  className="glass-panel block h-full rounded-2xl p-7 transition-transform duration-500 hover:-translate-y-1.5"
                >
                  <h3 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                    {page.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                    {page.summary}
                  </p>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </>
  );
}
