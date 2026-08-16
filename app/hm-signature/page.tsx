import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { PerfumeBottleVisual } from "@/components/ecosystem/PerfumeBottleVisual";
import { PackagingVisual } from "@/components/ecosystem/PackagingVisual";
import { HMSignatureLogo } from "@/components/ecosystem/HMSignatureLogo";
import {
  HM_SIGNATURE,
  HM_BRAND_STORY,
  HM_PHILOSOPHY_PILLARS,
  HM_WHY_REASONS,
  HM_COLLECTION_PREVIEW,
  HM_INGREDIENTS,
  HM_CRAFTSMANSHIP_STEPS,
  HM_FUTURE_VISION,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "HM Signature — A Xeltrio Technologies Brand",
  description:
    "HM Signature is the premium luxury fragrance brand created under Xeltrio Technologies — elegant craftsmanship, premium presentation, and timeless design.",
};

export default function HmSignaturePage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-[color:var(--color-border-subtle)] bg-black pb-24 pt-[calc(76px+80px)] lg:pb-32 lg:pt-[calc(76px+110px)]">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-50 blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(212,175,90,0.35), transparent 70%)" }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_78%)]" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid max-w-[1400px] items-center gap-16 px-6 lg:grid-cols-2 lg:gap-8 lg:px-12">
          <Reveal>
            <span className="font-mono-tech text-[12px] tracking-[0.14em]" style={{ color: "#d4af5a" }}>
              A XELTRIO TECHNOLOGIES BRAND
            </span>
            <HMSignatureLogo width={190} className="mt-6 mb-2" />
            <h1 className="sr-only">{HM_SIGNATURE.brand}</h1>
            <p className="mt-2 font-display text-lg" style={{ color: "#d4af5a" }}>
              {HM_SIGNATURE.subtitle}
            </p>
            <p className="mt-7 max-w-lg text-[16px] leading-relaxed text-white/65">
              {HM_SIGNATURE.description}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <span
                data-cursor="button"
                className="inline-flex cursor-default items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-black"
                style={{ background: "linear-gradient(135deg, #f3d98b, #d4af5a)" }}
              >
                Coming Soon
              </span>
              <a
                href="#craft"
                data-cursor="button"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition-colors duration-300 hover:border-[#d4af5a]"
              >
                Learn More
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <PerfumeBottleVisual />
          </Reveal>
        </div>
      </section>

      <section id="craft" className="relative scroll-mt-20 bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              THE CRAFT
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              What HM Signature stands for.
            </h2>
          </Reveal>

          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {HM_SIGNATURE.pillars.map((pillar) => (
              <RevealItem key={pillar.title}>
                <div className="glass-panel h-full rounded-2xl p-8">
                  <h3 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                    {pillar.description}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal delay={0.1} className="mx-auto mt-14 max-w-xl rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-8 text-center">
            <p className="font-mono-tech text-[11px] tracking-[0.1em] text-[color:var(--color-text-muted)]">
              STATUS
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
              HM Signature is in early development under Xeltrio Technologies. Product photography,
              scent details, and launch timing will be published here when they&apos;re real.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Brand Story */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-black py-24 lg:py-32">
        <div className="mx-auto max-w-[900px] px-6 lg:px-12">
          <Reveal className="flex flex-col items-center text-center">
            <HMSignatureLogo width={110} className="mb-6" />
            <span className="font-mono-tech text-[12px] tracking-[0.14em]" style={{ color: "#d4af5a" }}>
              BRAND STORY
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-white sm:text-[36px]">
              Why Xeltrio built a fragrance house.
            </h2>
          </Reveal>
          <div className="mt-10 flex flex-col gap-6">
            {HM_BRAND_STORY.map((paragraph, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <p className="text-[15px] leading-relaxed text-white/65 sm:text-[16px]">{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Luxury Philosophy */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              LUXURY PHILOSOPHY
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              Four ideas the house doesn&apos;t compromise on.
            </h2>
          </Reveal>
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HM_PHILOSOPHY_PILLARS.map((pillar) => (
              <RevealItem key={pillar.title}>
                <div className="glass-panel h-full rounded-2xl p-7">
                  <h3 className="font-display text-base font-semibold text-[color:var(--color-text-primary)]">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                    {pillar.description}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Why HM Signature */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              WHY HM SIGNATURE
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              Built like a fragrance house, not a product launch.
            </h2>
          </Reveal>
          <RevealGroup className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-border-subtle)] sm:grid-cols-2">
            {HM_WHY_REASONS.map((reason) => (
              <RevealItem key={reason.title}>
                <div className="h-full bg-[color:var(--color-bg-primary)] p-8 transition-colors duration-300 hover:bg-[color:var(--color-bg-elevated)]">
                  <h3 className="font-display text-base font-semibold text-[color:var(--color-text-primary)]">
                    {reason.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                    {reason.description}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Bottle Showcase */}
      <section className="relative overflow-hidden border-t border-[color:var(--color-border-subtle)] bg-black py-24 lg:py-32">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[110px]"
          style={{ background: "radial-gradient(circle, rgba(212,175,90,0.3), transparent 70%)" }}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em]" style={{ color: "#d4af5a" }}>
              BOTTLE SHOWCASE
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-white sm:text-[36px]">
              An object first. A fragrance second.
            </h2>
          </Reveal>
          <Reveal delay={0.12} className="mt-14">
            <div className="mx-auto max-w-[360px]">
              <PerfumeBottleVisual />
            </div>
          </Reveal>
          <Reveal delay={0.18} className="mx-auto mt-10 max-w-lg text-center">
            <p className="text-sm leading-relaxed text-white/50">
              Mystic Oud — Eau de Parfum, 100ml. The house&apos;s founding signature.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Packaging Showcase */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-black py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-10">
            <Reveal>
              <span className="font-mono-tech text-[12px] tracking-[0.14em]" style={{ color: "#d4af5a" }}>
                PACKAGING SHOWCASE
              </span>
              <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-white sm:text-[36px]">
                The box is part of the product.
              </h2>
              <ul className="mt-8 flex flex-col gap-3">
                {["Luxury box construction", "Foil gold printing", "Embossed logo", "Premium material finish"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/65">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#d4af5a" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.15}>
              <PackagingVisual />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Perfume Collection (Coming Soon) */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              THE COLLECTION
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              Coming soon.
            </h2>
          </Reveal>
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HM_COLLECTION_PREVIEW.map((scent) => (
              <RevealItem key={scent.name}>
                <div className="glass-panel flex h-full flex-col items-center rounded-2xl p-7 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(212,175,90,0.14)" }}>
                    <Sparkles size={16} strokeWidth={1.75} style={{ color: "#d4af5a" }} />
                  </div>
                  <h3 className="mt-5 font-display text-base font-semibold text-[color:var(--color-text-primary)]">
                    {scent.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-text-muted)]">{scent.note}</p>
                  <span className="mt-4 rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-mono-tech text-[9px] tracking-[0.06em] text-[color:var(--color-text-muted)]">
                    Coming Soon
                  </span>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Signature Ingredients */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              SIGNATURE INGREDIENTS
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              The notes the house is built on.
            </h2>
          </Reveal>
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HM_INGREDIENTS.map((ingredient) => (
              <RevealItem key={ingredient.title}>
                <div className="glass-panel h-full rounded-2xl p-7">
                  <h3 className="font-display text-base font-semibold text-[color:var(--color-text-primary)]">
                    {ingredient.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                    {ingredient.description}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Craftsmanship Process */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1000px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              CRAFTSMANSHIP PROCESS
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              From ingredient to bottle.
            </h2>
          </Reveal>
          <RevealGroup className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HM_CRAFTSMANSHIP_STEPS.map((step, i) => (
              <RevealItem key={step.label}>
                <div className="h-full rounded-2xl border border-[color:var(--color-border-subtle)] p-6">
                  <span className="font-mono-tech text-xs text-[color:var(--color-accent-secondary)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-base font-semibold text-[color:var(--color-text-primary)]">
                    {step.label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">{step.detail}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Luxury Experience */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-black py-24 lg:py-32">
        <div className="mx-auto max-w-[900px] px-6 text-center lg:px-12">
          <Reveal>
            <span className="font-mono-tech text-[12px] tracking-[0.14em]" style={{ color: "#d4af5a" }}>
              THE LUXURY EXPERIENCE
            </span>
            <h2 className="mt-5 font-display text-[26px] font-medium leading-snug text-white sm:text-[32px]">
              Opening the box should feel like part of the fragrance —
              <br className="hidden sm:block" /> not an afterthought before it.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-white/55">
              From the weight of the box in your hands to the resistance of the cap turning open,
              every touchpoint is designed with the same intent: this should feel unmistakably
              considered.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Future Vision */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              FUTURE VISION
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              Where the house is headed.
            </h2>
          </Reveal>
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {HM_FUTURE_VISION.map((item) => (
              <RevealItem key={item.title}>
                <div className="glass-panel h-full rounded-2xl p-7">
                  <h3 className="font-display text-base font-semibold text-[color:var(--color-text-primary)]">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                    {item.description}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Premium CTA */}
      <section className="relative overflow-hidden border-t border-[color:var(--color-border-subtle)] bg-black py-24 lg:py-32">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-35 blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(212,175,90,0.35), transparent 70%)" }}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-[700px] px-6 text-center lg:px-12">
          <Reveal className="flex flex-col items-center">
            <HMSignatureLogo width={130} className="mb-8" />
            <h2 className="font-display text-[28px] font-semibold leading-tight text-white sm:text-[36px]">
              HM Signature has arrived.
              <br />
              Availability is next.
            </h2>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <span
                data-cursor="button"
                className="inline-flex cursor-default items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-black"
                style={{ background: "linear-gradient(135deg, #f3d98b, #d4af5a)" }}
              >
                Coming Soon
              </span>
              <Link
                href="/#our-ecosystem"
                data-cursor="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition-colors duration-300 hover:border-[#d4af5a]"
              >
                Back to the Xeltrio ecosystem
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
