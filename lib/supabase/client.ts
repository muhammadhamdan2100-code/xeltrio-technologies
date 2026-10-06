"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowser() {
  if (cached) return cached;
  const { url, key } = getSupabaseConfig();
  cached = createBrowserClient(url, key);
  return cached;
}
