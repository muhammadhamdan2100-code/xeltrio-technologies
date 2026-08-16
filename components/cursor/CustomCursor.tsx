"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";

type Zone = "default" | "button" | "link" | "card";

const PARTICLE_COUNT = 8;
const DOT_LERP = 0.35;
const RING_LERP = 0.16;
const MAGNETIC_STRENGTH = 0.28;
const MAGNETIC_MAX = 14;

function detectEligible(): boolean {
  if (typeof window === "undefined") return false;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return finePointer && !reducedMotion;
}

function resolveZone(target: Element | null): { zone: Zone; magneticEl: HTMLElement | null } {
  if (!target) return { zone: "default", magneticEl: null };

  const explicitButton = target.closest<HTMLElement>('[data-cursor="button"]');
  if (explicitButton) return { zone: "button", magneticEl: explicitButton };

  const navOrFooterLink = target.closest<HTMLElement>("nav a, footer a");
  if (navOrFooterLink) return { zone: "link", magneticEl: navOrFooterLink };

  const linkOrButton = target.closest<HTMLElement>("a[href], button");
  if (linkOrButton) return { zone: "button", magneticEl: linkOrButton };

  const card = target.closest<HTMLElement>(".glass-panel");
  if (card) return { zone: "card", magneticEl: card };

  return { zone: "default", magneticEl: null };
}

/**
 * This component is only ever mounted client-side (its loader imports it
 * with `ssr:false`), so resolving eligibility (fine pointer, no reduced
 * motion) during the initial render is safe — no hydration mismatch.
 */
