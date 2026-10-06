"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer, requestContext, resolveSiteOrigin } from "@/lib/supabase/server";
import { isSiteOriginConfigured } from "@/lib/supabase/env";
import { recordAuditEvent } from "@/lib/authz/audit";

export type FormState = { status: "idle" | "error" | "success"; message?: string };

/** Only same-origin absolute paths, never protocol-relative or external URLs. */
function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) return null;
  return next;
}

function field(form: FormData, name: string, max = 200): string {
  const value = form.get(name);
  return typeof value === "string" ? value.slice(0, max) : "";
}

export async function signInAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = field(form, "email", 320).trim().toLowerCase();
  const password = field(form, "password", 200);
  const next = safeNext(field(form, "next", 200) || null);

  if (!email || !password) return { status: "error", message: "Enter your email and password." };

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // Reason is deliberately generic: no account-existence leak.
    await recordAuditEvent({
      action: "login_failed",
      resourceType: "auth",
      metadata: { reason: "invalid_credentials" },
    });
    return { status: "error", message: "Those credentials did not match an active account." };
  }

  if (data.user.email_confirmed_at === null && !data.user.email) {
    await recordAuditEvent({
      action: "login_blocked_unverified",
      resourceType: "auth",
      actorUserId: data.user.id,
      metadata: {},
    });
    return { status: "error", message: "This account still needs email verification." };
  }

  await recordAuditEvent({
    action: "login",
    resourceType: "auth",
    actorUserId: data.user.id,
    metadata: {},
  });

  redirect(next ?? "/admin");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  const actor = data.user?.id ?? null;

  await recordAuditEvent({ action: "logout", resourceType: "auth", actorUserId: actor, metadata: {} });
  await supabase.auth.signOut({ scope: "local" });

  redirect("/");
}

export async function forgotPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = field(form, "email", 320).trim().toLowerCase();
  if (!email) return { status: "error", message: "Enter your email address." };

  const supabase = await createSupabaseServer();
  const origin = await resolveSiteOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    origin ? { redirectTo: `${origin}/auth/callback?next=/reset-password` } : {},
  );

  await recordAuditEvent({
    action: "password_reset_requested",
    resourceType: "auth",
    // Never store the address. Only operational facts.
    metadata: { delivered: !error, originConfigured: isSiteOriginConfigured() },
  });

  if (!isSiteOriginConfigured()) {
    await recordAuditEvent({
      action: "security_event",
      resourceType: "auth",
      metadata: { event: "site_url_unconfigured" },
    });
  }

  // Identical response whether or not the address exists.
  return {
    status: "success",
    message: "If an account exists for that address, a recovery link has been sent. Check your inbox.",
  };
}


export async function resetPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const password = field(form, "password", 200);
  const confirm = field(form, "confirm", 200);

  if (password.length < 8) return { status: "error", message: "Use at least 8 characters." };
  if (password !== confirm) return { status: "error", message: "The passwords do not match." };

  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { status: "error", message: "This recovery link is no longer valid. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    await recordAuditEvent({
      action: "security_event",
      resourceType: "auth",
      actorUserId: data.user.id,
      metadata: { event: "password_reset_failed" },
    });
    return { status: "error", message: "The password could not be updated. Request a new recovery link." };
  }

  await recordAuditEvent({
    action: "password_reset",
    resourceType: "auth",
    actorUserId: data.user.id,
    metadata: {},
  });

  redirect("/admin");
}

/** Own-profile edit. Role/status/metadata are not read from the form at all. */
export async function updateProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  const fullName = field(form, "full_name", 160).trim();
  const avatarUrl = field(form, "avatar_url", 500).trim();

  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { status: "error", message: "Sign in to update your profile." };

  if (avatarUrl && !/^https:\/\/[^/]+$/i.test(avatarUrl) && !avatarUrl.startsWith("/")) {
    return { status: "error", message: "Avatar URL must be HTTPS or a site-relative path." };
  }

  const payload: Record<string, string> = {};
  if (fullName) payload.full_name = fullName;
  if (avatarUrl) payload.avatar_url = avatarUrl;
  if (Object.keys(payload).length === 0) return { status: "error", message: "Nothing to update." };

  const { error } = await supabase.from("profiles").update(payload).eq("id", data.user.id);
  if (error) {
    const { ip } = await requestContext();
    await recordAuditEvent({
      action: "authorization_denied",
      resourceType: "profiles",
      resourceId: data.user.id,
      actorUserId: data.user.id,
      metadata: { surface: "profile_settings", hasIp: Boolean(ip) },
    });
    return { status: "error", message: "That change is not allowed for your account." };
  }

  await recordAuditEvent({
    action: "profile_update",
    resourceType: "profiles",
    resourceId: data.user.id,
    actorUserId: data.user.id,
    metadata: { fields: Object.keys(payload) },
  });

  return { status: "success", message: "Profile updated." };
}
