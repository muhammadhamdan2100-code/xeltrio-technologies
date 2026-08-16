"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Reveal } from "@/components/motion/Reveal";
import { COMPANY_ROADMAP_STEPS } from "@/lib/constants";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function CompanyRoadmap() {
  const trackRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: trackRef.current,
              start: "top 75%",
              end: "bottom 60%",
              scrub: 0.6,
            },
          }
        );
      }

      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            delay: (i % 4) * 0.05,
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, trackRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section className="relative border-t border-[color:var(--color-border-subtle)] bg-[color:var(--color-bg-primary)] py-28 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="font-mono-tech text-[12px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
            COMPANY ROADMAP
          </span>
          <h2 className="mt-5 font-display text-[34px] font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[42px]">
            From an AI agency to a global technology company.
          </h2>
        </Reveal>

        <div ref={trackRef} className="relative mt-20">
          <div className="absolute left-0 right-0 top-3 hidden h-px bg-[color:var(--color-border)] lg:block" aria-hidden="true" />
          <div
            ref={lineRef}
            className="absolute left-0 right-0 top-3 hidden h-px origin-left bg-[color:var(--color-accent-primary)] lg:block"
            style={reducedMotion ? { transform: "scaleX(1)" } : undefined}
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-7 lg:gap-4">
            {COMPANY_ROADMAP_STEPS.map((step, i) => (
              <div
                key={step.label}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className="relative pl-8 lg:pl-0 lg:pt-10"
              >
                <span
                  className="absolute left-0 top-1 h-2.5 w-2.5 rounded-full border border-[color:var(--color-accent-primary)] bg-[color:var(--color-bg-primary)] lg:left-0 lg:top-0"
                  aria-hidden="true"
                />
                <p className="font-mono-tech text-[10px] tracking-[0.08em] text-[color:var(--color-text-muted)]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-base font-semibold leading-snug text-[color:var(--color-text-primary)]">
                  {step.label}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
