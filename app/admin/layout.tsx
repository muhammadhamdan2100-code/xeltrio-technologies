import Link from "next/link";
import { requireAuth } from "@/lib/authz/guards";
import { signOutAction } from "@/app/auth/actions";
import { getPermissionMatrix, unreadCount } from "@/lib/admin/queries";
import { ROLE_LABELS, type Action, type Resource, type Role } from "@/lib/authz/permissions";

type NavItem = { href: string; label: string; resource: Resource; action: Action };

const NAV: NavItem[] = [
  { href: "/admin/cms", label: "CMS", resource: "pages", action: "view" },
  { href: "/admin/media", label: "Media", resource: "media", action: "view" },
  { href: "/admin/products", label: "Products", resource: "products", action: "view" },
  { href: "/admin/content", label: "Content", resource: "site.content", action: "view" },
  { href: "/admin/messages", label: "Inbound", resource: "crm.messages", action: "view" },
  { href: "/admin/users", label: "Users", resource: "users", action: "view" },
  { href: "/admin/roles", label: "Roles", resource: "roles", action: "view" },
  { href: "/admin/security", label: "Security", resource: "audit.logs", action: "view" },
  { href: "/admin/settings", label: "Settings", resource: "settings", action: "view" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Independent server-side verification for every /admin/* render.
  const principal = await requireAuth();

  const matrix = (await getPermissionMatrix()) ?? [];
  const grants = new Set(matrix.filter((g) => g.role_key === principal.role).map((g) => `${g.resource_key}:${g.action_key}`));
  const allowed = NAV.filter((item) => grants.has(`${item.resource}:${item.action}`));
  const unread = await unreadCount();

  return (
    <div className="min-h-screen bg-[color:var(--color-bg-primary)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--color-border)] px-6 py-4 lg:px-8">
        <Link href="/admin" className="font-display text-base font-semibold text-[color:var(--color-text-primary)]">
          XELTRIO <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">/ CONTROL CENTER</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">
            {principal.fullName ?? principal.email ?? "signed in"} · {ROLE_LABELS[principal.role as Role] ?? principal.role}
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-xl border border-[color:var(--color-border)] px-4 py-2 font-display text-xs font-semibold text-[color:var(--color-text-primary)]"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-6 py-8 lg:flex-row lg:gap-10 lg:px-8">
        <aside className="lg:w-[210px] lg:shrink-0">
          <nav aria-label="Admin sections" className="flex flex-wrap gap-1 lg:flex-col">
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 font-mono-tech text-xs text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-elevated)]"
            >
              DASHBOARD
            </Link>
            {allowed.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 font-mono-tech text-xs text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-bg-elevated)]"
              >
                {item.label.toUpperCase()}
                {item.href === "/admin/security" && unread > 0 ? (
                  <span className="rounded-full bg-[color:var(--color-accent-secondary)] px-1.5 text-[10px] text-white">{unread}</span>
                ) : null}
              </Link>
            ))}
            <Link
              href="/admin/account"
              className="rounded-lg px-3 py-2 font-mono-tech text-xs text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-bg-elevated)]"
            >
              MY ACCOUNT
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
