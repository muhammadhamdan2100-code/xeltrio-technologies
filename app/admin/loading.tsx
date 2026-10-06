export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[color:var(--color-bg-elevated)]" />
      <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-[color:var(--color-bg-elevated)]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)]" />
      <p className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">Loading data…</p>
    </div>
  );
}
