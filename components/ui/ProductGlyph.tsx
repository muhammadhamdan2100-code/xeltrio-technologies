export function ProductGlyph({ seed }: { seed: number }) {
  const hue = (seed * 47) % 360;
  return (
    <div
      className="relative h-28 w-full overflow-hidden rounded-xl"
      style={{ background: "linear-gradient(135deg, rgba(79,140,255,0.16), rgba(79,140,255,0.02))" }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 100" className="absolute inset-0 h-full w-full opacity-80">
        <defs>
          <linearGradient id={`g${seed}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8ab4ff" />
            <stop offset="100%" stopColor="#2452c9" />
          </linearGradient>
        </defs>
        {Array.from({ length: 4 }).map((_, i) => (
          <circle
            key={i}
            cx={30 + i * 45 + ((seed * 13) % 20)}
            cy={30 + ((i + seed) % 3) * 20}
            r={3}
            fill={`url(#g${seed})`}
          />
        ))}
        <path
          d={`M20 ${50 + (seed % 10)} Q 100 ${10 + ((seed * 7) % 60)} 180 ${40 + (seed % 30)}`}
          stroke={`url(#g${seed})`}
          strokeWidth="1.4"
          fill="none"
          opacity={0.65}
        />
      </svg>
      <div className="absolute bottom-2 right-3 font-mono-tech text-[10px] tracking-[0.1em] text-[color:var(--color-text-muted)]">
        {String(hue).padStart(3, "0")}
      </div>
    </div>
  );
}
