import { requirePermission } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AuthStateForm } from "@/components/admin/AuthStateForm";
import { uploadMediaAction, updateMediaAction, deleteMediaAction, type FormState } from "@/app/admin/media/actions";

const IDLE: FormState = { status: "idle" };
const CATEGORIES = ["general", "logo", "icon", "product", "founder", "brand", "news", "media", "document"];

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  await requirePermission("media", "view", "/admin/media");
  const { q, category } = await searchParams;

  const supabase = await createSupabaseServer();
  let query = supabase
    .from("media_assets")
    .select("id,filename,original_filename,mime_type,size_bytes,width,height,alt_text,title,category,visibility,status,bucket_id,storage_path,created_at")
    .order("created_at", { ascending: false })
    .limit(60);
  if (q?.trim()) query = query.or(`filename.ilike.%${q.trim().slice(0, 40)}%,alt_text.ilike.%${q.trim().slice(0, 40)}%`);
  if (category) query = query.eq("category", category.slice(0, 20));

  const { data: assets, error } = await query;
  const canCreate = (await supabase.rpc("can", { p_resource: "media", p_action: "create" })).data === true;
  const canDelete = (await supabase.rpc("can", { p_resource: "media", p_action: "delete" })).data === true;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="font-mono-tech text-xs tracking-[0.1em] text-[color:var(--color-accent-secondary)]">MEDIA</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">Media library</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Uploads are re-typed from file bytes on the server, capped at 10 MB, and stored in a public bucket or the
          private <code className="font-mono-tech text-xs">private-assets</code> bucket according to visibility.
        </p>
      </header>

      {canCreate ? (
        <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6">
          <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">Upload</h2>
          <AuthStateForm action={uploadMediaAction} idle={IDLE} submitLabel="Upload asset">
            <input type="file" name="file" required className="input-base" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,application/pdf" />
            <select name="category" defaultValue="general" className="input-base">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            <select name="bucket" defaultValue="media" className="input-base">
              {["media", "company-assets", "logos", "products", "news", "founder", "hm-signature"].map((b) => <option key={b}>{b}</option>)}
            </select>
            <select name="visibility" defaultValue="public" className="input-base"><option>public</option><option>private</option></select>
            <input name="title" className="input-base" placeholder="Title" />
            <input name="alt_text" className="input-base" placeholder="Alt text (accessibility)" />
            <input name="description" className="input-base sm:col-span-2" placeholder="Description" />
          </AuthStateForm>
        </section>
      ) : null}

      <form method="get" className="flex flex-wrap items-end gap-3">
        <input name="q" defaultValue={q ?? ""} placeholder="search filename or alt text" className="input-base max-w-[260px]" />
        <select name="category" defaultValue={category ?? ""} className="input-base max-w-[180px]">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button type="submit" className="rounded-xl border border-[color:var(--color-border)] px-4 py-2 font-display text-sm text-[color:var(--color-text-primary)]">Filter</button>
      </form>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {(assets ?? []).map((a) => (
          <li key={String(a.id)} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4">
            <p className="truncate font-display text-sm font-semibold text-[color:var(--color-text-primary)]">{String(a.original_filename)}</p>
            <p className="mt-1 font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">
              {String(a.mime_type)} · {(Number(a.size_bytes) / 1024).toFixed(0)} KB · {String(a.bucket_id)}
            </p>
            <p className="mt-1 font-mono-tech text-[11px] text-[color:var(--color-accent-secondary)]">
              {String(a.visibility)} · {String(a.status)} · {String(a.category)}
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">metadata</summary>
              <AuthStateForm action={updateMediaAction} idle={IDLE} submitLabel="Save">
                <input type="hidden" name="id" value={String(a.id)} />
                <input name="title" defaultValue={String(a.title ?? "")} className="input-base" placeholder="Title" />
                <input name="alt_text" defaultValue={String(a.alt_text ?? "")} className="input-base" placeholder="Alt text" />
                <select name="category" defaultValue={String(a.category)} className="input-base">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
                <select name="visibility" defaultValue={String(a.visibility)} className="input-base"><option>public</option><option>private</option></select>
                <select name="status" defaultValue={String(a.status)} className="input-base">
                  {["draft", "in_review", "approved", "published", "archived"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </AuthStateForm>
              {canDelete ? (
                <AuthStateForm action={deleteMediaAction} idle={IDLE} submitLabel="Delete asset + file" confirm="DELETE">
                  <input type="hidden" name="id" value={String(a.id)} />
                  <input name="confirm" className="input-base" placeholder="DELETE" />
                </AuthStateForm>
              ) : null}
            </details>
          </li>
        ))}
        {(assets ?? []).length === 0 ? (
          <li className="rounded-2xl border border-dashed border-[color:var(--color-border)] px-4 py-10 text-center text-sm text-[color:var(--color-text-muted)] sm:col-span-2 xl:col-span-3">
            {error ? "Media could not be loaded for this account." : "No assets yet — the buckets are currently empty."}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
