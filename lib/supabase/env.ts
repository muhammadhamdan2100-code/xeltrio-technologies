function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

export type SupabaseConfig = { url: string; key: string };

/**
 * Public, RLS-enforced credentials only. The service-role key is never read
 * here and must never reach this process' client-side surface.
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = read("NEXT_PUBLIC_SUPABASE_URL");
  const key = read("NEXT_PUBLIC_SUPABASE_ANON_KEY") ?? read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  try {
    getSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Absolute origin for auth redirect URLs. Prefers the explicitly configured
 * production origin; otherwise falls back to the current request's host so
 * preview and local flows still work.
 *
 * Returns null rather than inventing a value: Supabase rejects a relative
 * redirectTo, and guessing a production origin would silently break recovery.
 */
/**
 * Whether a production origin is *explicitly* configured. Distinct from
 * siteOrigin(), which also succeeds on a request-host fallback — recovery links
 * work either way, but only this form proves the deployment was configured.
 */
export function isSiteOriginConfigured(): boolean {
  const configured = read("NEXT_PUBLIC_SITE_URL");
  if (!configured) return false;
  try {
    const u = new URL(configured);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function siteOrigin(input: {
  protocol?: string | null;
  host?: string | null;
  forwardedProto?: string | null;
  forwardedHost?: string | null;
}): string | null {
  const configured = read("NEXT_PUBLIC_SITE_URL");
  if (configured) {
    try {
      const u = new URL(configured);
      if (u.protocol === "https:" || u.protocol === "http:") return u.origin;
    } catch {
      return null;
    }
  }

  const host = input.forwardedHost ?? input.host;
  if (!host) return null;
  const proto = (input.forwardedProto ?? input.protocol ?? "https").replace(/:$/, "");
  if (proto !== "https" && proto !== "http") return null;

  return `${proto}://${host}`;
}

