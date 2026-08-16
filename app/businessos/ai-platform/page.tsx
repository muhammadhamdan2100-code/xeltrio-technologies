import type { Metadata } from "next";
import {
  Users,
  Crown,
  Workflow,
  BookOpen,
  Lightbulb,
  FileBarChart,
  BarChart3,
  Cpu,
  Bot,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { AI_PLATFORM_CAPABILITIES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "AI Platform — Xeltrio Technologies",
  description:
    "The AI layer underneath BusinessOS — AI Employees, AI Directors, decision support, and the workflow engine that ties every module together.",
};

const AI_ICONS = [Users, Crown, Workflow, BookOpen, Lightbulb, FileBarChart, BarChart3, Cpu, Bot, Sparkles];

export default function AIPlatformPage() {
  return (
    <>
      <PageHeader
        compact
        eyebrow="AI PLATFORM"
        title={
          <>
            The intelligence
            <br />
            underneath everything.
          </>
        }
        description="BusinessOS isn't software with an AI feature. It's an AI platform with software as the interface — here's what's actually running underneath."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {AI_PLATFORM_CAPABILITIES.map((item, i) => {
              const Icon = AI_ICONS[i];
              return (
                <RevealItem key={item.title}>
                  <div className="glass-panel h-full rounded-2xl p-7 transition-transform duration-500 hover:-translate-y-1.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-accent-primary)]/10 text-[color:var(--color-accent-secondary)]">
                      <Icon size={20} strokeWidth={1.75} />
                    </div>
                    <h3 className="mt-6 font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                      {item.description}
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
