import { createSupabaseServer, requestContext } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AuditInput = {
  action: string;
  resourceType?: string;
  resourceId?: string;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Append-only security/admin audit trail.
 * Never pass credentials, tokens, codes or secrets in metadata — the allow-list
 * below strips anything that looks like one before it leaves the process.
 */
const REDACTED = /password|passwd|token|secret|apikey|api_key|code|otp|authorization|cookie|session/i;

function sanitize(metadata: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (REDACTED.test(key)) continue;
    if (value === null || typeof value === "boolean" || typeof value === "number") {
      out[key] = value;
    } else if (typeof value === "string") {
      out[key] = value.slice(0, 240);
    } else if (Array.isArray(value)) {
      out[key] = value.slice(0, 20).map((v) => String(v).slice(0, 120));
    }
  }
  return out;
}

export async function recordAuditEvent(input: AuditInput): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = await createSupabaseServer();
    const { ip, userAgent } = await requestContext();

    await supabase.from("audit_logs").insert({
      actor_user_id: input.actorUserId ?? null,
      action: input.action.slice(0, 80),
      resource_type: input.resourceType?.slice(0, 80) ?? null,
      resource_id: input.resourceId?.slice(0, 120) ?? null,
      ip_address: ip,
      user_agent: userAgent ? userAgent.slice(0, 300) : null,
      metadata: sanitize(input.metadata ?? {}),
    });
  } catch {
    // Auditing must never break the operation it is observing.
  }
}
