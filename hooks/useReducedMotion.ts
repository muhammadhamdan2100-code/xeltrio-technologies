"use client";

import { useEffect, useState } from "react";

function getInitialPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Tracks the user's `prefers-reduced-motion` preference so scroll
 * choreography and the 3D hero can branch into a static/reduced path.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(getInitialPreference);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  return reduced;
}
