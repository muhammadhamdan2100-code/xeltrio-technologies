import Link from "next/link";
import { requireAuth } from "@/lib/authz/guards";
import { signOutAction } from "@/app/auth/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Client-facing private area: any authenticated principal may enter, and every
  // data read below is still subject to RLS ownership checks.
  const principal = await requireAuth();

  return (
    <div className="min-h-screen bg-[color:var(--color-bg-primary)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--color-border)] px-6 py-4 lg:px-12">
        <Link href="/app" className="font-display text-base font-semibold text-[color:var(--color-text-primary)]">
          XELTRIO <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">/ WORKSPACE</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">
            {principal.fullName ?? principal.email ?? "signed in"}
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
      <main className="mx-auto max-w-[1100px] px-6 py-12 lg:px-12">{children}</main>
    </div>
  );
}
