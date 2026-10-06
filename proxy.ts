import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Early guard only — NOT the security boundary.
 * Every protected Server Component, Server Action and Route Handler re-verifies
 * authentication and authorization independently (see lib/authz/guards.ts).
 *
 * Next.js 16 renamed the deprecated middleware.ts convention to proxy.ts.
 * The runtime is Node.js and cannot be configured here.
 */
const PROTECTED_PATHS = ["/admin", "/app"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Only same-origin, absolute-path redirects are accepted (?next= is attacker-controlled). */
function safeRedirectTarget(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) return null;
  return next;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    // Unconfigured environment: pass through. Server-side guards still deny access.
    return response;
  }

  let sessionFound = false;

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    // Refresh the session so expired tokens are rotated before rendering.
    const { data } = await supabase.auth.getSession();
    sessionFound = Boolean(data.session);
  } catch {
    // Never let a session-refresh failure turn into a 500 or an open door.
    sessionFound = false;
  }

  if (!sessionFound && isProtected(pathname)) {
    const loginUrl = new URL("/login", request.url);
    const next = safeRedirectTarget(request.nextUrl.searchParams.get("next"));
    loginUrl.searchParams.set("next", next ?? pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/app/:path*", "/login", "/forgot-password", "/reset-password"],
};
