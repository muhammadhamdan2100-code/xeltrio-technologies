import { Reveal } from "@/components/motion/Reveal";

export function VisionMission() {
  return (
    <section id="vision" className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-28 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="glass-panel h-full rounded-3xl p-10 lg:p-14">
              <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
                VISION
              </span>
              <h3 className="mt-5 font-display text-[28px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[34px]">
                Become one of the world&apos;s leading AI software companies.
              </h3>
              <p className="mt-6 text-[16px] leading-relaxed text-[color:var(--color-text-secondary)]">
                We see a future where every enterprise runs on an intelligence layer rather than a
                collection of disconnected tools — where software doesn&apos;t just record what
                happened, but actively decides what should happen next.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="glass-panel h-full rounded-3xl p-10 lg:p-14">
              <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
                MISSION
              </span>
              <h3 className="mt-5 font-display text-[28px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[34px]">
                Build world-class AI software that transforms businesses.
              </h3>
              <p className="mt-6 text-[16px] leading-relaxed text-[color:var(--color-text-secondary)]">
                Every product in the Xeltrio ecosystem is engineered to replace manual, disconnected
                operations with a single autonomous intelligence layer — measured not by features
                shipped, but by hours of human effort returned to the businesses we serve.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
