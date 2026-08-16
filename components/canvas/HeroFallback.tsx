export function HeroFallback() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div
        className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[2px]"
        style={{
          background:
            "radial-gradient(circle at 42% 38%, rgba(188,212,255,0.55), rgba(79,140,255,0.35) 35%, rgba(13,26,61,0.15) 60%, transparent 72%)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--color-accent-primary)]/25"
      />
      <div
        className="absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--color-accent-primary)]/15"
      />
    </div>
  );
}
