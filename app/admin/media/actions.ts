"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/authz/audit";

export type FormState = { status: "idle" | "error" | "success"; message?: string };

/** Storage-level ceilings in migrations 023 are absolute; this is the app-level bound. */
const DEFAULT_MAX_MB = 10;
const HARD_MAX_BYTES = 25 * 1024 * 1024;

/**
 * Read the configured upload ceiling from system_settings. Only an account that
 * already holds settings:view can see the row, so anyone else simply gets the
 * default — a missing permission can never raise the limit.
 */
async function maxUploadBytes(): Promise<number> {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.rpc("admin_settings");
    if (error || !Array.isArray(data)) return DEFAULT_MAX_MB * 1024 * 1024;
    const row = (data as { key: string; value: unknown }[]).find((r) => r.key === "system.media_max_upload_mb");
    const configured = Number(row?.value);
    if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_MAX_MB * 1024 * 1024;
    return Math.min(configured, HARD_MAX_BYTES / (1024 * 1024)) * 1024 * 1024;
  } catch {
    return DEFAULT_MAX_MB * 1024 * 1024;
  }
}

const ALLOWED: Record<string, { ext: string; sig: number[] }> = {
  "image/png": { ext: "png", sig: [0x89, 0x50, 0x4e, 0x47] },
  "image/jpeg": { ext: "jpg", sig: [0xff, 0xd8, 0xff] },
  "image/webp": { ext: "webp", sig: [0x52, 0x49, 0x46, 0x46] },
  "image/gif": { ext: "gif", sig: [0x47, 0x49, 0x46, 0x38] },
  "application/pdf": { ext: "pdf", sig: [0x25, 0x50, 0x44, 0x46] },
};

function safeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._-]/g, "_").replace(/^_+|_+$/g, "").slice(0, 120) || "asset";
}

/** Sniff the real content type from magic bytes — the declared type is never trusted. */
function sniff(bytes: Uint8Array): string | null {
  for (const [mime, rule] of Object.entries(ALLOWED)) {
    if (rule.sig.every((b, i) => bytes[i] === b)) return mime;
  }
  if (bytes[0] === 0x3c && bytes[1] === 0x3f) return null; // XML declaration etc.
  const head = new TextDecoder().decode(bytes.slice(0, 200)).trimStart();
  if (head.startsWith("<svg")) return "image/svg+xml";
  return null;
}

