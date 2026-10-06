import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AuthStateForm } from "@/components/admin/AuthStateForm";
import {
  updatePageAction,
  transitionPageAction,
  deletePageAction,
  saveSectionAction,
  deleteSectionAction,
  restoreRevisionAction,
  type FormState,
} from "@/app/admin/cms/actions";

const IDLE: FormState = { status: "idle" };
const SECTION_TYPES = ["hero", "cards", "features", "stats", "cta", "testimonials", "faq", "logos", "rich_list", "custom"];
const WORKFLOW = ["draft", "in_review", "approved", "published", "archived"];

/** Mirrors guard_page_workflow() in migration 028. The trigger is the authority. */
const NEXT_STATES: Record<string, string[]> = {
  draft: ["in_review", "archived"],
  in_review: ["approved", "draft"],
  approved: ["published", "draft"],
  published: ["draft", "archived"],
  archived: ["draft"],
};

export default async function CmsPageEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("pages", "view", `/admin/cms/${id}`);

  const supabase = await createSupabaseServer();
  const { data: page } = await supabase.from("pages").select("*").eq("id", id).maybeSingle();
  if (!page) notFound();

  const { data: sections } = await supabase
    .from("page_sections")
    .select("id,section_type,title,subtitle,eyebrow,body,items,props,sort_order,is_visible,status")
    .eq("page_id", id)
    .order("sort_order");

  const { data: revisions } = await supabase
    .from("page_revisions")
    .select("revision_no,change_summary,status_at_time,created_at")
    .eq("page_id", id)
    .order("revision_no", { ascending: false })
    .limit(10);

  const canEdit = await supabase.rpc("can", { p_resource: "pages", p_action: "edit" });

  return (
    <div className="flex flex-col gap-10">
      <header>
        <p className="font-mono-tech text-[11px] tracking-[0.1em] text-[color:var(--color-accent-secondary)]">
          PAGE · {String(page.status)}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">{String(page.title)}</h1>
        <p className="mt-1 font-mono-tech text-xs text-[color:var(--color-text-muted)]">/{String(page.slug)}</p>
      </header>

      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6">
        <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">Workflow</h2>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Transitions are enforced by <code className="font-mono-tech text-xs">guard_page_workflow()</code>, not by
          this form: the state machine and the per-state permission are re-checked in the database, so a handcrafted
          request cannot skip review or approval.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {(NEXT_STATES[String(page.status)] ?? []).map((s) => (
            <AuthStateForm key={s} action={transitionPageAction} idle={IDLE} submitLabel={`→ ${s}`}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value={s} />
            </AuthStateForm>
          ))}
        </div>
        {(NEXT_STATES[String(page.status)] ?? []).length === 0 ? (
          <p className="mt-3 text-xs text-[color:var(--color-text-muted)]">No further transition is available from this state.</p>
        ) : null}
      </section>

      {canEdit.data === true ? (
        <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6">
          <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">Details &amp; SEO</h2>
          <AuthStateForm action={updatePageAction} idle={IDLE} submitLabel="Save page">
            <input type="hidden" name="id" value={id} />
            <input name="title" defaultValue={String(page.title ?? "")} className="input-base" placeholder="Title" />
            <input name="slug" defaultValue={String(page.slug ?? "")} className="input-base" placeholder="slug" />
            <input name="description" defaultValue={String(page.description ?? "")} className="input-base sm:col-span-2" placeholder="Description" />
            <input name="seo_title" defaultValue={String(page.seo_title ?? "")} className="input-base" placeholder="SEO title" />
            <input name="seo_description" defaultValue={String(page.seo_description ?? "")} className="input-base" placeholder="SEO description" />
            <input name="og_image_url" defaultValue={String(page.og_image_url ?? "")} className="input-base" placeholder="Open Graph image URL" />
            <textarea name="seo_keywords" className="input-base" placeholder='["keyword","another"]'
              defaultValue={JSON.stringify(page.seo_keywords ?? [])} />
            <label className="flex items-center gap-2 text-sm text-[color:var(--color-text-secondary)]">
              <input type="checkbox" name="noindex" defaultChecked={Boolean(page.noindex)} /> Exclude from search engines
            </label>
          </AuthStateForm>
        </section>
      ) : null}

      <section>
        <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">Sections</h2>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Structured fields and typed JSON only — nothing here is ever rendered as raw HTML.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {(sections ?? []).map((s) => (
            <li key={String(s.id)} className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-sm font-semibold text-[color:var(--color-text-primary)]">
                  {String(s.sort_order)}. {String(s.section_type)} — {String(s.title ?? "untitled")}
                </p>
                <span className="font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">
                  {String(s.status)}{s.is_visible ? "" : " · hidden"}
                </span>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">edit</summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input name="title" defaultValue={String(s.title ?? "")} className="input-base" readOnly />
                  <select defaultValue={String(s.section_type)} className="input-base" disabled>
                    {SECTION_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <AuthStateForm action={saveSectionAction} idle={IDLE} submitLabel="Update section">
                  <input type="hidden" name="page_id" value={id} />
                  <input type="hidden" name="section_id" value={String(s.id)} />
                  <input type="hidden" name="section_type" value={String(s.section_type)} />
                  <input name="title" defaultValue={String(s.title ?? "")} className="input-base" placeholder="Title" />
                  <input name="subtitle" defaultValue={String(s.subtitle ?? "")} className="input-base" placeholder="Subtitle" />
                  <input name="eyebrow" defaultValue={String(s.eyebrow ?? "")} className="input-base" placeholder="Eyebrow" />
                  <input name="sort_order" defaultValue={String(s.sort_order)} className="input-base" placeholder="Order" />
                  <textarea name="body" defaultValue={String(s.body ?? "")} className="input-base sm:col-span-2" placeholder="Body text" />
                  <textarea name="items" defaultValue={JSON.stringify(s.items ?? [])} className="input-base" placeholder="items JSON" />
                  <textarea name="props" defaultValue={JSON.stringify(s.props ?? {})} className="input-base" placeholder="props JSON" />
                  <label className="flex items-center gap-2 text-sm text-[color:var(--color-text-secondary)]">
                    <input type="checkbox" name="is_visible" defaultChecked={Boolean(s.is_visible)} /> Visible
                  </label>
                  <select name="status" defaultValue={String(s.status)} className="input-base">
                    {WORKFLOW.map((w) => <option key={w}>{w}</option>)}
                  </select>
                </AuthStateForm>
                {canEdit.data === true ? (
                  <AuthStateForm action={deleteSectionAction} idle={IDLE} submitLabel="Delete section">
                    <input type="hidden" name="page_id" value={id} />
                    <input type="hidden" name="id" value={String(s.id)} />
                  </AuthStateForm>
                ) : null}
              </details>
            </li>
          ))}
          {(sections ?? []).length === 0 ? (
            <li className="rounded-xl border border-dashed border-[color:var(--color-border)] px-4 py-6 text-center text-sm text-[color:var(--color-text-muted)]">
              No sections yet.
            </li>
          ) : null}
        </ul>

        {canEdit.data === true ? (
          <div className="mt-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6">
            <h3 className="font-display text-base font-semibold text-[color:var(--color-text-primary)]">Add section</h3>
            <AuthStateForm action={saveSectionAction} idle={IDLE} submitLabel="Add section">
              <input type="hidden" name="page_id" value={id} />
              <select name="section_type" defaultValue="hero" className="input-base">
                {SECTION_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <input name="title" className="input-base" placeholder="Title" />
              <textarea name="items" className="input-base" placeholder='[{"title":"…","description":"…"}]' defaultValue="[]" />
              <input type="hidden" name="status" value="draft" />
            </AuthStateForm>
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">Revisions</h2>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          History is append-only. Restoring writes a new revision rather than erasing any.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {(revisions ?? []).map((r) => (
            <li key={String(r.revision_no)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-4 py-3">
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                <span className="font-mono-tech text-xs text-[color:var(--color-accent-secondary)]">#{String(r.revision_no)}</span>{" "}
                {String(r.change_summary ?? "")} · <span className="font-mono-tech text-[11px]">{String(r.status_at_time)}</span>
              </p>
              {canEdit.data === true ? (
                <AuthStateForm action={restoreRevisionAction} idle={IDLE} submitLabel="Restore">
                  <input type="hidden" name="page_id" value={id} />
                  <input type="hidden" name="revision" value={String(r.revision_no)} />
                </AuthStateForm>
              ) : null}
            </li>
          ))}
          {(revisions ?? []).length === 0 ? (
            <li className="rounded-xl border border-dashed border-[color:var(--color-border)] px-4 py-6 text-center text-sm text-[color:var(--color-text-muted)]">
              No revisions yet — they are created on each meaningful edit.
            </li>
          ) : null}
        </ul>
      </section>

      {canEdit.data === true ? (
        <section className="rounded-2xl border border-[color:var(--color-border)] p-6">
          <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-danger,#c00)]">Delete page</h2>
          <AuthStateForm action={deletePageAction} idle={IDLE} submitLabel="Delete permanently" confirm="DELETE">
            <input type="hidden" name="id" value={id} />
            <input name="confirm" className="input-base" placeholder="DELETE" />
          </AuthStateForm>
        </section>
      ) : null}
    </div>
  );
}
