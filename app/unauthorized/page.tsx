import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Access unavailable — Xeltrio Technologies",
  robots: { index: false, follow: false },
};

/**
 * Deliberately generic: no role names, no required permission, no route list,
 * no hint about which resources exist behind this door.
 */
export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[color:var(--color-bg-primary)] px-6 py-24">
      <div className="w-full max-w-[520px] rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-8">
        <p className="font-mono-tech text-xs tracking-[0.1em] text-[color:var(--color-accent-secondary)]">
          403
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">
          Access unavailable
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Your account does not have permission to open that area. Nothing about the resource you
          requested is shown here on purpose.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-xl bg-[color:var(--color-accent-primary)] px-5 py-3 font-display text-sm font-semibold text-white"
          >
            Go to my dashboard
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-[color:var(--color-border)] px-5 py-3 font-display text-sm font-semibold text-[color:var(--color-text-primary)]"
          >
            Public site
          </Link>
        </div>
      </div>
    </main>
  );
}
