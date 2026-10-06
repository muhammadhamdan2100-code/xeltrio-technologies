import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/authz/audit";

function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) return "/admin";
  return next;
}

/**
 * PKCE code exchange. Route Handlers are not cached in Next 16, and cookie
 * writes are legal here (unlike Server Components).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    await recordAuditEvent({
      action: "security_event",
      resourceType: "auth",
      metadata: { event: "code_exchange_failed" },
    });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  await recordAuditEvent({
    action: "login",
    resourceType: "auth",
    actorUserId: data.user.id,
    metadata: { via: "pkce_callback" },
  });

  return NextResponse.redirect(new URL(next, request.url));
}
