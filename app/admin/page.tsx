import Link from "next/link";
import { requireAuth, can } from "@/lib/authz/guards";
import { getOverviewMetrics, getStatistics, getRecentActivity, getSystemHealth, getNotifications } from "@/lib/admin/queries";
import type { Resource, Action } from "@/lib/authz/permissions";

const QUICK: { href: string; label: string; resource: Resource; action: Action }[] = [
  { href: "/admin/cms?new=1", label: "New page", resource: "pages", action: "create" },
  { href: "/admin/media", label: "Upload media", resource: "media", action: "create" },
  { href: "/admin/users", label: "Manage users", resource: "users", action: "view" },
  { href: "/admin/cms", label: "Manage content", resource: "pages", action: "view" },
  { href: "/admin/security/audit-logs", label: "View audit logs", resource: "audit.logs", action: "view" },
  { href: "/admin/settings", label: "System settings", resource: "settings", action: "view" },
];

function Stat({ label, value, source, note }: { label: string; value: number | null; source: string; note?: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4">
      <p className="font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">{label.toUpperCase()}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">
        {value === null ? <span className="text-base font-normal text-[color:var(--color-text-muted)]">No data yet</span> : value}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-[color:var(--color-text-muted)]">{note ?? source}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const principal = await requireAuth();

  const [metrics, stats, activity, health, notifications] = await Promise.all([
    getOverviewMetrics(),
    getStatistics(),
    getRecentActivity(10),
    getSystemHealth(),
    getNotifications(6),
  ]);

  const quick: typeof QUICK = [];
  for (const item of QUICK) {
    if (await can(principal, item.resource, item.action)) quick.push(item);
  }

  const showUsers = await can(principal, "users", "view");
  const showAudit = await can(principal, "audit.logs", "view");

  return (
    <div className="flex flex-col gap-10">
      <section>
        <p className="font-mono-tech text-xs tracking-[0.1em] text-[color:var(--color-accent-secondary)]">OVERVIEW</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">Control center</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Every figure below is read live from the database under row-level security. Metrics the application
          does not collect yet are shown as unavailable rather than as zero.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Users" value={showUsers ? metrics.users : null} source={showUsers ? "public.profiles" : "not permitted for your role"} />
          <Stat label="Products" value={metrics.products} source="public.products" />
          <Stat label="CMS pages" value={metrics.pages} source="public.pages" />
          <Stat label="Media assets" value={metrics.media} source="public.media_assets" />
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">Statistics</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {stats.map((s) => (
            <Stat key={s.label} label={s.label} value={s.value} source={s.source} note={s.note} />
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">Recent activity</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {showAudit && activity.length > 0
              ? activity.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-4 py-3"
                  >
                    <span className="font-mono-tech text-xs text-[color:var(--color-accent-secondary)]">{a.action}</span>
                    <span className="min-w-0 flex-1 truncate text-xs text-[color:var(--color-text-muted)]">
                      {a.actor}
                      {a.resourceType ? ` · ${a.resourceType}` : ""}
                    </span>
                    <time className="shrink-0 font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">
                      {a.at.slice(0, 10)}
                    </time>
                  </li>
                ))
              : null}
            {showAudit && activity.length === 0 ? (
              <li className="rounded-xl border border-dashed border-[color:var(--color-border)] px-4 py-6 text-center text-sm text-[color:var(--color-text-muted)]">
                No events recorded yet. Sign-ins, content changes and security events appear here automatically.
              </li>
            ) : null}
            {!showAudit ? (
              <li className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-4 py-6 text-center text-sm text-[color:var(--color-text-muted)]">
                Audit history is not available for your role.
              </li>
            ) : null}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">System health</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {health.map((h) => (
              <li key={h.label} className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-4">
                <p className="font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">{h.label.toUpperCase()}</p>
                <p
                  className={
                    "mt-1 font-display text-sm font-semibold " +
                    (h.status === "MISSING" || h.status === "DEGRADED"
                      ? "text-[color:var(--color-accent-secondary)]"
                      : "text-[color:var(--color-text-primary)]")
                  }
                >
                  {h.status}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-[color:var(--color-text-muted)]">{h.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">Notifications</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {notifications.length > 0
              ? notifications.map((n) => (
                  <li key={n.id} className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-4 py-3">
                    <p className="font-display text-sm font-semibold text-[color:var(--color-text-primary)]">
                      {n.title}{" "}
                      <span className="font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">{n.severity}</span>
                    </p>
                    {n.message ? <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">{n.message}</p> : null}
                  </li>
                ))
              : null}
            {notifications.length === 0 ? (
              <li className="rounded-xl border border-dashed border-[color:var(--color-border)] px-4 py-6 text-center text-sm text-[color:var(--color-text-muted)]">
                Nothing new. New enquiries and security events raise notifications automatically.
              </li>
            ) : null}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {quick.length > 0
              ? quick.map((q) => (
                  <Link
                    key={q.href + q.label}
                    href={q.href}
                    className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] px-4 py-3 font-display text-sm text-[color:var(--color-text-primary)] hover:border-[color:var(--color-accent-primary)]"
                  >
                    {q.label}
                  </Link>
                ))
              : null}
            {quick.length === 0 ? (
              <p className="text-sm text-[color:var(--color-text-muted)]">
                Your role has no quick actions enabled.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
