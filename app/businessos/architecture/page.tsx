import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { FlowDiagram } from "@/components/sections/FlowDiagram";

export const metadata: Metadata = {
  title: "BusinessOS Architecture — Xeltrio Technologies",
  description:
    "How a request moves through BusinessOS — from the person making it, through the AI and automation engines, into the modules, and back out as an operational decision.",
};

export default function BusinessOSArchitecturePage() {
  return (
    <>
      <PageHeader
        compact
        eyebrow="ARCHITECTURE"
        title={
          <>
            From a request
            <br />
            to a decision.
          </>
        }
        description="Tap a stage to see what happens there. This is the same path every action takes through BusinessOS, whether it starts with a person or an agent."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[900px] px-6 lg:px-12">
          <FlowDiagram />
        </div>
      </section>

      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-secondary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <Reveal className="max-w-2xl">
            <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
              ONE STACK, NOT A BUNDLE
            </span>
            <h2 className="mt-5 font-display text-[30px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[36px]">
              Nothing here was acquired and stitched together.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-[color:var(--color-text-secondary)]">
              Every layer above — from the interface down to the database — was engineered as
              part of one architecture. That&apos;s what lets a new module, like EducationOS or
              HospitalOS, plug into the same AI Engine and Automation Engine instead of shipping
              its own from scratch.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
