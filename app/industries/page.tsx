import type { Metadata } from "next";
import { CmsSections, cmsMetadata } from "@/components/cms/CmsPage";
import {
  GraduationCap,
  HeartPulse,
  ShoppingBag,
  Factory,
  UtensilsCrossed,
  Building,
  Truck,
  Store,
  Landmark,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { INDUSTRIES } from "@/lib/constants";

const fallbackMetadata: Metadata = {
  title: "Industries — Xeltrio Technologies",
  description:
    "The industries the Xeltrio ecosystem is built for — education, healthcare, retail, manufacturing, restaurant, real estate, logistics, SMEs, and enterprise.",
};

const INDUSTRY_ICONS = [
  GraduationCap,
  HeartPulse,
  ShoppingBag,
  Factory,
  UtensilsCrossed,
  Building,
  Truck,
  Store,
  Landmark,
];

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("industries", fallbackMetadata);
}

export default async function IndustriesPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="INDUSTRIES"
        title="Industry-specific"
        description="Every operating system in the Xeltrio ecosystem is designed for a different vertical — so intelligence, security, and scale are shared, not rebuilt per industry."
      />

      <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-28 lg:py-36">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
          <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((industry, i) => {
              const Icon = INDUSTRY_ICONS[i];
              return (
                <RevealItem key={industry.slug}>
                  <div className="glass-panel group h-full rounded-2xl p-8 transition-transform duration-500 hover:-translate-y-1.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-accent-primary)]/10 text-[color:var(--color-accent-secondary)]">
                      <Icon size={20} strokeWidth={1.75} />
                    </div>
                    <h3 className="mt-6 font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                      {industry.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                      {industry.description}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>
      <CmsSections slug="industries" />
    </PageShell>
  );
}
