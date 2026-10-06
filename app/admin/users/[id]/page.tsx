import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission, can } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AuthStateForm } from "@/components/admin/AuthStateForm";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/authz/permissions";
import {
  assignRoleAction,
  deleteUserAction,
  setUserStatusAction,
  updateUserAction,
  type FormState,
  type TargetUser,
} from "../actions";

const IDLE: FormState = { status: "idle" };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function label(value: string): string {
  return value.replace(/_/g, " ");
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const principal = await requirePermission("users", "view", "/admin/users");
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("admin_profiles");
  const rows: TargetUser[] = error ? [] : ((data as TargetUser[] | null) ?? []);
  const target = rows.find((r) => String(r.id) === id);
  if (!target) notFound();

  const canEdit = await can(principal, "users", "edit");
  const canManage = await can(principal, "users", "manage");
  const canAssignRoles = await can(principal, "roles", "manage");
  const canDelete = await can(principal, "users", "delete");
  const isSelf = principal.userId === target.id;
  const superAdmins = rows.filter((r) => r.role === "super_admin" && r.status === "active").length;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/users" className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">
        ← All users
      </Link>

      <header className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6">
        <h1 className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">
          {target.full_name ?? "Unnamed account"}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">{target.email ?? "No email readable"}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
          {[
            ["Role", ROLE_LABELS[target.role] ?? target.role],
            ["Status", label(target.status)],
            ["Created", target.created_at ? target.created_at.slice(0, 10) : "Unavailable"],
            ["Account id", target.id.slice(0, 8)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono-tech text-[11px] uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">{k}</dt>
              <dd className="mt-1 text-[color:var(--color-text-primary)]">{v}</dd>
            </div>
          ))}
        </dl>
        {isSelf ? (
          <p className="mt-4 text-xs text-[color:var(--color-accent-secondary)]">
            This is the account you are signed in with. Self-deactivation, self role changes and self-deletion are
            refused server-side.
          </p>
        ) : null}
      </header>

      {canEdit ? (
        <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6">
          <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">Edit profile</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Only these fields are read from the form. Role and status have their own authorized actions, and a
            submitted role value would simply be ignored.
          </p>
          <AuthStateForm action={updateUserAction} idle={IDLE} submitLabel="Save profile">
            <input type="hidden" name="id" value={target.id} />
            <label className="flex flex-col gap-1">
              <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">FULL NAME</span>
              <input name="full_name" defaultValue={target.full_name ?? ""} className="input-base" maxLength={120} required />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">AVATAR URL</span>
              <input name="avatar_url" className="input-base" maxLength={500} placeholder="https://…" />
            </label>
          </AuthStateForm>
        </section>
      ) : null}

      {canManage ? (
        <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6">
          <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">Account status</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Deactivating sets the profile to <code className="font-mono-tech text-xs">suspended</code>, which every
            server-side authorization path rejects. The Supabase Auth session itself is owned by Auth and is not
            revoked here — that needs the Admin API.
          </p>
          <AuthStateForm
            action={setUserStatusAction}
            idle={IDLE}
            submitLabel={target.status === "active" ? "Deactivate account" : "Reactivate account"}
            confirm={target.status === "active" ? "DISABLE" : undefined}
          >
            <input type="hidden" name="id" value={target.id} />
            <input type="hidden" name="status" value={target.status === "active" ? "suspended" : "active"} />
            {target.status === "active" ? (
              <label className="flex flex-col gap-1">
                <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">TYPE DISABLE TO CONFIRM</span>
                <input name="confirm" className="input-base" autoComplete="off" />
              </label>
            ) : (
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                Current status is <strong>{label(target.status)}</strong>. Reactivating restores access.
              </p>
            )}
          </AuthStateForm>
          {superAdmins <= 1 && target.role === "super_admin" && target.status === "active" ? (
            <p className="mt-3 text-xs text-[color:var(--color-accent-secondary)]">
              This is the only active super admin; the server refuses to deactivate it.
            </p>
          ) : null}
        </section>
      ) : null}

      {canAssignRoles ? (
        <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6">
          <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">Role</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Visible because <code className="font-mono-tech text-xs">{"can('roles','manage')"}</code> resolved true.
            The database re-checks this in <code className="font-mono-tech text-xs">guard_profiles_privileges()</code>,
            and super admin grants still require a super admin actor (migration 016).
          </p>
          <AuthStateForm
            action={assignRoleAction}
            idle={IDLE}
            submitLabel="Change role"
            confirm="GRANT"
          >
            <input type="hidden" name="id" value={target.id} />
            <label className="flex flex-col gap-1">
              <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">NEW ROLE</span>
              <select name="role" defaultValue={target.role} className="input-base">
                {ROLES.filter((r) => r !== target.role).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r as Role]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">TYPE GRANT IF SUPER ADMIN IS INVOLVED</span>
              <input name="confirm" className="input-base" autoComplete="off" />
            </label>
          </AuthStateForm>
          {isSelf ? (
            <p className="mt-3 text-xs text-[color:var(--color-accent-secondary)]">
              You cannot change your own role from this screen.
            </p>
          ) : null}
        </section>
      ) : (
        <p className="text-sm text-[color:var(--color-text-muted)]">
          Role assignment is unavailable to your role — it requires the{" "}
          <code className="font-mono-tech text-xs">roles:manage</code> permission.
        </p>
      )}

      {canDelete ? (
        <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-primary)] p-6">
          <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">Delete profile</h2>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            Removes the profile row only. Supabase keeps the auth user, and deleting the last active super admin is
            refused. Prefer deactivation unless the account was created by mistake.
          </p>
          <AuthStateForm action={deleteUserAction} idle={IDLE} submitLabel="Delete profile" confirm="DELETE">
            <input type="hidden" name="id" value={target.id} />
            <label className="flex flex-col gap-1">
              <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">TYPE DELETE TO CONFIRM</span>
              <input name="confirm" className="input-base" autoComplete="off" />
            </label>
          </AuthStateForm>
        </section>
      ) : null}
    </div>
  );
}
