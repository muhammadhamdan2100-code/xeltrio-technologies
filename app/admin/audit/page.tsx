import { requirePermission } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function AdminAuditPage() {
  await requirePermission("audit.logs", "view", "/admin/audit");

  const supabase = await createSupabaseServer();
  const { data: events } = await supabase
    .from("audit_logs")
    .select("created_at,action,resource_type,actor_user_id")
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">Audit</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Real security and administrative events. The table is append-only for every non-service role:
          RLS grants INSERT but no UPDATE or DELETE policy exists, so history cannot be rewritten. No
          passwords, tokens, reset codes or secrets are ever written here.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]">
        <table className="w-full text-left text-sm">
          <thead className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">
            <tr>
              <th className="px-6 py-3">TIME</th>
              <th className="px-6 py-3">ACTION</th>
              <th className="px-6 py-3">RESOURCE</th>
              <th className="px-6 py-3">ACTOR</th>
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((e, i) => (
              <tr key={i} className="border-t border-[color:var(--color-border)]">
                <td className="px-6 py-3 font-mono-tech text-xs text-[color:var(--color-text-muted)]">
                  {String(e.created_at ?? "").slice(0, 19).replace("T", " ")}
                </td>
                <td className="px-6 py-3 text-[color:var(--color-text-secondary)]">{String(e.action)}</td>
                <td className="px-6 py-3 text-[color:var(--color-text-secondary)]">
                  {String(e.resource_type ?? "—")}
                </td>
                <td className="px-6 py-3 font-mono-tech text-xs text-[color:var(--color-text-muted)]">
                  {e.actor_user_id ? String(e.actor_user_id).slice(0, 8) : "anonymous"}
                </td>
              </tr>
            ))}
            {(events ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-[color:var(--color-text-muted)]">
                  No events recorded yet — this table fills as soon as sign-in happens.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