export async function uploadMediaAction(_prev: FormState, form: FormData): Promise<FormState> {
  const auth = await authorize("media", "create");
  if (!auth.ok) return { status: "error", message: auth.message };

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Choose a file to upload." };
  const maxBytes = await maxUploadBytes();
  if (file.size > maxBytes) {
    return { status: "error", message: `That file is larger than the ${Math.round(maxBytes / (1024 * 1024))} MB limit.` };
  }
  if (file.size > HARD_MAX_BYTES) return { status: "error", message: "That file exceeds the absolute upload ceiling." };

  const visibility = form.get("visibility") === "private" ? "private" : "public";
  const category = String(form.get("category") ?? "general");
  const allowedCategories = ["general", "logo", "icon", "product", "founder", "brand", "news", "media", "document"];
  if (!allowedCategories.includes(category)) return { status: "error", message: "Unknown media category." }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const detected = sniff(buffer);
  if (!detected) return { status: "error", message: "Unsupported or unverifiable file type (PNG, JPEG, WebP, GIF, SVG, PDF)." };
  if (visibility === "private" && detected === "image/svg+xml") {
    return { status: "error", message: "SVG is not accepted for private assets." };
  }

  const bucket = visibility === "private" ? "private-assets" : String(form.get("bucket") || "media");
  const publicBuckets = ["company-assets", "founder", "hm-signature", "logos", "media", "news", "products"];
  if (visibility === "public" && !publicBuckets.includes(bucket)) return { status: "error", message: "Unknown destination bucket." };

  const base = safeName(file.name);
  const ext = detected === "image/svg+xml" ? "svg" : (ALLOWED[detected]?.ext ?? "bin");
  const path = `${category}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const supabase = await createSupabaseServer();
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: detected,
    upsert: false,
    metadata: { uploadedBy: auth.value.userId, originalFilename: base, visibility },
  });
  if (uploadError) return { status: "error", message: "The upload was rejected by storage." };

  const { error: insertError } = await supabase.from("media_assets").insert({
    bucket_id: bucket,
    storage_path: path,
    original_filename: base,
    filename: path.split("/").pop() ?? base,
    mime_type: detected,
    size_bytes: buffer.byteLength,
    title: String(form.get("title") ?? base).slice(0, 200),
    alt_text: String(form.get("alt_text") ?? "").slice(0, 300) || null,
    description: String(form.get("description") ?? "").slice(0, 1000) || null,
    category,
    visibility,
    status: "draft",
    metadata: { detectedType: detected, declaredType: (file.type || "unset").slice(0, 80) },
  });

  if (insertError) {
    // Compensation: never leave an object that the catalogue does not describe.
    await supabase.storage.from(bucket).remove([path]);
    return { status: "error", message: "The upload could not be recorded, so it was rolled back." };
  }

  await recordAuditEvent({
    action: "media_uploaded",
    resourceType: "media_assets",
    actorUserId: auth.value.userId,
    metadata: { bucket, visibility, sizeBytes: buffer.byteLength, type: detected },
  });

  revalidatePath("/admin/media");
  return { status: "success", message: `Uploaded as ${detected} (${(buffer.byteLength / 1024).toFixed(0)} KB).` };
}

export async function updateMediaAction(_prev: FormState, form: FormData): Promise<FormState> {
  const id = String(form.get("id") ?? "").slice(0, 40);
  const auth = await authorize("media", "edit");
  if (!auth.ok || !id) return { status: "error", message: auth.ok ? "Missing asset." : auth.message };

  const visibility = form.get("visibility") === "private" ? "private" : "public";
  const supabase = await createSupabaseServer();
  const { data: existing } = await supabase.from("media_assets").select("bucket_id,visibility").eq("id", id).maybeSingle();
  if (!existing) return { status: "error", message: "Asset not found." };

  const targetBucket = visibility === "private" ? "private-assets" : String(existing.bucket_id === "private-assets" ? "media" : existing.bucket_id);

  const { error } = await supabase
    .from("media_assets")
    .update({
      alt_text: String(form.get("alt_text") ?? "").slice(0, 300) || null,
      title: String(form.get("title") ?? "").slice(0, 200) || null,
      description: String(form.get("description") ?? "").slice(0, 1000) || null,
      category: String(form.get("category") ?? "general"),
      visibility,
      status: String(form.get("status") ?? "draft"),
    })
    .eq("id", id);
  if (error) return { status: "error", message: "The change was rejected (check category and visibility)." };

  await recordAuditEvent({ action: "media_updated", resourceType: "media_assets", resourceId: id, actorUserId: auth.value.userId, metadata: { visibility } });
  if (existing.visibility !== visibility) {
    await recordAuditEvent({ action: "media_visibility_changed", resourceType: "media_assets", resourceId: id, actorUserId: auth.value.userId, metadata: { from: existing.visibility, to: visibility, targetBucket } });
  }

  revalidatePath("/admin/media");
  return { status: "success", message: "Asset updated." };
}

export async function deleteMediaAction(_prev: FormState, form: FormData): Promise<FormState> {
  const id = String(form.get("id") ?? "").slice(0, 40);
  if (String(form.get("confirm") ?? "").trim() !== "DELETE") {
    return { status: "error", message: "Type DELETE to confirm removal of the asset and its stored file." };
  }
  const auth = await authorize("media", "delete");
  if (!auth.ok) return { status: "error", message: auth.message };

  const supabase = await createSupabaseServer();

  const { data: asset } = await supabase
    .from("media_assets")
    .select("bucket_id,storage_path,visibility,size_bytes")
    .eq("id", id)
    .maybeSingle();
  if (!asset) return { status: "error", message: "That asset is not visible to you." };

  // The file must go first: a missing object is recoverable, an uncontrolled
  // storage object left behind by a deleted record is not. SQL deletes on
  // storage.objects are refused by Supabase itself, so this goes through the
  // Storage API as the same user, whose media:delete grant the
  // storage_delete_authorized policy honours.
  const { error: storageError } = await supabase.storage
    .from(String(asset.bucket_id))
    .remove([String(asset.storage_path)]);
  if (storageError) {
    await recordAuditEvent({
      action: "security_event",
      resourceType: "media_assets",
      resourceId: id,
      actorUserId: auth.value.userId,
      metadata: { reason: "media_object_delete_failed", bucket: asset.bucket_id },
    });
    return { status: "error", message: "The stored file could not be deleted. Nothing was removed from the library." };
  }

  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) {
    await recordAuditEvent({
      action: "security_event",
      resourceType: "media_assets",
      resourceId: id,
      actorUserId: auth.value.userId,
      metadata: { reason: "media_row_delete_after_object_removal", bucket: asset.bucket_id, path: asset.storage_path },
    });
    return { status: "error", message: "The file was removed but the catalogue row could not be deleted." };
  }

  await recordAuditEvent({
    action: "media_deleted",
    resourceType: "media_assets",
    resourceId: id,
    actorUserId: auth.value.userId,
    metadata: { bucket: asset.bucket_id, visibility: asset.visibility, size_bytes: asset.size_bytes },
  });

  revalidatePath("/admin/media");
  return { status: "success", message: "Asset and stored file removed." };
}
