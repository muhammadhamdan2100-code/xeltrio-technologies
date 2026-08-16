import type { Metadata } from "next";
import {
  Bot,
  Users,
  Workflow,
  Building2,
  MessageCircle,
  Mic,
  Sparkles,
  Cpu,
  Lightbulb,
  Plug,
  Repeat,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { HAMIAWORKS_SERVICES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "HamiaWorks AI — Xeltrio Technologies",
  description:
    "HamiaWorks AI is the AI services division of Xeltrio Technologies — automation, AI employees, agents, and custom AI systems for businesses that need results today.",
};

const SERVICE_ICONS = [Workflow, Users, Bot, Building2, Repeat, MessageCircle, Mic, Sparkles, Cpu, Lightbulb, Plug];

export default function HamiaWorksAIPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="AI SERVICES DIVISION"
        title={
          <>
            HamiaWorks AI
            <br />
            <span className="text-gradient-accent">Automation, delivered hands-on.</span>
          </>
        }
        description="HamiaWorks AI is not a separate company — it's the AI services division of Xeltrio Technologies, building automation and custom AI systems for businesses that need results before they need a platform."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              SERVICES
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              What HamiaWorks AI builds.
            </h2>
          </Reveal>

          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HAMIAWORKS_SERVICES.map((service, i) => {
              const Icon = SERVICE_ICONS[i] ?? Sparkles;
              return (
                <RevealItem key={service.title}>
                  <div className="glass-panel h-full rounded-2xl p-7 transition-transform duration-500 hover:-translate-y-1.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-accent-primary)]/10 text-[color:var(--color-accent-secondary)]">
                      <Icon size={20} strokeWidth={1.75} />
                    </div>
                    <h3 className="mt-6 font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                      {service.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                      {service.description}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>

          <Reveal delay={0.1} className="mt-16 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-8 sm:p-10">
            <span className="font-mono-tech text-[11px] tracking-[0.1em] text-[color:var(--color-accent-secondary)]">
              DIVISION OF
            </span>
            <p className="mt-3 font-display text-xl font-semibold leading-snug text-[color:var(--color-text-primary)] sm:text-2xl">
              Xeltrio Technologies Private Limited
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
              HamiaWorks AI is where Xeltrio applies its AI expertise directly, one business at a
              time — while BusinessOS and the wider ecosystem bring that same intelligence to a
              platform businesses can run on themselves.
            </p>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
