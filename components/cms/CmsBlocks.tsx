import Link from "next/link";
import type { CmsItem, CmsSection } from "@/lib/cms/public";
import { safeHref } from "@/lib/cms/public";

type Strings = Record<string, string | null>;

function text(item: CmsItem | null | undefined, ...keys: string[]): string | null {
  if (!item) return null;
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 1500);
    if (typeof value === "number" || typeof value === "boolean") return String(value);
  }
  return null;
}

function list(section: CmsSection): CmsItem[] {
  return Array.isArray(section.items) ? section.items.filter((i) => i && typeof i === "object") : [];
}

function Shell({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "raised" }) {
  return (
    <section
      className={
        tone === "raised"
          ? "border-y border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] py-20"
          : "py-20"
      }
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-12">{children}</div>
    </section>
  );
}

function Heading({ section }: { section: CmsSection }) {
  return (
    <header className="mb-10 max-w-3xl">
      {section.eyebrow ? (
        <p className="font-mono-tech text-[11px] tracking-[0.12em] text-[color:var(--color-accent-secondary)]">
          {section.eyebrow.toUpperCase()}
        </p>
      ) : null}
      {section.title ? (
        <h2 className="mt-3 font-display text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-[color:var(--color-text-primary)] sm:text-[38px]">
          {section.title}
        </h2>
      ) : null}
      {section.subtitle ? (
        <p className="mt-3 text-base leading-relaxed text-[color:var(--color-text-secondary)]">{section.subtitle}</p>
      ) : null}
    </header>
  );
}

function CardGrid({ section }: { section: CmsSection }) {
  const items = list(section);
  if (items.length === 0) return <Empty label="This block has no entries yet." />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => {
        const href = safeHref(item.href ?? item.link);
        const title = text(item, "title", "name", "label") ?? `Item ${index + 1}`;
        const description = text(item, "description", "body", "detail", "text");
        const badge = text(item, "badge", "tag");
        const inner = (
          <div className="h-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6 transition-colors hover:border-[color:var(--color-accent-secondary)]">
            {badge ? (
              <span className="font-mono-tech text-[10px] tracking-[0.1em] text-[color:var(--color-accent-secondary)]">
                {badge.toUpperCase()}
              </span>
            ) : null}
            <h3 className="mt-2 font-display text-lg font-semibold text-[color:var(--color-text-primary)]">{title}</h3>
            {description ? (
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">{description}</p>
            ) : null}
          </div>
        );
        return href ? (
          <Link key={index} href={href} className="block">
            {inner}
          </Link>
        ) : (
          <div key={index}>{inner}</div>
        );
      })}
    </div>
  );
}

function Stats({ section }: { section: CmsSection }) {
  const items = list(section);
  if (items.length === 0) return <Empty label="No figures published yet." />;
  return (
    <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <div key={index} className="rounded-2xl border border-[color:var(--color-border)] p-6">
          <dt className="font-mono-tech text-[11px] uppercase tracking-[0.1em] text-[color:var(--color-text-muted)]">
            {text(item, "label", "name") ?? `Metric ${index + 1}`}
          </dt>
          <dd className="mt-2 font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">
            {text(item, "value", "figure") ?? "—"}
          </dd>
          {text(item, "detail", "description") ? (
            <p className="mt-2 text-xs text-[color:var(--color-text-secondary)]">{text(item, "detail", "description")}</p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

function Faq({ section }: { section: CmsSection }) {
  const items = list(section);
  if (items.length === 0) return <Empty label="No questions published yet." />;
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <details key={index} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-5">
          <summary className="cursor-pointer font-display text-base text-[color:var(--color-text-primary)]">
            {text(item, "question", "title") ?? `Question ${index + 1}`}
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
            {text(item, "answer", "body", "description") ?? "No answer published."}
          </p>
        </details>
      ))}
    </div>
  );
}

