"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/authz/audit";

export type FormState = { status: "idle" | "error" | "success"; message?: string };

const CATEGORIES = ["company", "contact", "branding", "social", "email", "notifications", "seo", "system"] as const;
type Category = (typeof CATEGORIES)[number];

/** Never editable through this UI, whatever the catalogue says. */
const FORBIDDEN_KEY = /secret|password|passwd|token|credential|service[_-]?role|api[_-]?key|private[_-]?key/i;

type SettingRow = {
  key: string;
  value: unknown;
  type: string;
  category: string;
  is_public: boolean;
};

function scalar(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

/**
 * Validate one submitted value against the row's declared type.
 * Returns { ok, stored } where `stored` is the value to write.
 */
function validate(type: string, raw: string): { ok: boolean; stored: unknown; message?: string } {
  const value = raw.trim();

  if (type === "boolean") {
    return { ok: true, stored: value === "on" || value === "true" };
  }
  if (value === "") return { ok: true, stored: "" };

  switch (type) {
    case "url":
      if (!/^https?:\/\/[^\s<>"']{2,490}$/i.test(value)) {
        return { ok: false, stored: null, message: "must be an absolute http(s) URL" };
      }
      return { ok: true, stored: value };
    case "email":
      if (!/^[^\s@<>"']+@[^\s@<>"]+\.[^\s@<>"']{2,}$/.test(value)) {
        return { ok: false, stored: null, message: "must be a valid email address" };
      }
      return { ok: true, stored: value };
    case "phone":
      if (!/^[+0-9()\-.\s]{5,30}$/.test(value)) {
        return { ok: false, stored: null, message: "must be a phone number" };
      }
      return { ok: true, stored: value };
    case "color":
      if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
        return { ok: false, stored: null, message: "must be a hex colour such as #1A2B3C" };
      }
      return { ok: true, stored: value };
    case "number": {
      const n = Number(value);
      if (!Number.isFinite(n) || Math.abs(n) > 1_000_000) return { ok: false, stored: null, message: "must be a number" };
      return { ok: true, stored: n };
    }
    case "json": {
      try {
        const parsed = JSON.parse(value) as unknown;
        const probe = JSON.stringify(parsed).toLowerCase();
        if (probe.includes("<script") || probe.includes("javascript:") || probe.includes("onerror=") || probe.includes("onload=")) {
          return { ok: false, stored: null, message: "contains executable markup" };
        }
        return { ok: true, stored: parsed };
      } catch {
        return { ok: false, stored: null, message: "must be valid JSON" };
      }
    }
    case "text":
      return { ok: true, stored: value.slice(0, 4000) };
    default:
      return { ok: true, stored: value.slice(0, 500) };
  }
}

/**
 * Save one settings category.
 *
 * The loop walks the DATABASE catalogue, not the submitted form: a key that is
 * not already an authorized row cannot be created, renamed or smuggled in as a
 * secret. Values are re-validated against each row's declared type, and no
 * category is allowed to hold anything that looks like a credential.
 */
export async function saveSettingsAction(_prev: FormState, form: FormData): Promise<FormState> {
  const auth = await authorize("settings", "edit");
  if (!auth.ok) return { status: "error", message: auth.message };

  const category = form.get("category");
  if (typeof category !== "string" || !CATEGORIES.includes(category as Category)) {
    return { status: "error", message: "Unknown settings section." };
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("admin_settings");
  if (error || !Array.isArray(data)) {
    return { status: "error", message: "The settings catalogue could not be read." };
  }

  const rows = (data as SettingRow[]).filter((r) => r.category === category);
  const patch: Record<string, unknown> = {};
  const problems: string[] = [];

  for (const row of rows) {
    if (FORBIDDEN_KEY.test(row.key)) continue;

    const submitted = form.get(row.key);
    if (typeof submitted !== "string") continue;

    const result = validate(row.type, submitted);
    if (!result.ok) {
      problems.push(`${row.key} ${result.message}`);
      continue;
    }
    if (scalar(result.stored) === scalar(row.value)) continue;
    patch[row.key] = result.stored;
  }

  if (problems.length) {
    return { status: "error", message: `Not saved — ${problems.join("; ")}.` };
  }
  if (Object.keys(patch).length === 0) {
    return { status: "error", message: "Nothing changed." };
  }

  let failed = 0;
  for (const [key, value] of Object.entries(patch)) {
    const { error: updateError } = await supabase.from("system_settings").update({ value }).eq("key", key);
    if (updateError) failed += 1;
  }

  if (failed) {
    await recordAuditEvent({
      action: "security_event",
      resourceType: "settings",
      actorUserId: auth.value.userId,
      metadata: { reason: "settings_write_rejected", category, count: failed },
    });
    return { status: "error", message: `${failed} value(s) were rejected by the database.` };
  }

  await recordAuditEvent({
    action: "settings_updated",
    resourceType: "settings",
    resourceId: category,
    actorUserId: auth.value.userId,
    metadata: { keys: Object.keys(patch), count: Object.keys(patch).length },
  });

  revalidatePath("/admin/settings");
  // Public pages read the is_public rows, so they are invalidated too.
  revalidatePath("/contact");
  return { status: "success", message: `Saved ${Object.keys(patch).length} value(s).` };
}
