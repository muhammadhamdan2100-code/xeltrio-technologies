"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/authz/audit";

export type FormState = { status: "idle" | "error" | "success"; message?: string };

const KEY_RE = /^[a-z][a-z0-9_-]{1,80}$/;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/;
const SECTION_TYPES = ["hero", "cards", "features", "stats", "cta", "testimonials", "faq", "logos", "rich_list", "custom"] as const;

function text(form: FormData, name: string, max = 400): string {
  const v = form.get(name);
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

function jsonField(form: FormData, name: string, fallback: unknown[] | Record<string, unknown>): unknown {
  const raw = text(form, name, 60000);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    // Reject executable payloads: only plain data structures are stored.
    const probe = JSON.stringify(parsed).toLowerCase();
    if (probe.includes("<script") || probe.includes("javascript:") || probe.includes("onerror=") || probe.includes("onload=")) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function createPageAction(_prev: FormState, form: FormData): Promise<FormState> {
  const auth = await authorize("pages", "create");
  if (!auth.ok) return { status: "error", message: auth.message };

  const key = text(form, "key", 80).toLowerCase();
  const slug = text(form, "slug", 100).toLowerCase();
  const title = text(form, "title", 160);

  if (!KEY_RE.test(key)) return { status: "error", message: "Key must be lowercase letters, numbers, - or _." };
  if (!SLUG_RE.test(slug)) return { status: "error", message: "Slug must be lowercase and URL safe." };
  if (!title) return { status: "error", message: "Title is required." };

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("pages")
    .insert({ key, slug, title, route: `/${slug}`, description: text(form, "description", 1000) || null, status: "draft" })
    .select("id")
    .single();

  if (error || !data) {
    await recordAuditEvent({ action: "page_create_failed", resourceType: "pages", actorUserId: auth.value.userId, metadata: { key } });
    return { status: "error", message: "That page could not be created. Check the key and slug are unique." };
  }

  await recordAuditEvent({ action: "page_created", resourceType: "pages", resourceId: String(data.id), actorUserId: auth.value.userId, metadata: { key, slug } });
  redirect(`/admin/cms/${data.id}`);
}

export async function updatePageAction(_prev: FormState, form: FormData): Promise<FormState> {
  const id = text(form, "id", 40);
  const auth = await authorize("pages", "edit");
  if (!auth.ok || !id) return { status: "error", message: auth.ok ? "Missing page." : auth.message };

  const patch: Record<string, unknown> = {};
  const title = text(form, "title", 160);
  const slug = text(form, "slug", 100).toLowerCase();
  const seoTitle = text(form, "seo_title", 160);
  const seoDescription = text(form, "seo_description", 300);
  const ogImage = text(form, "og_image_url", 500);
  const description = text(form, "description", 1000);

  if (title) patch.title = title;
  if (slug) {
    if (!SLUG_RE.test(slug)) return { status: "error", message: "Slug must be lowercase and URL safe." };
    patch.slug = slug;
    patch.route = `/${slug}`;
  }
  if (description) patch.description = description;
  patch.seo_title = seoTitle || null;
  patch.seo_description = seoDescription || null;
  patch.og_image_url = ogImage || null;
  patch.noindex = form.get("noindex") === "on";

  const keywords = jsonField(form, "seo_keywords", []);
  if (keywords === null || !Array.isArray(keywords)) return { status: "error", message: "SEO keywords must be a JSON array of plain strings." }
  patch.seo_keywords = keywords;

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("pages").update(patch).eq("id", id);
  if (error) return { status: "error", message: "The update was rejected. Check the slug is unique." };

  await recordAuditEvent({ action: "page_updated", resourceType: "pages", resourceId: id, actorUserId: auth.value.userId, metadata: { fields: Object.keys(patch) } });
  revalidatePath(`/admin/cms/${id}`);
  revalidatePublishedPage(slug || text(form, "current_slug", 100));
  return { status: "success", message: "Page saved." };
}

/** Workflow transition. The database trigger re-authorization is the real gate. */
export async function transitionPageAction(_prev: FormState, form: FormData): Promise<FormState> {
  const id = text(form, "id", 40);
  const next = text(form, "status", 20);
  const allowed = { draft: "edit", in_review: "edit", approved: "approve", published: "publish", archived: "publish" } as const;
  const action = allowed[next as keyof typeof allowed];
  if (!id || !action) return { status: "error", message: "Unknown workflow state." };

  const auth = await authorize("pages", action);
  if (!auth.ok) return { status: "error", message: auth.message };

  const supabase = await createSupabaseServer();
  const { data: before } = await supabase.from("pages").select("slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("pages").update({ status: next }).eq("id", id);
  if (error) return { status: "error", message: "That transition is not permitted for your role." };

  revalidatePath(`/admin/cms/${id}`);
  revalidatePath("/admin/cms");
  if (before?.slug) revalidatePublishedPage(String(before.slug));
  return { status: "success", message: `Moved to ${next}.` };
}

/**
 * Publishing changes what anonymous visitors see, so the public route (and the
 * home page, which may embed published sections) is invalidated on demand.
 * Only the affected path is revalidated; global caching stays intact.
 */
function revalidatePublishedPage(slug: string) {
  const publicPath = slug === "home" ? "/" : `/${slug}`;
  revalidatePath(publicPath);
  if (publicPath !== "/") revalidatePath("/");
}

/** Sections and revisions belong to a page id; resolve its public path to revalidate it. */
async function revalidatePageById(pageId: string) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("pages").select("slug").eq("id", pageId).maybeSingle();
  if (data?.slug) revalidatePublishedPage(String(data.slug));
}

export async function deletePageAction(_prev: FormState, form: FormData): Promise<FormState> {
  const id = text(form, "id", 40);
  const confirm = text(form, "confirm", 10);
  const auth = await authorize("pages", "delete");
  if (!auth.ok) return { status: "error", message: auth.message };
  if (confirm !== "DELETE") return { status: "error", message: "Type DELETE to confirm. Sections and revisions are removed with the page." };

  const supabase = await createSupabaseServer();
  const { data: gone } = await supabase.from("pages").select("slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("pages").delete().eq("id", id);
  if (error) return { status: "error", message: "The page could not be deleted." };

  await recordAuditEvent({ action: "page_deleted", resourceType: "pages", resourceId: id, actorUserId: auth.value.userId, metadata: {} });
  if (gone?.slug) revalidatePublishedPage(String(gone.slug));
  redirect("/admin/cms");
}

export async function saveSectionAction(_prev: FormState, form: FormData): Promise<FormState> {
  const pageId = text(form, "page_id", 40);
  const sectionId = text(form, "section_id", 40);
  const needed = sectionId ? "edit" : "create";
  const auth = await authorize("pages", needed);
  if (!auth.ok || !pageId) return { status: "error", message: auth.ok ? "Missing page." : auth.message };

  const type = text(form, "section_type", 30);
  if (!SECTION_TYPES.includes(type as (typeof SECTION_TYPES)[number])) {
    return { status: "error", message: "Unsupported section type." };
  }

  const items = jsonField(form, "items", []);
  const props = jsonField(form, "props", {});
  if (items === null || props === null) return { status: "error", message: "Items and properties must be plain JSON (no markup or script)." };

  const payload = {
    page_id: pageId,
    section_type: type,
    title: text(form, "title", 200) || null,
    subtitle: text(form, "subtitle", 200) || null,
    eyebrow: text(form, "eyebrow", 60) || null,
    body: text(form, "body", 4000) || null,
    items,
    props,
    sort_order: Math.max(0, Number.parseInt(text(form, "sort_order", 6) || "0", 10) || 0),
    is_visible: form.get("is_visible") === "on",
    status: text(form, "status", 20) || "draft",
  };

  const supabase = await createSupabaseServer();
  const result = sectionId
    ? await supabase.from("page_sections").update(payload).eq("id", sectionId).eq("page_id", pageId)
    : await supabase.from("page_sections").insert(payload);

  if (result.error) return { status: "error", message: "The section could not be saved." };

  await recordAuditEvent({
    action: sectionId ? "section_updated" : "section_created",
    resourceType: "page_sections",
    resourceId: sectionId || undefined,
    actorUserId: auth.value.userId,
    metadata: { page_id: pageId, type },
  });
  revalidatePath(`/admin/cms/${pageId}`);
  await revalidatePageById(pageId);
  return { status: "success", message: "Section saved." };
}

export async function deleteSectionAction(_prev: FormState, form: FormData): Promise<FormState> {
  const pageId = text(form, "page_id", 40);
  const sectionId = text(form, "id", 40);
  const auth = await authorize("pages", "delete");
  if (!auth.ok) return { status: "error", message: auth.message };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("page_sections").delete().eq("id", sectionId).eq("page_id", pageId);
  if (error) return { status: "error", message: "The section could not be deleted." };

  await recordAuditEvent({ action: "section_deleted", resourceType: "page_sections", resourceId: sectionId, actorUserId: auth.value.userId, metadata: { page_id: pageId } });
  revalidatePath(`/admin/cms/${pageId}`);
  await revalidatePageById(pageId);
  return { status: "success", message: "Section removed." };
}

export async function restoreRevisionAction(_prev: FormState, form: FormData): Promise<FormState> {
  const pageId = text(form, "page_id", 40);
  const revision = Number.parseInt(text(form, "revision", 6), 10);
  const auth = await authorize("pages", "edit");
  if (!auth.ok || !pageId || !Number.isFinite(revision)) return { status: "error", message: auth.ok ? "Missing revision." : auth.message };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("restore_page_revision", { p_page_id: pageId, p_revision: revision });
  if (error) return { status: "error", message: "That revision could not be restored." };

  revalidatePath(`/admin/cms/${pageId}`);
  await revalidatePageById(pageId);
  return { status: "success", message: `Revision ${revision} restored (recorded as a new revision).` };
}