export default function CustomCursor() {
  const [eligible] = useState<boolean>(detectEligible);
  const [heroLabelVisible, setHeroLabelVisible] = useState(false);

  const dotElRef = useRef<HTMLDivElement>(null);
  const ringElRef = useRef<HTMLDivElement>(null);
  const labelElRef = useRef<HTMLDivElement>(null);
  const rippleContainerRef = useRef<HTMLDivElement>(null);
  const particleElsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!eligible) return;

    document.documentElement.classList.add("has-custom-cursor");

    const raw = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const dot = { x: raw.x, y: raw.y };
    const ring = { x: raw.x, y: raw.y };

    let zone: Zone = "default";
    let inHero = false;
    let ringRotation = 0;
    let baseScale = 1;
    let currentScale = 1;
    let loaded = document.readyState === "complete";

    let lastScrollY = window.scrollY;
    let stretch = 1;

    let magneticEl: HTMLElement | null = null;
    let magneticX: gsap.QuickToFunc | null = null;
    let magneticY: gsap.QuickToFunc | null = null;

    const particleState = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
    }));
    let particleCursor = 0;
    let framesSinceSpawn = 0;

    const clearMagnetic = () => {
      if (magneticEl) {
        gsap.to(magneticEl, { x: 0, y: 0, duration: 0.6, ease: "power3.out" });
      }
      magneticEl = null;
      magneticX = null;
      magneticY = null;
    };

    const onPointerMove = (e: PointerEvent) => {
      raw.x = e.clientX;
      raw.y = e.clientY;

      const target = document.elementFromPoint(e.clientX, e.clientY);
      const resolved = resolveZone(target);
      zone = resolved.zone;

      const heroEl = document.getElementById("home");
      if (heroEl) {
        const rect = heroEl.getBoundingClientRect();
        inHero = e.clientY >= rect.top && e.clientY <= rect.bottom && rect.height > 0;
      } else {
        inHero = false;
      }
      setHeroLabelVisible(inHero);

      if (resolved.magneticEl !== magneticEl) {
        clearMagnetic();
        if (resolved.magneticEl && (zone === "button" || zone === "card")) {
          magneticEl = resolved.magneticEl;
          magneticX = gsap.quickTo(magneticEl, "x", { duration: 0.5, ease: "power3.out" });
          magneticY = gsap.quickTo(magneticEl, "y", { duration: 0.5, ease: "power3.out" });
        }
      }

      if (magneticEl && magneticX && magneticY) {
        const rect = magneticEl.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        magneticX(Math.max(-MAGNETIC_MAX, Math.min(MAGNETIC_MAX, relX * MAGNETIC_STRENGTH)));
        magneticY(Math.max(-MAGNETIC_MAX, Math.min(MAGNETIC_MAX, relY * MAGNETIC_STRENGTH)));
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const container = rippleContainerRef.current;
      if (!container) return;
      const ripple = document.createElement("div");
      ripple.className = "xeltrio-cursor-ripple";
      ripple.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      container.appendChild(ripple);
      const animation = ripple.animate(
        [
          { transform: `translate3d(${e.clientX}px, ${e.clientY}px, 0) scale(0.4)`, opacity: 0.6 },
          { transform: `translate3d(${e.clientX}px, ${e.clientY}px, 0) scale(2.6)`, opacity: 0 },
        ],
        { duration: 350, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
      );
      animation.onfinish = () => ripple.remove();

      currentScale = Math.max(0.7, currentScale - 0.15);
    };

    const onScroll = () => {
      const delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      stretch = Math.max(0.85, Math.min(1.35, 1 + Math.abs(delta) * 0.03));
    };

    const onLoad = () => {
      loaded = true;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!loaded) window.addEventListener("load", onLoad);

    let rafId = 0;
    const tick = () => {
      dot.x += (raw.x - dot.x) * DOT_LERP;
      dot.y += (raw.y - dot.y) * DOT_LERP;
      ring.x += (raw.x - ring.x) * RING_LERP;
      ring.y += (raw.y - ring.y) * RING_LERP;

      stretch += (1 - stretch) * 0.12;

      const loadingPulse = loaded ? 0 : Math.sin(performance.now() / 260) * 0.12;
      baseScale = zone === "button" ? 1.65 : zone === "card" ? 1.4 : 1;
      const heroBump = inHero ? 0.18 : 0;
      const targetScale = baseScale + heroBump + loadingPulse;
      currentScale += (targetScale - currentScale) * 0.18;

      if (inHero) ringRotation += 0.35;

      if (dotElRef.current) {
        dotElRef.current.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringElRef.current) {
        const stretchY = zone === "link" ? 1 : stretch;
        const stretchX = zone === "link" ? 1 : 2 - stretch;
        ringElRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) rotate(${ringRotation}deg) scale(${currentScale * stretchX}, ${currentScale * stretchY})`;
        ringElRef.current.dataset.zone = zone;
        ringElRef.current.dataset.hero = String(inHero);
      }
      if (labelElRef.current) {
        labelElRef.current.style.transform = `translate3d(${ring.x + 26}px, ${ring.y + 22}px, 0)`;
      }

      if (inHero) {
        framesSinceSpawn += 1;
        if (framesSinceSpawn > 8) {
          framesSinceSpawn = 0;
          const idx = particleCursor % PARTICLE_COUNT;
          particleCursor += 1;
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.6 + Math.random() * 1.1;
          particleState[idx] = {
            x: ring.x,
            y: ring.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
          };
        }
      }

      particleState.forEach((p, i) => {
        const el = particleElsRef.current[i];
        if (!el) return;
        if (p.life <= 0) {
          el.style.opacity = "0";
          return;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.018;
        el.style.opacity = String(Math.max(0, p.life * 0.7));
        el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
      });

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("load", onLoad);
      document.documentElement.classList.remove("has-custom-cursor");
      clearMagnetic();
    };
  }, [eligible]);

  if (!eligible) return null;

  return (
    <>
      <div ref={dotElRef} className="xeltrio-cursor-dot" aria-hidden="true" />
      <div ref={ringElRef} className="xeltrio-cursor-ring" data-zone="default" data-hero="false" aria-hidden="true" />
      <div ref={rippleContainerRef} aria-hidden="true" />
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            particleElsRef.current[i] = el;
          }}
          className="xeltrio-cursor-particle"
          aria-hidden="true"
        />
      ))}
      <div ref={labelElRef} style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none" }} aria-hidden="true">
        <AnimatePresence>
          {heroLabelVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="xeltrio-cursor-label"
            >
              Explore
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
