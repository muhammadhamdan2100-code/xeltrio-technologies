import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { recordAuditEvent } from "@/lib/authz/audit";
import type { Action, Resource, Role } from "./permissions";

export type Principal = {
  userId: string;
  email: string | null;
  fullName: string | null;
  role: Role;
  status: string;
};

export type DenialReason = "not_configured" | "unauthenticated" | "no_profile" | "forbidden";

export type AuthResult<T> = { ok: true; value: T } | { ok: false; reason: DenialReason; message: string };

/**
 * Identity is resolved from the JWT-validated user (auth.getUser(), which calls
 * the Auth service) plus the profile row read through the SECURITY DEFINER
 * session_profile() function. No client-supplied role/user id is ever trusted.
 */
export async function loadPrincipal(): Promise<AuthResult<Principal>> {
  if (!isSupabaseConfigured()) {
    return { ok: false, reason: "not_configured", message: "Authentication is not configured on this deployment." };
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseServer>>;
  try {
    supabase = await createSupabaseServer();
  } catch {
    return { ok: false, reason: "not_configured", message: "Authentication is not configured on this deployment." };
  }

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { ok: false, reason: "unauthenticated", message: "Authentication required." };

  const { data: profile, error } = await supabase.rpc("session_profile");
  if (error || !profile) {
    return { ok: false, reason: "no_profile", message: "Authenticated account has no usable profile." };
  }

  if (profile.status && profile.status !== "active") {
    return { ok: false, reason: "forbidden", message: "This account is not active." };
  }

  return {
    ok: true,
    value: {
      userId: user.id,
      email: (profile.email as string | null) ?? user.email ?? null,
      fullName: (profile.full_name as string | null) ?? null,
      role: profile.role as Role,
      status: (profile.status as string) ?? "active",
    },
  };
}

/** Ask the database. The TS matrix is display/seed only, never the gate. */
export async function can(principal: Principal, resource: Resource, action: Action): Promise<boolean> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("can", { p_resource: resource, p_action: action });
  if (error) return false;
  return data === true;
}

/** Page/layout guard: redirects instead of rendering protected output. */
export async function requireAuth(nextPath?: string): Promise<Principal> {
  const result = await loadPrincipal();
  if (result.ok) return result.value;
  if (result.reason === "unauthenticated" || result.reason === "not_configured") {
    redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  }
  redirect("/unauthorized");
}

export async function requirePermission(
  resource: Resource,
  action: Action,
  nextPath?: string,
): Promise<Principal> {
  const principal = await requireAuth(nextPath);
  if (!(await can(principal, resource, action))) {
    await recordAuditEvent({
      action: "authorization_denied",
      resourceType: resource,
      resourceId: action,
      actorUserId: principal.userId,
      metadata: { reason: "missing_permission", permission: `${resource}.${action}`, role: principal.role },
    });
    redirect("/unauthorized");
  }
  return principal;
}

/** Server Action / Route Handler guard: returns a result instead of throwing. */
export async function authorize(resource: Resource, action: Action): Promise<AuthResult<Principal>> {
  const principal = await loadPrincipal();
  if (!principal.ok) return principal;
  if (!(await can(principal.value, resource, action))) {
    await recordAuditEvent({
      action: "authorization_denied",
      resourceType: resource,
      resourceId: action,
      actorUserId: principal.value.userId,
      metadata: { permission: `${resource}.${action}`, role: principal.value.role },
    });
    return { ok: false, reason: "forbidden", message: "You do not have access to this operation." };
  }
  return principal;
}

export function isAuthorized(result: AuthResult<Principal>): result is { ok: true; value: Principal } {
  return result.ok;
}
