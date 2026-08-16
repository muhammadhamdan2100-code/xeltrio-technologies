import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, Share2, ShieldCheck, Bot, Zap, Globe2, Handshake } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { ContactForm } from "@/components/contact/ContactForm";
import { GlobalPresenceMap } from "@/components/contact/GlobalPresenceMap";
import { ContactFAQ } from "@/components/contact/ContactFAQ";
import { FloatingParticles } from "@/components/contact/FloatingParticles";
import { SocialMediaLinks } from "@/components/contact/SocialMediaLinks";
import { CONTACT_INFO_CARDS, WHY_CONTACT_XELTRIO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact — Xeltrio Technologies",
  description:
    "Let's build the future together — reach the Xeltrio Technologies team for AI automation, BusinessOS, enterprise software, or strategic technology consulting.",
};

const INFO_ICONS = [Mail, Phone, MapPin, Clock, Share2];
const WHY_ICONS = [ShieldCheck, Bot, Zap, Globe2, Handshake];

export default function ContactPage() {
  return (
    <PageShell>
      {/* 1. Premium Hero */}
      <section className="relative overflow-hidden border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] pb-20 pt-[calc(76px+72px)] lg:pb-28 lg:pt-[calc(76px+96px)]">
        <div className="grid-lines absolute inset-0 opacity-50" aria-hidden="true" />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-60 blur-[80px]"
          style={{ background: "radial-gradient(circle, rgba(79,140,255,0.22), transparent 70%)" }}
          aria-hidden="true"
        />
        <FloatingParticles />

        <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="max-w-3xl">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              CONTACT
            </span>
            <h1 className="mt-5 font-display text-[38px] font-semibold leading-[1.1] tracking-[-0.01em] text-[color:var(--color-text-primary)] sm:text-[52px] lg:text-[60px]">
              Let&apos;s Build The Future Together
            </h1>
            <p className="mt-7 max-w-2xl text-[16px] leading-relaxed text-[color:var(--color-text-secondary)] sm:text-[18px]">
              Whether you&apos;re looking for AI automation, enterprise software, BusinessOS, or
              strategic technology consulting, our team is ready to help.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2. Contact Form */}
      <section id="contact-form" className="relative scroll-mt-24 bg-[color:var(--color-bg-secondary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[900px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              START A CONVERSATION
            </span>
            <h2 className="mt-5 font-display text-[28px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[34px]">
              Tell us what you&apos;re building.
            </h2>
          </Reveal>

          <Reveal delay={0.1} className="glass-panel mt-12 rounded-3xl p-6 sm:p-10">
            <ContactForm />
          </Reveal>
        </div>
      </section>

      {/* 3. Company Information */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              COMPANY INFORMATION
            </span>
            <h2 className="mt-5 font-display text-[28px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[34px]">
              Details, as they become real.
            </h2>
          </Reveal>

          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {CONTACT_INFO_CARDS.map((card, i) => {
              const Icon = INFO_ICONS[i];
              return (
                <RevealItem key={card.label}>
                  <div className="glass-panel h-full rounded-2xl p-6 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-accent-primary)]/10 text-[color:var(--color-accent-secondary)]">
                      <Icon size={18} strokeWidth={1.75} />
                    </div>
                    <p className="mt-5 font-mono-tech text-[10px] uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                      {card.label}
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-[color:var(--color-text-primary)]">
                      {card.value}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* 4. Interactive Global Presence */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1000px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              GLOBAL PRESENCE
            </span>
            <h2 className="mt-5 font-display text-[28px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[34px]">
              Headquartered in Pakistan. Building outward.
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-14">
            <GlobalPresenceMap />
          </Reveal>
        </div>
      </section>

      {/* 4.5. Social Media Links */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1000px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              CONNECT WITH US
            </span>
            <h2 className="mt-5 font-display text-[28px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[34px]">
              Join our community
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-14">
            <SocialMediaLinks />
          </Reveal>
        </div>
      </section>

      {/* 5. Why Contact Xeltrio */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              WHY CONTACT XELTRIO
            </span>
            <h2 className="mt-5 font-display text-[28px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[34px]">
              What you can expect from the first conversation.
            </h2>
          </Reveal>
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {WHY_CONTACT_XELTRIO.map((item, i) => {
              const Icon = WHY_ICONS[i];
              return (
                <RevealItem key={item.title}>
                  <div className="glass-panel h-full rounded-2xl p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--color-accent-primary)]/10 text-[color:var(--color-accent-secondary)]">
                      <Icon size={17} strokeWidth={1.75} />
                    </div>
                    <h3 className="mt-5 font-display text-sm font-semibold text-[color:var(--color-text-primary)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
                      {item.description}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[800px] px-6 lg:px-12">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              FAQ
            </span>
            <h2 className="mt-5 font-display text-[28px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[34px]">
              Common questions.
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-14">
            <ContactFAQ />
          </Reveal>
        </div>
      </section>

      {/* 7. Final CTA */}
      <section className="relative overflow-hidden border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(79,140,255,0.3), transparent 70%)" }}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-[700px] px-6 text-center lg:px-12">
          <Reveal>
            <h2 className="font-display text-[28px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[38px]">
              Ready to Build Something Extraordinary?
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
              Let&apos;s create the future together.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="#contact-form"
                data-cursor="button"
                className="rounded-full bg-[color:var(--color-accent-primary)] px-7 py-3.5 text-sm font-medium text-[#050816] transition-transform duration-300 hover:scale-[1.03] hover:brightness-110"
              >
                Send Message
              </Link>
              <Link
                href="#contact-form"
                data-cursor="button"
                className="rounded-full border border-[color:var(--color-border)] px-7 py-3.5 text-sm font-medium text-[color:var(--color-text-primary)] transition-colors duration-300 hover:border-[color:var(--color-accent-primary)]"
              >
                Book Consultation
              </Link>
            </div>
            <p className="mt-6 text-xs text-[color:var(--color-text-muted)]">
              Consultation booking isn&apos;t connected to a calendar yet — for now, mention it in
              the form above and we&apos;ll follow up directly.
            </p>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
