import Link from "next/link";
import { requirePermission, can } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ROLE_LABELS, type Role } from "@/lib/authz/permissions";

type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  status: string;
  created_at: string | null;
};

const PAGE_SIZE = 25;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const principal = await requirePermission("users", "view", "/admin/users");
  const { q = "", page = "1" } = await searchParams;

  const canManage = await can(principal, "users", "manage");
  const canAssignRoles = await can(principal, "roles", "manage");

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("admin_profiles");
  const all: Row[] = error ? [] : ((data as Row[] | null) ?? []);

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? all.filter((r) => `${r.email ?? ""} ${r.full_name ?? ""} ${r.role}`.toLowerCase().includes(needle))
    : all;

  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const start = (pageNum - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-mono-tech text-xs tracking-[0.1em] text-[color:var(--color-accent-secondary)]">ADMIN</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">Users</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Roster from <code className="font-mono-tech text-xs">admin_profiles()</code>, which raises{" "}
          <code className="font-mono-tech text-xs">42501</code> for non-administrators. Every action below is
          re-authorized server-side and in row-level security; the buttons you can see are not the enforcement.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <form method="GET" className="flex items-center gap-2">
          <input name="q" defaultValue={q} placeholder="Search name, email or role" className="input-base w-64" />
          <button type="submit" className="rounded-xl border border-[color:var(--color-border)] px-4 py-2 text-sm text-[color:var(--color-text-secondary)]">
            Search
          </button>
        </form>
        <p className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">
          {filtered.length} account{filtered.length === 1 ? "" : "s"}
          {canAssignRoles ? " · role assignment enabled" : " · role assignment requires roles:manage"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">
            <tr>
              <th className="px-5 py-3">ACCOUNT</th>
              <th className="px-5 py-3">NAME</th>
              <th className="px-5 py-3">ROLE</th>
              <th className="px-5 py-3">STATUS</th>
              <th className="px-5 py-3">CREATED</th>
              <th className="px-5 py-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[color:var(--color-border)]">
                <td className="px-5 py-3 text-[color:var(--color-text-secondary)]">{row.email ?? row.id.slice(0, 8)}</td>
                <td className="px-5 py-3 text-[color:var(--color-text-secondary)]">{row.full_name ?? "—"}</td>
                <td className="px-5 py-3 text-[color:var(--color-text-secondary)]">{ROLE_LABELS[row.role] ?? row.role}</td>
                <td className="px-5 py-3 text-[color:var(--color-text-secondary)]">{row.status}</td>
                <td className="px-5 py-3 text-[color:var(--color-text-muted)]">
                  {row.created_at ? row.created_at.slice(0, 10) : "Unavailable"}
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/users/${row.id}`}
                    className="rounded-lg border border-[color:var(--color-border)] px-3 py-1.5 text-xs text-[color:var(--color-text-secondary)]"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-[color:var(--color-text-muted)]">
                  {error ? "The roster could not be read for this account." : "No accounts match this search."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-[color:var(--color-text-muted)]">
        <p>
          Page {pageNum} of {pages}
        </p>
        <div className="flex gap-2">
          {pageNum > 1 ? (
            <Link href={`/admin/users?q=${encodeURIComponent(q)}&page=${pageNum - 1}`} className="rounded-lg border border-[color:var(--color-border)] px-3 py-1.5">
              Previous
            </Link>
          ) : null}
          {pageNum < pages ? (
            <Link href={`/admin/users?q=${encodeURIComponent(q)}&page=${pageNum + 1}`} className="rounded-lg border border-[color:var(--color-border)] px-3 py-1.5">
              Next
            </Link>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-primary)] p-5 text-sm text-[color:var(--color-text-muted)]">
        <p className="font-display text-[color:var(--color-text-primary)]">Creating accounts</p>
        <p className="mt-1">
          Not configured. Provisioning a sign-in requires the Supabase Admin API (service-role credential), which
          this application deliberately does not hold. Existing {canManage ? "administrators" : "admins"} can edit,
          suspend and reinstate accounts here; a super admin can change roles.
        </p>
      </div>
    </div>
  );
}
