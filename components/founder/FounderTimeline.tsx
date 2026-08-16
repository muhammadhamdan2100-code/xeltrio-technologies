"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FOUNDER_TIMELINE } from "@/lib/constants";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function FounderTimeline() {
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
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: trackRef.current,
              start: "top 75%",
              end: "bottom 65%",
              scrub: 0.6,
            },
          }
        );
      }

      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { opacity: 0, x: -24 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            ease: "power3.out",
            delay: (i % 3) * 0.05,
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
    <div ref={trackRef} className="relative pl-10 sm:pl-14">
      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-[color:var(--color-border)] sm:left-[11px]" aria-hidden="true" />
      <div
        ref={lineRef}
        className="absolute left-[7px] top-1 w-px origin-top bg-[color:var(--color-accent-primary)] sm:left-[11px]"
        style={{ height: "100%", ...(reducedMotion ? { transform: "scaleY(1)" } : undefined) }}
        aria-hidden="true"
      />

      <div className="flex flex-col gap-10">
        {FOUNDER_TIMELINE.map((step, i) => (
          <div
            key={step.label}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="relative"
          >
            <span
              className={
                i === FOUNDER_TIMELINE.length - 1
                  ? "absolute -left-10 top-1 h-4 w-4 rounded-full border border-[color:var(--color-accent-primary)] bg-[color:var(--color-accent-primary)] sm:-left-14"
                  : "absolute -left-10 top-1 h-4 w-4 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-secondary)] sm:-left-14"
              }
              aria-hidden="true"
            />
            <p className="font-mono-tech text-[11px] uppercase tracking-[0.1em] text-[color:var(--color-text-muted)]">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 font-display text-lg font-semibold text-[color:var(--color-text-primary)] sm:text-xl">
              {step.label}
            </h3>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
              {step.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
