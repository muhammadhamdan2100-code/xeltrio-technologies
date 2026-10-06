"use client";

/**
 * Admin error boundary. The underlying message is deliberately not rendered:
 * Supabase/Postgres errors can name tables, columns or policies, which is exactly
 * what an unauthorized caller benefits from seeing. The operator gets a stable,
 * actionable sentence and a retry.
 */
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono-tech text-xs tracking-[0.1em] text-[color:var(--color-accent-secondary)]">UNAVAILABLE</p>
      <h2 className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">
        This section could not be loaded
      </h2>
      <p className="max-w-xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        The request failed, or this account is not permitted to read the data it asked for. Nothing was changed.
        Try again, and if it keeps happening check the audit log for a matching denial.
      </p>
      <div>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-[color:var(--color-accent-primary)] px-5 py-2.5 font-display text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
