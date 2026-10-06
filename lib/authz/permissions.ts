/**
 * Role/permission definitions.
 *
 * The DATABASE is the source of truth for authorization: enforcement happens in
 * `public.can(resource, action)` against `role_permissions`, and again in RLS.
 * This module exists to (a) generate the seed rows for migration 019 and
 * (b) provide stable labels. It is never used as the only gate: every check in
 * lib/authz/guards.ts asks the database.
 */

export const ROLES = [
  "super_admin",
  "admin",
  "content_manager",
  "product_manager",
  "sales_manager",
  "support_manager",
  "developer",
  "client",
  "editor",
] as const;

export type Role = (typeof ROLES)[number];

export const ACTIONS = ["view", "create", "edit", "delete", "publish", "approve", "manage", "export"] as const;
export type Action = (typeof ACTIONS)[number];

export const RESOURCES = [
  "admin.section",
  "site.content",
  "products",
  "industries",
  "solutions",
  "legal.pages",
  "crm.messages",
  "newsletter",
  "users",
  "roles",
  "settings.security",
  "audit.logs",
  "developer.tools",
  "client.projects",
  // Part 04/05 capabilities, added to role_permissions by migration 024.
  "pages",
  "media",
  "settings",
  "notifications",
  "dashboard",
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  content_manager: "Content Manager",
  product_manager: "Product Manager",
  sales_manager: "Sales Manager",
  support_manager: "Support Manager",
  developer: "Developer",
  client: "Client",
  editor: "Editor",
};

type Grant = Partial<Record<Resource, readonly Action[]>>;

/** Least-privilege defaults. Nothing here implies hierarchy — access is per resource+action. */
export const ROLE_GRANTS: Record<Role, Grant> = {
  super_admin: {
    "admin.section": ["view"],
    "site.content": ["view", "create", "edit", "delete", "publish", "approve", "export"],
    products: ["view", "create", "edit", "delete", "publish", "manage", "export"],
    industries: ["view", "create", "edit", "delete", "publish", "export"],
    solutions: ["view", "create", "edit", "delete", "publish", "export"],
    "legal.pages": ["view", "edit", "publish"],
    "crm.messages": ["view", "create", "edit", "delete", "export"],
    newsletter: ["view", "create", "edit", "export"],
    users: ["view", "create", "edit", "delete", "manage"],
    roles: ["view", "manage"],
    "settings.security": ["view", "manage"],
    "audit.logs": ["view", "export"],
    "developer.tools": ["view", "manage"],
    "client.projects": ["view", "manage"],
  },
  admin: {
    "admin.section": ["view"],
    "site.content": ["view", "create", "edit", "delete", "publish", "approve", "export"],
    products: ["view", "create", "edit", "delete", "publish", "manage", "export"],
    industries: ["view", "create", "edit", "publish"],
    solutions: ["view", "create", "edit", "publish"],
    "legal.pages": ["view"],
    "crm.messages": ["view", "edit", "export"],
    newsletter: ["view", "export"],
    users: ["view", "create", "edit"],
    roles: ["view"],
    "audit.logs": ["view"],
    "client.projects": ["view"],
  },
  content_manager: {
    "admin.section": ["view"],
    "site.content": ["view", "create", "edit", "publish"],
    industries: ["view", "edit"],
    solutions: ["view", "edit"],
    products: ["view"],
    "legal.pages": ["view"],
  },
  product_manager: {
    "admin.section": ["view"],
    products: ["view", "create", "edit", "delete", "publish", "export"],
    industries: ["view", "create", "edit"],
    solutions: ["view", "create", "edit"],
    "site.content": ["view"],
  },
  sales_manager: {
    "admin.section": ["view"],
    "crm.messages": ["view", "create", "edit", "export"],
    newsletter: ["view", "export"],
    products: ["view"],
    solutions: ["view"],
    industries: ["view"],
  },
  support_manager: {
    "admin.section": ["view"],
    "crm.messages": ["view", "create", "edit"],
    newsletter: ["view"],
    "client.projects": ["view"],
  },
  developer: {
    "developer.tools": ["view"],
  },
  client: {
    "client.projects": ["view", "create"],
  },
  editor: {
    "admin.section": ["view"],
    "site.content": ["view", "create", "edit", "publish"],
  },
};

/**
 * Admin-only surfaces must never be reachable through hierarchy alone.
 * These resources are never implied by holding any other permission.
 */
export const PRIVILEGED_RESOURCES: Resource[] = ["users", "roles", "settings.security", "audit.logs"];

export function grantRows(): { role: Role; resource: Resource; action: Action }[] {
  const rows: { role: Role; resource: Resource; action: Action }[] = [];
  for (const [role, grants] of Object.entries(ROLE_GRANTS) as [Role, Grant][]) {
    for (const [resource, actions] of Object.entries(grants) as [Resource, readonly Action[]][]) {
      for (const action of actions ?? []) rows.push({ role, resource, action });
    }
  }
  return rows;
}
