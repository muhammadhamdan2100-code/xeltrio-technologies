"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/authz/audit";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/authz/permissions";

export type FormState = { status: "idle" | "error" | "success"; message?: string };

/** The live user_account_status enum (018). Anything else is rejected before it reaches SQL. */
const ACCOUNT_STATUSES = ["active", "pending_verification", "suspended", "archived"] as const;
type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function field(form: FormData, name: string, max = 400): string {
  const v = form.get(name);
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

/** Ids are validated for shape only — they never grant anything. RLS + can() decide. */
function targetId(form: FormData): string | null {
  const id = field(form, "id", 40).toLowerCase();
  return UUID_RE.test(id) ? id : null;
}

export type TargetUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  status: AccountStatus;
  created_at: string | null;
};

/**
 * Read the row we are about to act on through admin_profiles(), which raises
 * 42501 unless the caller is an administrator. The value is server-derived: the
 * browser never tells us what the target's current role or status is.
 */
async function loadTarget(id: string): Promise<TargetUser | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("admin_profiles");
  if (error || !Array.isArray(data)) return null;
  const row = data.find((r) => String(r.id) === id) as TargetUser | undefined;
  return row ?? null;
}

/** Count active super admins so a UI click can never leave the system unowned. */
async function activeSuperAdmins(): Promise<number> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("admin_profiles");
  if (error || !Array.isArray(data)) return -1;
  return data.filter((r) => r.role === "super_admin" && r.status === "active").length;
}

/**
 * Edit the permitted profile fields of another account. role and status are not
 * read from this form at all — they have their own authorized actions.
 */
