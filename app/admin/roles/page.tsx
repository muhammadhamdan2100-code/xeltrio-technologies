import { requirePermission, can } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AuthStateForm } from "@/components/admin/AuthStateForm";
import { ROLE_LABELS, type Role } from "@/lib/authz/permissions";
import { assignRoleAction, type FormState } from "@/app/admin/users/actions";

const ACTIONS = ["view", "create", "edit", "delete", "publish", "approve", "manage", "export"];
const IDLE: FormState = { status: "idle" };

type RosterRow = { id: string; email: string | null; full_name: string | null; role: Role; status: string };

export default async function RolesPage() {
  const principal = await requirePermission("roles", "view", "/admin/roles");
  const canAssign = await can(principal, "roles", "manage");

  const supabase = await createSupabaseServer();
  const { data: rows } = await supabase.from("role_permissions").select("role_key,resource_key,action_key");
  const { data: roles } = await supabase.from("roles").select("key,is_root");
  const { data: roster } = await supabase.rpc("admin_profiles");
  const users: RosterRow[] = (roster as RosterRow[] | null) ?? [];

  const grants = rows ?? [];
  const resources = [...new Set(grants.map((r) => r.resource_key))].sort();
  const roleKeys = [...new Set(grants.map((r) => r.role_key))].sort();
  const cell = (role: string, resource: string) =>
    new Set(grants.filter((r) => r.role_key === role && r.resource_key === resource).map((r) => r.action_key));

  const countByRole = new Map<string, number>();
  for (const u of users) countByRole.set(u.role, (countByRole.get(u.role) ?? 0) + 1);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="font-mono-tech text-xs tracking-[0.1em] text-[color:var(--color-accent-secondary)]">RBAC</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">Roles &amp; permissions</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Rendered directly from <code className="font-mono-tech text-xs">role_permissions</code> — the authoritative
          source used by <code className="font-mono-tech text-xs">public.can()</code> and by row-level security. Grants
          themselves change only through reviewed migrations; assigning a role to an account is the operation offered
          below.
        </p>
      </header>

      <section className="overflow-x-auto rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]">
        <table className="w-full min-w-[880px] text-left text-xs">
          <thead className="font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">
            <tr>
              <th className="px-4 py-3">ROLE</th>
              <th className="px-4 py-3">USERS</th>
              {ACTIONS.map((a) => <th key={a} className="px-2 py-3 text-center">{a}</th>)}
            </tr>
          </thead>
          <tbody>
            {roleKeys.map((role) => (
              <tr key={role} className="border-t border-[color:var(--color-border)]">
                <td className="px-4 py-3">
                  <span className="font-display text-sm text-[color:var(--color-text-primary)]">{ROLE_LABELS[role as Role] ?? role}</span>
                  <span className="ml-2 font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">{resources.length} resources</span>
                </td>
                <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">{countByRole.get(role) ?? 0}</td>
                {ACTIONS.map((action) => {
                  const granted = resources.filter((resource) => cell(role, resource).has(action));
                  return (
                    <td key={action} className="px-2 py-3 text-center">
                      {granted.length === 0 ? (
                        <span className="text-[color:var(--color-text-muted)]">—</span>
                      ) : (
                        <span
                          title={granted.join(", ")}
                          className="inline-block rounded-full bg-[color:var(--color-accent-primary)] px-2 py-0.5 font-mono-tech text-[10px] text-white"
                        >
                          {granted.length}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {roleKeys.length === 0 ? (
              <tr><td colSpan={ACTIONS.length + 2} className="px-4 py-8 text-center text-[color:var(--color-text-muted)]">No grants are readable by this account.</td></tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">Role assignment</h2>

        {!canAssign ? (
          <p className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-primary)] p-5 text-sm text-[color:var(--color-text-secondary)]">
            Your account can read the matrix but not change it:{" "}
            <code className="font-mono-tech text-xs">{"can('roles','manage')"}</code> is false. Assigning roles is a super
            admin capability, and the database enforces the same rule in{" "}
            <code className="font-mono-tech text-xs">guard_profiles_privileges()</code>.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[color:var(--color-text-muted)]">
              Changing a role is recorded as <code className="font-mono-tech text-xs">role_changed</code> in the audit
              log. Granting or revoking super admin additionally requires typing GRANT, and the last active super
              admin cannot be demoted.
            </p>
            {users.map((u) => (
              <div key={u.id} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5">
                <p className="font-display text-sm text-[color:var(--color-text-primary)]">
                  {u.full_name ?? "Unnamed"}{" "}
                  <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">
                    {u.email ?? u.id.slice(0, 8)} · currently {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </p>
                <AuthStateForm action={assignRoleAction} idle={IDLE} submitLabel="Assign role" columns="sm:grid-cols-3">
                  <input type="hidden" name="id" value={u.id} />
                  <label className="flex flex-col gap-1">
                    <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">NEW ROLE</span>
                    <select name="role" defaultValue={u.role} className="input-base">
                      {(roles ?? []).map((r) => (
                        <option key={String(r.key)} value={String(r.key)}>
                          {ROLE_LABELS[String(r.key) as Role] ?? String(r.key)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">TYPE GRANT IF SUPER ADMIN IS INVOLVED</span>
                    <input name="confirm" className="input-base" autoComplete="off" />
                  </label>
                </AuthStateForm>
              </div>
            ))}
            {users.length === 0 ? <p className="text-sm text-[color:var(--color-text-muted)]">No accounts returned.</p> : null}
          </div>
        )}
      </section>

      <p className="text-xs text-[color:var(--color-text-muted)]">
        Hover a count for the resources covered. Empty cells mean no grant exists — access is denied at the database,
        not merely hidden.
      </p>
    </div>
  );
}
