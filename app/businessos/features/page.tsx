import type { Metadata } from "next";
import {
  Bot,
  Workflow,
  Sparkles,
  BarChart3,
  FileBarChart,
  LayoutDashboard,
  FileText,
  BookOpen,
  Bell,
  CheckCircle2,
  Users,
  UserCog,
  Boxes,
  Wallet,
  ShieldCheck,
  Building2,
  Cloud,
  Plug,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { BUSINESSOS_FEATURES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "BusinessOS Features — Xeltrio Technologies",
  description:
    "Every feature inside BusinessOS — AI Assistant, workflow automation, analytics, CRM, HRMS, finance, and the platform-level capabilities that hold it all together.",
};

const FEATURE_ICONS = [
  Bot,
  Workflow,
  Sparkles,
  BarChart3,
  FileBarChart,
  LayoutDashboard,
  FileText,
  BookOpen,
  Bell,
  CheckCircle2,
  Users,
  UserCog,
  Boxes,
  Wallet,
  ShieldCheck,
  Building2,
  Cloud,
  Plug,
  TrendingUp,
];

export default function BusinessOSFeaturesPage() {
  return (
    <>
      <PageHeader
        compact
        eyebrow="BUSINESSOS FEATURES"
        title={
          <>
            Every capability,
            <br />
            one platform.
          </>
        }
        description="From the AI Assistant every role talks to, down to the platform-level guarantees underneath — here's everything BusinessOS actually does."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BUSINESSOS_FEATURES.map((feature, i) => {
              const Icon = FEATURE_ICONS[i] ?? Sparkles;
              return (
                <RevealItem key={feature.name}>
                  <div className="glass-panel h-full rounded-2xl p-7 transition-transform duration-500 hover:-translate-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-accent-primary)]/10 text-[color:var(--color-accent-secondary)]">
                        <Icon size={20} strokeWidth={1.75} />
                      </div>
                      <span className="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 font-mono-tech text-[10px] tracking-[0.06em] text-[color:var(--color-text-muted)]">
                        {feature.category}
                      </span>
                    </div>
                    <h3 className="mt-6 font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                      {feature.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                      {feature.description}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>
    </>
  );
}
