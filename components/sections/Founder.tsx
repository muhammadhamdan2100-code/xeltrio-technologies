import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { FounderPortrait } from "@/components/founder/FounderPortrait";
import { FounderTimeline } from "@/components/founder/FounderTimeline";
import { FOUNDER, FOUNDER_VISION_CARDS, FOUNDER_HIGHLIGHTS } from "@/lib/constants";

export function Founder() {
  return (
    <section id="founder" className="relative overflow-hidden border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-28 lg:py-36">
      <div className="grid-lines absolute inset-0 opacity-30" aria-hidden="true" />
      <div
        className="pointer-events-none absolute right-0 top-0 h-[500px] w-[700px] translate-x-1/3 -translate-y-1/4 rounded-full opacity-30 blur-[110px]"
        style={{ background: "radial-gradient(circle, rgba(79,140,255,0.3), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
            MEET THE FOUNDER
          </span>
          <h2 className="mt-5 font-display text-[34px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[46px]">
            Building the Future of
            <br />
            Intelligent Business.
          </h2>
        </Reveal>

        {/* Portrait + story */}
        <div className="mt-20 grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-10">
          <Reveal className="lg:col-span-5">
            <FounderPortrait photoUrl={FOUNDER.photoUrl} name={FOUNDER.name} />
          </Reveal>

          <Reveal delay={0.12} className="lg:col-span-7">
            <h3 className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)] sm:text-3xl">
              {FOUNDER.name}
            </h3>
            <p className="mt-1.5 font-mono-tech text-xs tracking-[0.08em] text-[color:var(--color-accent-secondary)]">
              {FOUNDER.title.toUpperCase()}
            </p>
            <p className="mt-0.5 text-sm text-[color:var(--color-text-muted)]">{FOUNDER.company}</p>

            <div className="mt-8 flex flex-col gap-5">
              {FOUNDER.story.map((paragraph, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Vision cards */}
        <div className="mt-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              FOUNDER VISION
            </span>
            <h3 className="mt-4 font-display text-2xl font-semibold text-[color:var(--color-text-primary)] sm:text-3xl">
              What every decision runs through.
            </h3>
          </Reveal>

          <RevealGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FOUNDER_VISION_CARDS.map((card) => (
              <RevealItem key={card.title}>
                <div className="glass-panel h-full rounded-2xl p-6 transition-transform duration-500 hover:-translate-y-1.5">
                  <h4 className="font-display text-base font-semibold text-[color:var(--color-text-primary)]">
                    {card.title}
                  </h4>
                  <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                    {card.description}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        {/* Quote */}
        <Reveal delay={0.1} className="mx-auto mt-24 max-w-3xl text-center">
          <div className="glass-panel rounded-3xl border-[color:var(--color-accent-primary)]/25 p-10 sm:p-14">
            <blockquote className="font-display text-[22px] font-medium leading-snug text-[color:var(--color-text-primary)] sm:text-[30px]">
              {FOUNDER.quote.lines.map((line, i) => (
                <span key={i} className="block">
                  {i === 0 ? `"${line}` : i === FOUNDER.quote.lines.length - 1 ? `${line}"` : line}
                </span>
              ))}
            </blockquote>
            <p className="mt-6 font-mono-tech text-xs tracking-[0.1em] text-[color:var(--color-accent-secondary)]">
              — {FOUNDER.quote.attribution.toUpperCase()}
            </p>
          </div>
        </Reveal>

        {/* Timeline */}
        <div className="mt-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              FOUNDER TIMELINE
            </span>
            <h3 className="mt-4 font-display text-2xl font-semibold text-[color:var(--color-text-primary)] sm:text-3xl">
              How this started, and where it&apos;s going.
            </h3>
          </Reveal>

          <div className="mx-auto mt-14 max-w-2xl">
            <FounderTimeline />
          </div>
        </div>

        {/* Highlights */}
        <RevealGroup className="mt-24 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {FOUNDER_HIGHLIGHTS.map((item) => (
            <RevealItem key={item.label}>
              <div className="h-full rounded-2xl border border-[color:var(--color-border-subtle)] p-5 text-center transition-colors duration-300 hover:border-[color:var(--color-accent-primary)]/40">
                <p className="font-display text-sm font-semibold text-[color:var(--color-text-primary)]">
                  {item.label}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-text-muted)]">
                  {item.description}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
