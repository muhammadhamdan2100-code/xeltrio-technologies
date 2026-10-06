"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/authz/audit";
import { CONTACT_BUDGET_OPTIONS, CONTACT_SERVICE_OPTIONS, CONTACT_TIMELINE_OPTIONS } from "@/lib/constants";

export type ContactResult = { ok: boolean; message?: string };

function value(form: FormData, name: string, max: number): string {
  const raw = form.get(name);
  return typeof raw === "string" ? raw.slice(0, max).trim() : "";
}

/**
 * Public enquiry intake. There is deliberately no authorization check here:
 * the writer is anonymous by design, and the boundary is the
 * `contact_messages_public_insert` row-level-security policy plus the column
 * defaults. `status` is never read from the form, so a visitor cannot mark their
 * own enquiry as handled, and no id, role or actor value is accepted.
 */
export async function submitContactAction(form: FormData): Promise<ContactResult> {
  const fullName = value(form, "fullName", 120);
  const email = value(form, "email", 200);
  const message = value(form, "message", 4000);

  if (fullName.length < 2) return { ok: false, message: "Please tell us your name." };
  if (!/^[^\s@<>"']+@[^\s@<>"]+\.[^\s@<>"']{2,}$/.test(email)) {
    return { ok: false, message: "That email address doesn't look right." };
  }
  if (message.length < 10) return { ok: false, message: "Please add a little more detail to your message." };

  const service = value(form, "service", 120);
  const budget = value(form, "budget", 60);
  const timeline = value(form, "timeline", 60);
  if (service && !CONTACT_SERVICE_OPTIONS.includes(service)) return { ok: false, message: "Unknown service selected." };
  if (budget && !CONTACT_BUDGET_OPTIONS.includes(budget)) return { ok: false, message: "Unknown budget range selected." };
  if (timeline && !CONTACT_TIMELINE_OPTIONS.includes(timeline)) return { ok: false, message: "Unknown timeline selected." };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("contact_messages").insert({
    full_name: fullName,
    email,
    message,
    company_name: value(form, "companyName", 120) || null,
    phone: value(form, "phone", 40) || null,
    country: value(form, "country", 80) || null,
    service: service || null,
    budget: budget || null,
    timeline: timeline || null,
  });

  if (error) {
    // The database rejected it (policy or constraint). Record that a write was
    // attempted without storing the visitor's message text or address.
    await recordAuditEvent({
      action: "security_event",
      resourceType: "contact_messages",
      metadata: { reason: "contact_insert_rejected" },
    });
    return { ok: false, message: "We could not send that just now. Please try again in a moment." };
  }

  return { ok: true };
}
