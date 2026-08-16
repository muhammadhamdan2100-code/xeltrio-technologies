import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { LEGAL_PAGES } from "@/lib/constants";

export function LegalDocument({ slug }: { slug: string }) {
  const page = LEGAL_PAGES.find((p) => p.slug === slug);
  if (!page) return null;

  return (
    <>
      <PageHeader eyebrow="LEGAL" title={page.title} description={page.summary} />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[800px] px-6 lg:px-12">
          <Reveal className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6 sm:p-8">
            <p className="font-mono-tech text-[11px] tracking-[0.1em] text-[color:var(--color-accent-secondary)]">
              PLACEHOLDER
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
              This page is a placeholder, not a binding legal document. A complete, reviewed
              {" "}{page.title.toLowerCase()} will be published here before BusinessOS launches
              publicly. Below is what it will cover.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mt-10">
            <h2 className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">
              What this will cover
            </h2>
            <ul className="mt-6 flex flex-col gap-4">
              {page.topics.map((topic) => (
                <li key={topic} className="flex gap-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-accent-primary)]" />
                  {topic}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.16} className="mt-12 border-t border-[color:var(--color-border-subtle)] pt-8">
            <p className="text-sm text-[color:var(--color-text-muted)]">
              Other legal pages:{" "}
              {LEGAL_PAGES.filter((p) => p.slug !== slug).map((p, i, arr) => (
                <span key={p.slug}>
                  <Link href={`/legal/${p.slug}`} className="text-[color:var(--color-accent-secondary)] underline underline-offset-4">
                    {p.title}
                  </Link>
                  {i < arr.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
