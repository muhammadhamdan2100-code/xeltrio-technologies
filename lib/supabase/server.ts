import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabaseConfig, siteOrigin } from "./env";

/**
 * Server-side Supabase client bound to the request cookies.
 * Uses getUser() (network-validated) for authorization — never getSession(),
 * which only reads the local token pair.
 */
export async function createSupabaseServer() {
  const { url, key } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookie writes are not allowed.
          // Session refreshing happens in proxy.ts and in Server Actions instead.
        }
      },
    },
  });
}

/** Forwarded client IP, used only for security auditing. Never logged or returned. */
export async function requestContext() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : null;
  return { ip: ip || null, userAgent: h.get("user-agent") || null };
}

/** Absolute origin for auth redirects, derived from config or the live request. */
export async function resolveSiteOrigin(): Promise<string | null> {
  const h = await headers();
  return siteOrigin({
    protocol: h.get("x-forwarded-proto") ?? "https",
    host: h.get("host"),
    forwardedProto: h.get("x-forwarded-proto"),
    forwardedHost: h.get("x-forwarded-host"),
  });
}
