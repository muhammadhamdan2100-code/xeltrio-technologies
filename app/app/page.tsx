import Link from "next/link";
import { requireAuth } from "@/lib/authz/guards";

export default async function AppHome() {
  const principal = await requireAuth();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
          Workspace
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          You are signed in as{" "}
          <span className="text-[color:var(--color-text-primary)]">
            {principal.fullName ?? principal.email ?? "your account"}
          </span>
          . This area proves the private route boundary: reaching it requires a validated session, and any
          data it will show is additionally filtered by row-level security ownership.
        </p>
      </div>

      <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6">
        <p className="font-display text-base font-semibold text-[color:var(--color-text-primary)]">
          Nothing is listed here yet
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Client projects, files and messages belong to Part 04 and later. They are deliberately absent
          rather than populated with invented records.
        </p>
      </div>

      <Link
        href="/"
        className="text-sm text-[color:var(--color-accent-secondary)] underline underline-offset-4"
      >
        Back to the public site
      </Link>
    </div>
  );
}
