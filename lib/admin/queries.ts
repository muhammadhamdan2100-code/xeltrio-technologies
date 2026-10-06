import { createSupabaseServer } from "@/lib/supabase/server";
import type { Resource } from "@/lib/authz/permissions";

/**
 * Read models for the admin control centre.
 *
 * Rules enforced here:
 *  - only real database sources are reported; anything not collected yet is
 *    returned as null and rendered as "not configured", never as 0 or a guess;
 *  - every function runs on the server through the RLS-scoped user client, so a
 *    caller can never read further than their own grants allow;
 *  - pagination is always bounded (no full-table loads).
 */

export type Metric = { label: string; value: number | null; source: string; note?: string };

async function count(table: string, column = "id"): Promise<number | null> {
  try {
    const supabase = await createSupabaseServer();
    const { count, error } = await supabase
      .from(table)
      .select(column, { count: "exact", head: true });
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

export async function getOverviewMetrics() {
  const [users, products, pages, media, messages, subscribers, publishedContent] = await Promise.all([
    count("profiles"),
    count("products"),
    count("pages"),
    count("media_assets"),
    count("contact_messages"),
    count("newsletter_subscribers"),
    count("content_items"),
  ]);

  return { users, products, pages, media, messages, subscribers, publishedContent };
}

/** Statistics with an explicit source per figure and honest unavailable states. */
export async function getStatistics(): Promise<Metric[]> {
  const [products, pages, media, messages, subscribers, users, contentItems] = await Promise.all([
    count("products"),
    count("pages"),
    count("media_assets"),
    count("contact_messages"),
    count("newsletter_subscribers"),
    count("profiles"),
    count("content_items"),
  ]);

  return [
    { label: "Users", value: users, source: "public.profiles" },
    { label: "Products", value: products, source: "public.products" },
    { label: "CMS pages", value: pages, source: "public.pages" },
    { label: "Content records", value: contentItems, source: "public.content_items" },
    { label: "Media assets", value: media, source: "public.media_assets" },
    { label: "Contact enquiries", value: messages, source: "public.contact_messages" },
    { label: "Subscribers", value: subscribers, source: "public.newsletter_subscribers" },
    // Not collected by this application yet — reported as unavailable.
    { label: "Visitors", value: null, source: "no analytics integration", note: "Tracking not configured" },
    { label: "Revenue", value: null, source: "no payments integration", note: "Tracking not configured" },
    { label: "Projects", value: null, source: "no projects table", note: "Part 06+ scope" },
    { label: "Clients / leads", value: null, source: "no leads table", note: "Part 06+ scope" },
    { label: "AI activity", value: null, source: "no AI layer", note: "Part 06+ scope" },
  ];
}

export type ActivityRow = {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  actor: string;
  at: string;
  metadata: Record<string, unknown>;
};

/** Recent activity from the append-only audit trail (never secrets). */
export async function getRecentActivity(limit = 12): Promise<ActivityRow[]> {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id,action,resource_type,resource_id,created_at,metadata,actor_user_id,profiles:actor_user_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 50));

    if (error) return [];
    return (data ?? []).map((row) => {
      const profile = row.profiles as { full_name?: string | null } | null;
      return {
        id: String(row.id),
        action: String(row.action),
        resourceType: row.resource_type ? String(row.resource_type) : null,
        resourceId: row.resource_id ? String(row.resource_id) : null,
        actor: profile?.full_name || (row.actor_user_id ? "team member" : "anonymous"),
        at: String(row.created_at),
        metadata: (row.metadata ?? {}) as Record<string, unknown>,
      };
    });
  } catch {
    return [];
  }
}

export type HealthItem = { label: string; status: "HEALTHY" | "CONFIGURED" | "AVAILABLE" | "ACTIVE" | "DEGRADED" | "MISSING"; detail: string };

/** Status only — never values, never secret material. */
export async function getSystemHealth(): Promise<HealthItem[]> {
  const items: HealthItem[] = [];
  const supabaseReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

  items.push({
    label: "Environment",
    status: supabaseReady ? "CONFIGURED" : "MISSING",
    detail: supabaseReady
      ? "Supabase URL and publishable key present"
      : "NEXT_PUBLIC_SUPABASE_URL / publishable key missing",
  });

  let dbOk = false;
  try {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
    dbOk = !error;
  } catch {
    dbOk = false;
  }
  items.push({ label: "Database", status: dbOk ? "HEALTHY" : "DEGRADED", detail: dbOk ? "Queries succeeding under RLS" : "Unreachable or unauthorized" });

  const rbac = await count("role_permissions");
  items.push({
    label: "RBAC",
    status: rbac && rbac > 0 ? "ACTIVE" : "MISSING",
    detail: rbac && rbac > 0 ? `${rbac} role-permission grants` : "Authorisation matrix unavailable",
  });

  const audit = await count("audit_logs");
  items.push({
    label: "Audit logging",
    status: audit === null ? "MISSING" : "ACTIVE",
    detail: audit === null ? "Not readable by this account" : `${audit} recorded event(s)`,
  });

  const media = await count("media_assets");
  items.push({
    label: "Storage",
    status: media === null ? "MISSING" : "AVAILABLE",
    detail: media === null ? "Media catalogue not readable" : `Catalogue reachable (${media} asset(s))`,
  });

  return items;
}

export type NotificationRow = { id: string; type: string; title: string; message: string | null; severity: string; isRead: boolean; at: string };

export async function getNotifications(limit = 10): Promise<NotificationRow[]> {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("admin_notifications")
      .select("id,type,title,message,severity,is_read,created_at")
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 50));
    if (error) return [];
    return (data ?? []).map((n) => ({
      id: String(n.id),
      type: String(n.type),
      title: String(n.title),
      message: n.message ? String(n.message) : null,
      severity: String(n.severity),
      isRead: Boolean(n.is_read),
      at: String(n.created_at),
    }));
  } catch {
    return [];
  }
}

export async function unreadCount(): Promise<number> {
  try {
    const supabase = await createSupabaseServer();
    const { count, error } = await supabase
      .from("admin_notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Permission matrix straight from the database. */
export async function getPermissionMatrix() {
  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("role_permissions")
      .select("role_key,resource_key,action_key")
      .order("role_key")
      .order("resource_key")
      .order("action_key");
    if (error) return null;
    return data ?? [];
  } catch {
    return null;
  }
}

export async function canAccess(resource: Resource, action: "view" | "create" | "edit" | "delete" | "publish" | "approve" | "manage" | "export") {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.rpc("can", { p_resource: resource, p_action: action });
  return data === true;
}
