import { requirePermission, can } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AuthStateForm } from "@/components/admin/AuthStateForm";
import { saveSettingsAction, type FormState } from "./actions";

const IDLE: FormState = { status: "idle" };

export default async function AdminSettingsPage() {
  const principal = await requirePermission("settings", "view", "/admin/settings");
  const canEdit = await can(principal, "settings", "edit");

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("admin_settings");
  const rows = error ? [] : ((data as SettingRow[] | null) ?? []);

  const byCategory = new Map<string, SettingRow[]>();
  for (const row of rows) {
    const list = byCategory.get(row.category) ?? [];
    list.push(row);
    byCategory.set(row.category, list);
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="font-mono-tech text-xs tracking-[0.1em] text-[color:var(--color-accent-secondary)]">CONFIGURATION</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">System settings</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Read through <code className="font-mono-tech text-xs">admin_settings()</code>, which raises{" "}
          <code className="font-mono-tech text-xs">42501</code> unless <code className="font-mono-tech text-xs">{"can('settings','view')"}</code>.
          Rows marked private are visible to administrators only and are never returned by{" "}
          <code className="font-mono-tech text-xs">public_settings()</code>. This table holds safe configuration only —
          credentials belong in environment variables, and the database refuses values that look like one.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6 text-sm text-[color:var(--color-text-muted)]">
          {error ? "The settings catalogue could not be read for this account." : "No settings rows exist yet."}
        </p>
      ) : null}

      {SECTIONS.map((section) => {
        const items = byCategory.get(section.key) ?? [];
        if (items.length === 0) return null;
        return (
          <section
            key={section.key}
            className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6"
          >
            <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">{section.title}</h2>
            <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">{section.note}</p>

            {canEdit ? (
              <AuthStateForm action={saveSettingsAction} idle={IDLE} submitLabel="Save section" columns="sm:grid-cols-2">
                <input type="hidden" name="category" value={section.key} />
                {items.map((row) => (
                  <Field key={row.key} row={row} />
                ))}
              </AuthStateForm>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {items.map((row) => (
                  <li key={row.key} className="flex items-baseline justify-between gap-4 border-b border-[color:var(--color-border)] pb-2 text-sm">
                    <span className="text-[color:var(--color-text-secondary)]">{row.key}</span>
                    <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">
                      {display(row) || "Not configured"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-primary)] p-6">
        <h2 className="font-display text-lg font-semibold text-[color:var(--color-text-primary)]">Runtime diagnostics</h2>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Derived from the running process and the database. Read-only, and never shows a value.
        </p>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <li className="flex justify-between gap-4">
            <span className="text-[color:var(--color-text-secondary)]">Supabase client configured</span>
            <span className="font-mono-tech text-xs text-[color:var(--color-text-primary)]">{isSupabaseConfigured() ? "YES" : "NO"}</span>
          </li>
          <li className="flex justify-between gap-4">
            <span className="text-[color:var(--color-text-secondary)]">NEXT_PUBLIC_SITE_URL set</span>
            <span className="font-mono-tech text-xs text-[color:var(--color-text-primary)]">
              {process.env.NEXT_PUBLIC_SITE_URL ? "YES" : "NOT CONFIGURED"}
            </span>
          </li>
          <li className="flex justify-between gap-4">
            <span className="text-[color:var(--color-text-secondary)]">Settings visible to you</span>
            <span className="font-mono-tech text-xs text-[color:var(--color-text-primary)]">
              {rows.filter((r) => r.is_public).length} public / {rows.filter((r) => !r.is_public).length} private
            </span>
          </li>
          <li className="flex justify-between gap-4">
            <span className="text-[color:var(--color-text-secondary)]">Editing permission</span>
            <span className="font-mono-tech text-xs text-[color:var(--color-text-primary)]">
              {canEdit ? "settings:edit" : "view only"}
            </span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-[color:var(--color-text-muted)]">
          Secret-type variables are intentionally absent from this screen: this deployment holds no service-role key,
          and environment values are read by name only.
        </p>
      </section>
    </div>
  );
}

type SettingRow = {
  key: string;
  value: unknown;
  type: string;
  category: string;
  description: string | null;
  is_public: boolean;
};

const SECTIONS: { key: string; title: string; note: string }[] = [
  { key: "company", title: "Company", note: "Display values. The canonical company record (name, tagline, mission, founded year) stays in the company table and is not duplicated here." },
  { key: "contact", title: "Contact", note: "Public contact details used by the contact area. Blank means the site falls back to the values already shipped in the constants module." },
  { key: "branding", title: "Branding", note: "Logo, favicon and sharing image. An empty override inherits the asset the design already uses." },
  { key: "social", title: "Social media", note: "Profile URLs. The public footer still reads its links from lib/constants.ts until it is migrated onto these values." },
  { key: "email", title: "Email", note: "Stored for an outbound mail provider. No provider is wired up, so these values are not used by any sender yet." },
  { key: "notifications", title: "Notifications", note: "Enforced in the database: notify_new_contact_message() consults these switches before writing an admin notification." },
  { key: "seo", title: "SEO defaults", note: "Fallback title suffix, description, sharing image, keywords and robots directive." },
  { key: "system", title: "System configuration", note: "Enforced at upload time: the media library reads system.media_max_upload_mb as its size ceiling." },
];

function display(row: SettingRow): string {
  const v = row.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  return JSON.stringify(v);
}

function Field({ row }: { row: SettingRow }) {
  const current = display(row);
  const isSecretish = /notification|system|email\./.test(row.key);

  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono-tech text-xs text-[color:var(--color-text-muted)]">
        {row.key.toUpperCase()}
        <span className={row.is_public ? "ml-2 text-[color:var(--color-accent-secondary)]" : "ml-2 text-[color:var(--color-text-muted)]"}>
          {row.is_public ? "PUBLIC" : "PRIVATE"}
        </span>
      </span>
      {row.type === "boolean" ? (
        <select name={row.key} defaultValue={String(current === "true")} className="input-base">
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      ) : row.type === "json" ? (
        <textarea name={row.key} defaultValue={current} rows={3} className="input-base font-mono-tech text-xs" />
      ) : row.type === "text" ? (
        <textarea name={row.key} defaultValue={current} rows={3} className="input-base" />
      ) : (
        <input
          name={row.key}
          defaultValue={row.type === "color" ? (isHex(current) ? current : "") : current}
          type={row.type === "number" ? "number" : "text"}
          className="input-base"
          placeholder={isSecretish ? "" : "Not configured"}
          maxLength={1000}
        />
      )}
      {row.description ? (
        <span className="text-[11px] leading-relaxed text-[color:var(--color-text-muted)]">{row.description}</span>
      ) : null}
    </label>
  );
}

function isHex(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}
