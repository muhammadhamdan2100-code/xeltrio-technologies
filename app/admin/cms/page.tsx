import Link from "next/link";
import { requirePermission } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AuthStateForm } from "@/components/admin/AuthStateForm";
import { createPageAction, type FormState } from "@/app/admin/cms/actions";

const IDLE: FormState = { status: "idle" };

export default async function CmsPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requirePermission("pages", "view", "/admin/cms");
  const { status, q } = await searchParams;

  const supabase = await createSupabaseServer();
  let query = supabase
    .from("pages")
    .select("id,key,title,slug,status,updated_at,sort_order")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (status && ["draft", "in_review", "approved", "published", "archived"].includes(status)) query = query.eq("status", status);
  if (q && q.trim()) query = query.or(`title.ilike.%${q.trim().slice(0, 40)}%,slug.ilike.%${q.trim().slice(0, 40)}%`);

  const { data: pages, error } = await query;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono-tech text-xs tracking-[0.1em] text-[color:var(--color-accent-secondary)]">CMS</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">Pages</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Draft, in-review and approved pages are never visible to visitors — RLS exposes only{" "}
          <code className="font-mono-tech text-xs">status = published</code>.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">SEARCH</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="title or slug"
            className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3 py-2 text-sm text-[color:var(--color-text-primary)]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">STATUS</span>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-3 py-2 text-sm text-[color:var(--color-text-primary)]"
          >
            <option value="">All</option>
            {["draft", "in_review", "approved", "published", "archived"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-xl border border-[color:var(--color-border)] px-4 py-2 font-display text-sm text-[color:var(--color-text-primary)]">
          Filter
        </button>
        <Link href="/admin/cms" className="rounded-xl px-3 py-2 font-mono-tech text-xs text-[color:var(--color-text-muted)]">
          reset
        </Link>
      </form>

      <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]">
        <table className="w-full text-left text-sm">
          <thead className="font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">
            <tr>
              <th className="px-5 py-3">PAGE</th>
              <th className="px-5 py-3">SLUG</th>
              <th className="px-5 py-3">STATUS</th>
              <th className="px-5 py-3">UPDATED</th>
            </tr>
          </thead>
          <tbody>
            {(pages ?? []).map((p) => (
              <tr key={String(p.id)} className="border-t border-[color:var(--color-border)]">
                <td className="px-5 py-3">
                  <Link href={`/admin/cms/${p.id}`} className="text-[color:var(--color-text-primary)] underline-offset-4 hover:underline">
                    {String(p.title)}
                  </Link>
                  <span className="ml-2 font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">{String(p.key)}</span>
                </td>
                <td className="px-5 py-3 font-mono-tech text-xs text-[color:var(--color-text-muted)]">{String(p.slug)}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full border border-[color:var(--color-border)] px-2 py-0.5 font-mono-tech text-[11px] text-[color:var(--color-text-secondary)]">
                    {String(p.status)}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">{String(p.updated_at).slice(0, 16)}</td>
              </tr>
            ))}
            {(pages ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-[color:var(--color-text-muted)]">
                  {error ? "Pages could not be loaded for this account." : "No pages yet — create one to begin."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6">
        <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">New page</h2>
        <AuthStateForm action={createPageAction} idle={IDLE} submitLabel="Create draft" columns="sm:grid-cols-3">
          <input name="key" required placeholder="key (e.g. about)" className="input-base" />
          <input name="slug" required placeholder="slug (e.g. about)" className="input-base" />
          <input name="title" required placeholder="Title" className="input-base" />
          <input name="description" placeholder="Short description" className="input-base sm:col-span-3" />
        </AuthStateForm>
      </section>
    </div>
  );
}
