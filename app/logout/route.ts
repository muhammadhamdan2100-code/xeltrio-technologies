import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { loadPrincipal } from "@/lib/authz/guards";
import { recordAuditEvent } from "@/lib/authz/audit";

/**
 * POST-only so a crawler or <img> cannot log anyone out. The session cookie is
 * httpOnly + sameSite=lax, which is what actually prevents cross-site sends.
 */
export async function POST(request: Request) {
  const principal = await loadPrincipal();

  if (principal.ok) {
    await recordAuditEvent({
      action: "logout",
      resourceType: "auth",
      actorUserId: principal.value.userId,
      metadata: { via: "route" },
    });
  }

  const supabase = await createSupabaseServer();
  await supabase.auth.signOut({ scope: "local" });

  const response = NextResponse.redirect(new URL("/", request.url));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET() {
  return new NextResponse("Method not allowed", { status: 405 });
}
