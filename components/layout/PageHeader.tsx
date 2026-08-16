import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  /**
   * Set when this page already sits below another fixed/static bar (e.g. the
   * BusinessOS sub-nav) that has handled clearing the main Nav itself — avoids
   * stacking two nav-height offsets on top of each other.
   */
  compact?: boolean;
};

export function PageHeader({ eyebrow, title, description, compact = false }: PageHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)]",
        compact ? "pb-16 pt-16 lg:pb-20 lg:pt-20" : "pb-20 pt-[calc(76px+72px)] lg:pb-28 lg:pt-[calc(76px+96px)]"
      )}
    >
      <div className="grid-lines absolute inset-0 opacity-50" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-60 blur-[80px]"
        style={{ background: "radial-gradient(circle, rgba(79,140,255,0.22), transparent 70%)" }}
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12">
        <Reveal className="max-w-3xl">
          <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
            {eyebrow}
          </span>
          <h1 className="mt-5 font-display text-[38px] font-semibold leading-[1.1] tracking-[-0.01em] text-[color:var(--color-text-primary)] sm:text-[50px] lg:text-[60px]">
            {title}
          </h1>
          {description && (
            <p className="mt-7 max-w-2xl text-[16px] leading-relaxed text-[color:var(--color-text-secondary)] sm:text-[18px]">
              {description}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