export async function updateUserAction(_prev: FormState, form: FormData): Promise<FormState> {
  const auth = await authorize("users", "edit");
  if (!auth.ok) return { status: "error", message: auth.message };

  const id = targetId(form);
  if (!id) return { status: "error", message: "Unknown account." };

  const fullName = field(form, "full_name", 120);
  if (!fullName) return { status: "error", message: "Full name is required." };

  const avatar = field(form, "avatar_url", 500);
  if (avatar && !/^https?:\/\/\S+$/i.test(avatar)) {
    return { status: "error", message: "Avatar must be an absolute http(s) URL." };
  }

  const supabase = await createSupabaseServer();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("id", id);
  if (!count) return { status: "error", message: "That account is not visible to you." };

  const patch: Record<string, unknown> = { full_name: fullName };
  if (avatar) patch.avatar_url = avatar;

  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) return { status: "error", message: "The update was rejected." };

  await recordAuditEvent({
    action: "admin_user_updated",
    resourceType: "users",
    resourceId: id,
    actorUserId: auth.value.userId,
    metadata: { fields: Object.keys(patch) },
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return { status: "success", message: "Profile saved." };
}

/** Disable (suspended) or reactivate (active) an account. */
export async function setUserStatusAction(_prev: FormState, form: FormData): Promise<FormState> {
  const auth = await authorize("users", "manage");
  if (!auth.ok) return { status: "error", message: auth.message };

  const id = targetId(form);
  if (!id) return { status: "error", message: "Unknown account." };

  const wanted = field(form, "status", 30) as AccountStatus;
  if (!ACCOUNT_STATUSES.includes(wanted)) return { status: "error", message: "Unsupported account status." };

  const target = await loadTarget(id);
  if (!target) return { status: "error", message: "That account is not visible to you." };

  if (id === auth.value.userId && wanted !== "active") {
    return { status: "error", message: "You cannot deactivate your own account." };
  }

  if (wanted !== "active") {
    const confirm = field(form, "confirm", 20).toUpperCase();
    if (confirm !== "DISABLE") return { status: "error", message: "Type DISABLE to confirm this change." };
    if (target.role === "super_admin" && target.status === "active") {
      const others = await activeSuperAdmins();
      if (others <= 1) return { status: "error", message: "This is the only active super admin account." };
    }
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("profiles").update({ status: wanted }).eq("id", id);
  if (error) return { status: "error", message: "The status change was rejected." };

  await recordAuditEvent({
    action: wanted === "active" ? "admin_user_enabled" : "admin_user_disabled",
    resourceType: "users",
    resourceId: id,
    actorUserId: auth.value.userId,
    metadata: { from: target.status, to: wanted },
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return { status: "success", message: wanted === "active" ? "Account reactivated." : "Account deactivated." };
}

/** Assign or change a role. Authorization is roles:manage, which only super_admin holds. */
export async function assignRoleAction(_prev: FormState, form: FormData): Promise<FormState> {
  const auth = await authorize("roles", "manage");
  if (!auth.ok) return { status: "error", message: auth.message };

  const id = targetId(form);
  if (!id) return { status: "error", message: "Unknown account." };

  const wanted = field(form, "role", 30) as Role;
  if (!ROLES.includes(wanted)) return { status: "error", message: "Unknown role." };

  const target = await loadTarget(id);
  if (!target) return { status: "error", message: "That account is not visible to you." };
  if (target.role === wanted) return { status: "error", message: "The account already holds that role." };

  if (id === auth.value.userId) {
    return { status: "error", message: "You cannot change your own role." };
  }

  if (target.role === "super_admin" || wanted === "super_admin") {
    const confirm = field(form, "confirm", 20).toUpperCase();
    if (confirm !== "GRANT") {
      return { status: "error", message: "Type GRANT to confirm a super admin change." };
    }
  }

  if (target.role === "super_admin") {
    const others = await activeSuperAdmins();
    if (others <= 1) return { status: "error", message: "This is the only active super admin account." };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("profiles").update({ role: wanted }).eq("id", id);
  if (error) {
    await recordAuditEvent({
      action: "security_event",
      resourceType: "users",
      resourceId: id,
      actorUserId: auth.value.userId,
      metadata: { reason: "role_change_rejected", attempted: wanted },
    });
    return { status: "error", message: "The database rejected this role change." };
  }

  await recordAuditEvent({
    action: target.role ? "role_changed" : "role_assigned",
    resourceType: "users",
    resourceId: id,
    actorUserId: auth.value.userId,
    metadata: { from: target.role, to: wanted },
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/roles");
  revalidatePath(`/admin/users/${id}`);
  return { status: "success", message: `Role set to ${ROLE_LABELS[wanted]}.` };
}

/**
 * Delete a profile row. Only super_admin holds users:delete. The auth.users row
 * is owned by Supabase Auth and is not reachable without the Admin API, so this
 * removes application access and the profile only — the login record stays until
 * an owner deletes it in the Auth dashboard.
 */
export async function deleteUserAction(_prev: FormState, form: FormData): Promise<FormState> {
  const auth = await authorize("users", "delete");
  if (!auth.ok) return { status: "error", message: auth.message };

  const id = targetId(form);
  if (!id) return { status: "error", message: "Unknown account." };
  if (id === auth.value.userId) return { status: "error", message: "You cannot delete your own account." };

  const confirm = field(form, "confirm", 20).toUpperCase();
  if (confirm !== "DELETE") return { status: "error", message: "Type DELETE to confirm." };

  const target = await loadTarget(id);
  if (!target) return { status: "error", message: "That account is not visible to you." };

  if (target.role === "super_admin") {
    const others = await activeSuperAdmins();
    if (others <= 1) return { status: "error", message: "This is the only active super admin account." };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) return { status: "error", message: "The account could not be deleted." };

  await recordAuditEvent({
    action: "admin_user_deleted",
    resourceType: "users",
    resourceId: id,
    actorUserId: auth.value.userId,
    metadata: { role: target.role },
  });
  revalidatePath("/admin/users");
  return { status: "success", message: "Profile deleted. The sign-in record still exists in Supabase Auth." };
}