function Testimonials({ section }: { section: CmsSection }) {
  const items = list(section);
  if (items.length === 0) return <Empty label="No testimonials published yet." />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item, index) => (
        <figure key={index} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6">
          <blockquote className="text-sm leading-relaxed text-[color:var(--color-text-primary)]">
            {text(item, "quote", "body") ?? "—"}
          </blockquote>
          <figcaption className="mt-4 font-mono-tech text-[11px] text-[color:var(--color-text-muted)]">
            {[text(item, "name"), text(item, "role"), text(item, "company")].filter(Boolean).join(" · ")}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function Logos({ section }: { section: CmsSection }) {
  const items = list(section);
  if (items.length === 0) return <Empty label="No logos published yet." />;
  return (
    <div className="flex flex-wrap gap-6">
      {items.map((item, index) => {
        const name = text(item, "name", "title") ?? `Logo ${index + 1}`;
        const src = safeHref(item.url ?? item.src);
        return src ? (
          <span key={index} className="flex items-center gap-2 text-sm text-[color:var(--color-text-secondary)]">
            {/* Logos come from admin-authored settings/sections on arbitrary hosts,
                so next/image would need a remotePatterns entry per tenant. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={name} className="h-6 w-auto" loading="lazy" />
            {name}
          </span>
        ) : (
          <span key={index} className="font-mono-tech text-sm text-[color:var(--color-text-muted)]">
            {name}
          </span>
        );
      })}
    </div>
  );
}

function Cta({ section }: { section: CmsSection }) {
  const props = (section.props ?? {}) as Strings;
  const primary = safeHref(props.href ?? props.cta_href);
  const label = text(props as CmsItem, "cta_label", "label") ?? "Get in touch";
  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-10 text-center">
      {section.title ? (
        <h2 className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">{section.title}</h2>
      ) : null}
      {section.body ? (
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">{section.body}</p>
      ) : null}
      {primary ? (
        <Link
          href={primary}
          className="mt-6 inline-block rounded-xl bg-[color:var(--color-accent-primary)] px-6 py-3 font-display text-sm font-semibold text-white"
        >
          {label}
        </Link>
      ) : (
        <p className="mt-6 font-mono-tech text-xs text-[color:var(--color-text-muted)]">No link configured</p>
      )}
    </div>
  );
}

function Hero({ section }: { section: CmsSection }) {
  return (
    <section className="border-y border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] py-24">
      <div className="mx-auto w-full max-w-[1400px] px-6 text-center lg:px-12">
        {section.eyebrow ? (
          <p className="font-mono-tech text-[11px] tracking-[0.14em] text-[color:var(--color-accent-secondary)]">
            {section.eyebrow.toUpperCase()}
          </p>
        ) : null}
        <h1 className="mx-auto mt-5 max-w-4xl font-display text-[38px] font-semibold leading-[1.08] tracking-[-0.02em] text-[color:var(--color-text-primary)] sm:text-[54px]">
          {section.title ?? "Untitled section"}
        </h1>
        {section.subtitle ? (
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[color:var(--color-text-secondary)]">
            {section.subtitle}
          </p>
        ) : null}
        {section.body ? (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-muted)]">{section.body}</p>
        ) : null}
      </div>
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">{label}</p>;
}

/**
 * Renders one published section. Every value reaches the DOM as a React child,
 * and every link or image src passes through safeHref(), so content authored in
 * the admin cannot introduce markup, scripts or off-protocol URLs. Unknown
 * section types render nothing rather than something unsafe.
 */
export function Block({ section }: { section: CmsSection }) {
  switch (section.section_type) {
    case "hero":
      return <Hero section={section} />;
    case "cards":
    case "features":
    case "custom":
    case "rich_list":
      return (
        <Shell>
          <Heading section={section} />
          <CardGrid section={section} />
        </Shell>
      );
    case "stats":
      return (
        <Shell tone="raised">
          <Heading section={section} />
          <Stats section={section} />
        </Shell>
      );
    case "cta":
      return (
        <Shell>
          <Cta section={section} />
        </Shell>
      );
    case "testimonials":
      return (
        <Shell tone="raised">
          <Heading section={section} />
          <Testimonials section={section} />
        </Shell>
      );
    case "faq":
      return (
        <Shell>
          <Heading section={section} />
          <Faq section={section} />
        </Shell>
      );
    case "logos":
      return (
        <Shell tone="raised">
          <Heading section={section} />
          <Logos section={section} />
        </Shell>
      );
    default:
      return null;
  }
}
