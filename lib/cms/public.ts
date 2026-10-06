import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/env";

export type CmsItem = Record<string, unknown>;

export type CmsSection = {
  id: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  eyebrow: string | null;
  body: string | null;
  items: CmsItem[];
  props: Record<string, unknown>;
  sort_order: number;
};

export type PublishedPage = {
  id: string;
  key: string;
  slug: string;
  title: string;
  description: string | null;
  route: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  og_image_url: string | null;
  noindex: boolean;
  published_at: string | null;
  sections: CmsSection[];
};

/**
 * Cookie-free anonymous client for public reads.
 *
 * A separate factory exists so public rendering never touches the request
 * cookies: the SSR client would make every consuming route dynamic and would
 * carry the visitor's session into a code path that is meant to return only
 * anonymous, published, `is_public` data. Row-level security is the filter here
 * (pages/page_sections expose only status='published' to anon, system_settings
 * only is_public=true), so this client cannot read more than the browser could.
 */
function publicClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config?.url || !config.key) return null;
  return createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers: { "x-application-name": "xeltrio-public" } },
  });
}

/** Published page plus its visible sections, or null when the CMS has nothing to say about this route. */
export const getPublishedPage = cache(async (slug: string): Promise<PublishedPage | null> => {
  const client = publicClient();
  if (!client) return null;

  const { data: page, error } = await client
    .from("pages")
    .select("id,key,slug,title,description,route,seo_title,seo_description,seo_keywords,og_image_url,noindex,published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !page) return null;

  const { data: sections, error: sectionsError } = await client
    .from("page_sections")
    .select("id,section_type,title,subtitle,eyebrow,body,items,props,sort_order")
    .eq("page_id", page.id)
    .eq("is_visible", true)
    .eq("status", "published")
    .order("sort_order");

  if (sectionsError) return null;

  return {
    ...page,
    seo_keywords: Array.isArray(page.seo_keywords) ? page.seo_keywords.map(String) : [],
    sections: (sections ?? []) as CmsSection[],
  };
});

/**
 * Public settings only. `public_settings()` is the database function that
 * returns the `is_public = true` rows and nothing else; a private key can never
 * appear here even if this code is wrong, because the function itself filters.
 */
export const getPublicSettings = cache(async (): Promise<Record<string, unknown>> => {
  const client = publicClient();
  if (!client) return {};

  const { data, error } = await client.rpc("public_settings");
  if (error || !Array.isArray(data)) return {};

  const out: Record<string, unknown> = {};
  for (const row of data as { key: string; value: unknown }[]) {
    out[row.key] = row.value;
  }
  return out;
});

export function settingText(settings: Record<string, unknown>, key: string): string | null {
  const value = settings[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * Only same-site paths and http(s) absolute URLs are allowed to become links or
 * images. Blocks `javascript:`, `data:` and protocol-relative values reaching
 * the DOM through administrator-authored content.
 */
export function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw || raw.length > 500) return null;
  if (raw.startsWith("/")) return raw.startsWith("//") ? null : raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  return null;
}
