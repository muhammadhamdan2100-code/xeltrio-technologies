type Point = { x: number; y: number };

export function ConnectionLines({
  center,
  points,
  activeIndex,
  animated,
}: {
  center: Point;
  points: Point[];
  activeIndex: number;
  animated: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ecosystem-line" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f8cff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#8ab4ff" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {points.map((point, i) => {
        const isActive = i === activeIndex;
        const pathId = `ecosystem-path-${i}`;
        return (
          <g key={i}>
            <path
              id={pathId}
              d={`M ${center.x} ${center.y} L ${point.x} ${point.y}`}
              fill="none"
              stroke="url(#ecosystem-line)"
              strokeWidth={isActive ? 0.35 : 0.18}
              className="transition-[stroke-width] duration-300"
            />
            {animated && (
              <circle r={isActive ? 0.9 : 0.6} fill={isActive ? "#bcd4ff" : "#4f8cff"} opacity={isActive ? 0.95 : 0.6}>
                <animateMotion
                  dur={`${3.2 + i * 0.6}s`}
                  repeatCount="indefinite"
                  path={`M ${center.x} ${center.y} L ${point.x} ${point.y}`}
                />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}
