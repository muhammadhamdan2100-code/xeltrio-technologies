import { Reveal } from "@/components/motion/Reveal";

export function About() {
  return (
    <section id="about" className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-28 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Reveal>
              <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
                01 — ABOUT
              </span>
              <h2 className="mt-5 font-display text-[34px] font-semibold leading-[1.15] tracking-[-0.01em] text-[color:var(--color-text-primary)] sm:text-[42px]">
                Not an agency.
                <br />
                An AI product company.
              </h2>
            </Reveal>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal delay={0.1}>
              <p className="text-[18px] leading-relaxed text-[color:var(--color-text-secondary)] sm:text-[20px]">
                Xeltrio Technologies builds enterprise software powered by artificial intelligence.
                We create intelligent operating systems for businesses — not dashboards with a
                chatbot bolted on, but a genuine AI layer running underneath every workflow.
              </p>
              <p className="mt-6 text-[16px] leading-relaxed text-[color:var(--color-text-secondary)] sm:text-[18px]">
                Our products are designed for global enterprise organizations that need software
                built to institutional scale — multi-department, multi-role, and secure by design.
                Xeltrio exists because most enterprise software still asks people to operate it.
                Ours is built to operate itself.
              </p>

              <div className="mt-12 grid grid-cols-2 gap-8 border-t border-[color:var(--color-border-subtle)] pt-10 sm:grid-cols-3">
                <div>
                  <p className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">01</p>
                  <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">Founding product company</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">12+</p>
                  <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">Planned ecosystem products</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">2</p>
                  <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">Verticals in active development</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
