import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { CORE_VALUES } from "@/lib/constants";

export function CoreValues() {
  return (
    <section id="values" className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-28 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <Reveal className="max-w-2xl">
          <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
            CORE VALUES
          </span>
          <h2 className="mt-5 font-display text-[34px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[42px]">
            What we build on, every time.
          </h2>
        </Reveal>

        <RevealGroup className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-border-subtle)] sm:grid-cols-2 lg:grid-cols-4">
          {CORE_VALUES.map((value, i) => (
            <RevealItem key={value.title}>
              <div className="group flex h-full flex-col justify-between bg-[color:var(--color-bg-secondary)] p-8 transition-colors duration-300 hover:bg-[color:var(--color-bg-elevated)]">
                <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="mt-8">
                  <h3 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                    {value.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                    {value.description}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
