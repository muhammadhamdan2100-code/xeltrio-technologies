import { requirePermission } from "@/lib/authz/guards";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function AdminMessagesPage() {
  await requirePermission("crm.messages", "view", "/admin/messages");

  const supabase = await createSupabaseServer();
  const { data: messages } = await supabase.from("contact_messages").select("status,created_at");
  const { count: subscribers } = await supabase
    .from("newsletter_subscribers")
    .select("id", { count: "exact", head: true });

  const byStatus = new Map<string, number>();
  for (const m of messages ?? []) {
    const key = String(m.status ?? "unknown");
    byStatus.set(key, (byStatus.get(key) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-[color:var(--color-text-primary)]">Inbound</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Aggregated only. Contact details are deliberately not rendered here — CRM triage is a later phase,
          and this page exists to prove the read path is staff-gated at the database layer.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...byStatus.entries()].map(([status, n]) => (
          <div
            key={status}
            className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6"
          >
            <p className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">{n}</p>
            <p className="mt-1 font-mono-tech text-xs text-[color:var(--color-text-muted)]">
              {status.toUpperCase()}
            </p>
          </div>
        ))}
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] p-6">
          <p className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">
            {subscribers ?? 0}
          </p>
          <p className="mt-1 font-mono-tech text-xs text-[color:var(--color-text-muted)]">SUBSCRIBERS</p>
        </div>
      </div>

      <p className="text-sm text-[color:var(--color-text-muted)]">
        Note: the site&apos;s contact form is still a client-side simulation, so inbound rows cannot originate
        from the public site yet.
      </p>
    </div>
  );
}
