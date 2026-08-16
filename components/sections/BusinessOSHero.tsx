"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";

const EnterpriseNetworkCanvas = dynamic(() => import("@/components/canvas/EnterpriseNetworkCanvas"), { ssr: false });

export function BusinessOSHero() {
  return (
    <section className="relative overflow-hidden border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] pb-20 pt-16 lg:pb-28 lg:pt-20">
      <div className="grid-lines absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-bg-primary)_78%)]" aria-hidden="true" />
      <EnterpriseNetworkCanvas />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-12">
        <Reveal className="max-w-3xl">
          <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
            FLAGSHIP PRODUCT
          </span>
          <h1 className="mt-5 font-display text-[38px] font-semibold leading-[1.1] tracking-[-0.01em] text-[color:var(--color-text-primary)] sm:text-[50px] lg:text-[60px]">
            BusinessOS
            <br />
            <span className="text-gradient-accent">The enterprise AI operating system.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-[16px] leading-relaxed text-[color:var(--color-text-secondary)] sm:text-[18px]">
            BusinessOS is not ERP software with an AI feature bolted on. It&apos;s an intelligent
            platform that runs the operational core of a business — decisions, workflows, and
            data — through a single AI orchestration layer.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/businessos/features"
              data-cursor="button"
              className="rounded-full bg-[color:var(--color-accent-primary)] px-6 py-3 text-sm font-medium text-[#050816] transition-transform duration-300 hover:scale-[1.03] hover:brightness-110"
            >
              Explore the features
            </Link>
            <Link
              href="/businessos/architecture"
              data-cursor="button"
              className="rounded-full border border-[color:var(--color-border)] px-6 py-3 text-sm font-medium text-[color:var(--color-text-primary)] transition-colors duration-300 hover:border-[color:var(--color-accent-primary)]"
            >
              See the architecture
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
