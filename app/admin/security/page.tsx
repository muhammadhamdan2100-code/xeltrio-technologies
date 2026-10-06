import Link from "next/link";
import { requirePermission } from "@/lib/authz/guards";
import { getRecentActivity, getSystemHealth } from "@/lib/admin/queries";

const EVENTS = ["login", "logout", "login_failed", "password_reset_requested", "password_reset", "role_change", "account_status_change", "authorization_denied", "security_event", "page_published", "media_uploaded", "media_deleted", "revision_restored"];

export default async function SecurityPage() {
  await requirePermission("audit.logs", "view", "/admin/security");
  const [activity, health] = await Promise.all([getRecentActivity(15), getSystemHealth()]);
  const security = activity.filter((a) => ["login", "logout", "login_failed", "authorization_denied", "security_event", "role_change", "account_status_change"].includes(a.action));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="font-mono-tech text-xs tracking-[0.1em] text-[color:var(--color-accent-secondary)]">SECURITY</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">Security center</h1>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {health.map((h) => (
          <div key={h.label} className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4">
            <p className="font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">{h.label.toUpperCase()}</p>
            <p className="mt-1 font-display text-sm font-semibold text-[color:var(--color-text-primary)]">{h.status}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">Login &amp; security history</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {security.length > 0 ? security.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-4 py-3">
              <span className="font-mono-tech text-xs text-[color:var(--color-accent-secondary)]">{a.action}</span>
              <span className="text-xs text-[color:var(--color-text-muted)]">{a.actor} · {a.resourceType ?? "—"}</span>
              <time className="font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">{a.at.slice(0, 19).replace("T", " ")}</time>
            </li>
          )) : (
            <li className="rounded-xl border border-dashed border-[color:var(--color-border)] px-4 py-6 text-center text-sm text-[color:var(--color-text-muted)]">
              No sign-in events recorded yet. Supabase Auth owns the credential itself, so a failed attempt is only
              visible here when the application observes it.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6">
        <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">Sessions &amp; devices</h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Not available in this architecture. Supabase Auth does not expose a per-user session/device list through the
          browser client, and inventing device identifiers would be misleading. Global (all-device) revocation is not
          implemented — sign-out clears the current browser session only.
        </p>
        <p className="mt-3 font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">STATUS: NOT AVAILABLE / FUTURE ENHANCEMENT</p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">Monitored events</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {EVENTS.map((e) => <span key={e} className="rounded-full border border-[color:var(--color-border)] px-3 py-1 font-mono-tech text-[11px] text-[color:var(--color-text-secondary)]">{e}</span>)}
        </div>
        <Link href="/admin/security/audit-logs" className="mt-4 inline-block rounded-xl bg-[color:var(--color-accent-primary)] px-5 py-2.5 font-display text-sm font-semibold text-white">
          Open full audit log
        </Link>
      </section>
    </div>
  );
}
