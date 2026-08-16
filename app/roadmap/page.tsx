import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoadmapTimeline } from "@/components/sections/RoadmapTimeline";

export const metadata: Metadata = {
  title: "Roadmap — Xeltrio Technologies",
  description:
    "From corporate launch to a global AI ecosystem — the Xeltrio Technologies product roadmap, starting with BusinessOS and EducationOS.",
};

export default function RoadmapPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="ROADMAP"
        title={
          <>
            From corporate launch
            <br />
            to global ecosystem.
          </>
        }
        description="Tap a stage to see what it means. This roadmap will keep expanding as each product ships."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[900px] px-6 lg:px-12">
          <RoadmapTimeline />
        </div>
      </section>
    </PageShell>
  );
}
