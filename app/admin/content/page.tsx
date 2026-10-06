import { requirePermission } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function AdminContentPage() {
  // Server-side, per-resource check. Navigating here directly still fails.
  await requirePermission("site.content", "view", "/admin/content");

  const supabase = await createSupabaseServer();
  const { data: rows } = await supabase
    .from("content_items")
    .select("collection,status,count")
    .order("collection");

  const grouped = new Map<string, { published: number; draft: number; archived: number }>();
  for (const row of rows ?? []) {
    const key = String(row.collection ?? "—");
    const bucket = grouped.get(key) ?? { published: 0, draft: 0, archived: 0 };
    if (row.status === "published") bucket.published += Number(row.count ?? 0);
    else if (row.status === "draft") bucket.draft += Number(row.count ?? 0);
    else bucket.archived += Number(row.count ?? 0);
    grouped.set(key, bucket);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">Content</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Live rows from <code className="font-mono-tech text-xs">content_items</code>, grouped by collection.
          Editing is not part of this build — the CMS is a later phase.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]">
        <table className="w-full text-left text-sm">
          <thead className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">
            <tr>
              <th className="px-6 py-3">COLLECTION</th>
              <th className="px-6 py-3">PUBLISHED</th>
              <th className="px-6 py-3">DRAFT</th>
              <th className="px-6 py-3">ARCHIVED</th>
            </tr>
          </thead>
          <tbody>
            {[...grouped.entries()].map(([collection, counts]) => (
              <tr key={collection} className="border-t border-[color:var(--color-border)]">
                <td className="px-6 py-3 text-[color:var(--color-text-secondary)]">{collection}</td>
                <td className="px-6 py-3 text-[color:var(--color-text-secondary)]">{counts.published}</td>
                <td className="px-6 py-3 text-[color:var(--color-text-secondary)]">{counts.draft}</td>
                <td className="px-6 py-3 text-[color:var(--color-text-secondary)]">{counts.archived}</td>
              </tr>
            ))}
            {grouped.size === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-[color:var(--color-text-muted)]">
                  No rows visible to this account.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
