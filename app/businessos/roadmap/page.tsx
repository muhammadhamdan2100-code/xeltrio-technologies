import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoadmapTimeline } from "@/components/sections/RoadmapTimeline";
import { BUSINESSOS_ROADMAP_STEPS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "BusinessOS Roadmap — Xeltrio Technologies",
  description:
    "Where BusinessOS is headed — from corporate launch through EducationOS, HospitalOS, RetailOS, a full enterprise platform, and global expansion.",
};

export default function BusinessOSRoadmapPage() {
  return (
    <>
      <PageHeader
        compact
        eyebrow="FUTURE ROADMAP"
        title={
          <>
            BusinessOS, from here
            <br />
            to a global platform.
          </>
        }
        description="Tap a stage to see what it means. BusinessOS is the foundation every stage after it is built on."
      />

      <section className="relative bg-[color:var(--color-bg-primary)] py-24 lg:py-32">
        <div className="mx-auto max-w-[900px] px-6 lg:px-12">
          <RoadmapTimeline steps={BUSINESSOS_ROADMAP_STEPS} />
        </div>
      </section>
    </>
  );
}
