import { BUSINESSOS_ARCHITECTURE_LAYERS } from "@/lib/constants";

export function ArchitectureDiagram() {
  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-10">
      <div className="flex flex-col gap-3">
        {BUSINESSOS_ARCHITECTURE_LAYERS.map((layer, i) => {
          const depth = i / (BUSINESSOS_ARCHITECTURE_LAYERS.length - 1);
          return (
            <div
              key={layer.label}
              className="relative overflow-hidden rounded-xl border p-5 sm:p-6"
              style={{
                borderColor: `rgba(79,140,255,${0.14 + depth * 0.22})`,
                background: `linear-gradient(90deg, rgba(79,140,255,${0.03 + depth * 0.05}), transparent)`,
              }}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <div className="flex items-center gap-3">
                  <span className="font-mono-tech text-xs text-[color:var(--color-accent-secondary)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-base font-semibold text-[color:var(--color-text-primary)] sm:text-lg">
                    {layer.label}
                  </h3>
                </div>
                <p className="max-w-md text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                  {layer.detail}
                </p>
              </div>
              {i < BUSINESSOS_ARCHITECTURE_LAYERS.length - 1 && (
                <div
                  className="absolute -bottom-3 left-8 h-3 w-px bg-[color:var(--color-border)]"
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
