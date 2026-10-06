import Link from "next/link";
import { requirePermission } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";

const PAGE_SIZE = 25;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; q?: string }>;
}) {
  await requirePermission("audit.logs", "view", "/admin/security/audit-logs");
  const sp = await searchParams;
  const page = Math.min(Math.max(Number.parseInt(sp.page ?? "1", 10) || 1, 1), 40);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createSupabaseServer();
  let query = supabase
    .from("audit_logs")
    .select("id,action,resource_type,resource_id,created_at,metadata,actor_user_id,profiles:actor_user_id(full_name),ip_address", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (sp.action && /^[a-z_]{3,40}$/.test(sp.action)) query = query.eq("action", sp.action);
  if (sp.q && /^[A-Za-z0-9 _.-]{1,40}$/.test(sp.q)) query = query.ilike("resource_id", `%${sp.q.trim()}%`);

  const { data, count } = await query;
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/security" className="font-mono-tech text-[11px] text-[color:var(--color-accent-secondary)]">← SECURITY</Link>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">Audit logs</h1>
        <p className="mt-2 max-w-2xl text-sm text-[color:var(--color-text-secondary)]">
          Append-only. There is no update or delete control anywhere in this interface, and row-level security denies
          both to every non-service role. Values are page-bounded ({PAGE_SIZE} per page) — the table is never loaded whole.
        </p>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="resource id contains" className="input-base max-w-[240px]" />
        <input name="action" defaultValue={sp.action ?? ""} placeholder="action (e.g. login)" className="input-base max-w-[200px]" />
        <button type="submit" className="rounded-xl border border-[color:var(--color-border)] px-4 py-2 font-display text-sm text-[color:var(--color-text-primary)]">Apply</button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]">
        <table className="w-full text-left text-xs">
          <thead className="font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-3">WHEN</th><th className="px-4 py-3">ACTION</th>
              <th className="px-4 py-3">ACTOR</th><th className="px-4 py-3">RESOURCE</th>
              <th className="px-4 py-3">SOURCE</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => {
              const profile = row.profiles as { full_name?: string | null } | null;
              const meta = (row.metadata ?? {}) as Record<string, unknown>;
              return (
                <tr key={String(row.id)} className="border-t border-[color:var(--color-border)] align-top">
                  <td className="px-4 py-2 font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">{String(row.created_at).slice(0, 19).replace("T", " ")}</td>
                  <td className="px-4 py-2 font-mono-tech text-[11px] text-[color:var(--color-accent-secondary)]">{String(row.action)}</td>
                  <td className="px-4 py-2 text-[color:var(--color-text-secondary)]">{profile?.full_name || (row.actor_user_id ? "team member" : "anonymous")}</td>
                  <td className="px-4 py-2 text-[color:var(--color-text-secondary)]">
                    {String(row.resource_type ?? "—")}
                    <span className="ml-1 font-mono-tech text-[10px] text-[color:var(--color-text-muted)]">{String(row.resource_id ?? "").slice(0, 8)}</span>
                  </td>
                  <td className="px-4 py-2 text-[color:var(--color-text-muted)]">
                    {Object.keys(meta).length > 0 ? JSON.stringify(meta).slice(0, 90) : "—"}
                    {row.ip_address ? <span className="ml-1 font-mono-tech text-[10px]">· {String(row.ip_address).slice(0, 24)}</span> : null}
                  </td>
                </tr>
              );
            })}
            {(data ?? []).length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-[color:var(--color-text-muted)]">No events match, or none exist yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <nav className="flex items-center gap-3 font-mono-tech text-[11px] text-[color:var(--color-text-muted)]" aria-label="Pagination">
        {page > 1 ? <Link href={`/admin/security/audit-logs?page=${page - 1}`} className="rounded-lg border border-[color:var(--color-border)] px-3 py-1.5">newer</Link> : null}
        <span>page {page} / {pages} · {total} events</span>
        {page < pages ? <Link href={`/admin/security/audit-logs?page=${page + 1}`} className="rounded-lg border border-[color:var(--color-border)] px-3 py-1.5">older</Link> : null}
      </nav>
    </div>
  );
}
