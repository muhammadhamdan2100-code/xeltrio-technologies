import Link from "next/link";
import { ArrowUpRight, User } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { FOUNDER_PREVIEW } from "@/lib/constants";

export function FounderPreview() {
  return (
    <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-24 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <Reveal>
          <div className="glass-panel flex flex-col items-center gap-6 rounded-3xl p-10 text-center sm:p-14">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-accent-primary)]/10">
              <User size={24} strokeWidth={1.5} className="text-[color:var(--color-accent-secondary)]" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)] sm:text-3xl">
                {FOUNDER_PREVIEW.title}
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
                {FOUNDER_PREVIEW.description}
              </p>
            </div>
            <Link
              href={FOUNDER_PREVIEW.href}
              data-cursor="button"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-accent-primary)] px-6 py-3 text-sm font-medium text-[#050816] transition-transform duration-300 hover:scale-[1.03] hover:brightness-110"
            >
              {FOUNDER_PREVIEW.buttonLabel}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
