-- ============================================================================
-- XELTRIO — MIGRATION 017 : RBAC roles + permissions (additive)
--
-- - extends the existing `user_role` enum with the 5 missing roles
--   (super_admin, admin, editor, content_manager, staff all stay: `editor` is
--   preserved, nothing is renamed or removed)
-- - adds `roles`, `permissions`, `role_permissions` and `public.can()`
-- - `role_permissions` becomes the authoritative authorization matrix;
--   lib/authz/permissions.ts only seeds it
-- - NO hierarchy is implied: access is explicitly granted per resource+action
--
-- Enum note: ALTER TYPE ... ADD VALUE is allowed inside a transaction block on
-- PG 12+, but the new values cannot be *used* until commit. `roles.key` is
-- therefore plain TEXT (not the enum), so nothing in this migration reads a
-- freshly added value.
--
-- Rollback: see the bottom of this file.
-- ============================================================================

alter type public.user_role add value if not exists 'product_manager';
alter type public.user_role add value if not exists 'sales_manager';
alter type public.user_role add value if not exists 'support_manager';
alter type public.user_role add value if not exists 'developer';
alter type public.user_role add value if not exists 'client';

create table if not exists public.roles (
  key        text primary key check (key ~ '^[a-z_]{2,40}$'),
  label      text not null,
  is_root    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  resource_key text not null check (resource_key ~ '^[a-z_.]{2,60}$'),
  action_key   text not null check (action_key in ('view','create','edit','delete','publish','approve','manage','export')),
  created_at   timestamptz not null default now(),
  primary key (resource_key, action_key)
);

create table if not exists public.role_permissions (
  role_key     text not null references public.roles(key) on delete cascade,
  resource_key text not null,
  action_key   text not null,
  created_at   timestamptz not null default now(),
  primary key (role_key, resource_key, action_key),
  foreign key (resource_key, action_key) references public.permissions(resource_key, action_key) on delete cascade
);

create index if not exists role_permissions_role_key_idx on public.role_permissions (role_key);
create index if not exists role_permissions_resource_key_idx on public.role_permissions (resource_key, action_key);

-- ---------------------------------------------------------------------------
-- Seed: roles catalogue (superset of the enum: editor retained)
-- ---------------------------------------------------------------------------
insert into public.roles (key, label, is_root) values
  ('super_admin',     'Super Admin',     true),
  ('admin',           'Admin',           false),
  ('content_manager', 'Content Manager', false),
  ('product_manager', 'Product Manager', false),
  ('sales_manager',   'Sales Manager',   false),
  ('support_manager', 'Support Manager', false),
  ('developer',       'Developer',       false),
  ('client',          'Client',          false),
  ('editor',          'Editor',          false)
on conflict (key) do update set label = excluded.label, is_root = excluded.is_root;

-- ---------------------------------------------------------------------------
-- Seed: permission grants (least privilege, explicit per resource)
-- ---------------------------------------------------------------------------
insert into public.role_permissions (role_key, resource_key, action_key)
select 'super_admin', split_part(pair, '|', 1), action
from (values
  ('admin.section|view'),
  ('site.content|view,create,edit,delete,publish,approve,export'),
  ('products|view,create,edit,delete,publish,manage,export'),
  ('industries|view,create,edit,delete,publish,export'),
  ('solutions|view,create,edit,delete,publish,export'),
  ('legal.pages|view,edit,publish'),
  ('crm.messages|view,create,edit,delete,export'),
  ('newsletter|view,create,edit,export'),
  ('users|view,create,edit,delete,manage'),
  ('roles|view,manage'),
  ('settings.security|view,manage'),
  ('audit.logs|view,export'),
  ('developer.tools|view,manage'),
  ('client.projects|view,manage')
) as v(pair)
cross join lateral unnest(string_to_array(split_part(pair, '|', 2), ',')) as action
on conflict do nothing;

insert into public.role_permissions (role_key, resource_key, action_key)
select 'admin', split_part(pair, '|', 1), action
from (values
  ('admin.section|view'),
  ('site.content|view,create,edit,delete,publish,approve,export'),
  ('products|view,create,edit,delete,publish,manage,export'),
  ('industries|view,create,edit,publish'),
  ('solutions|view,create,edit,publish'),
  ('legal.pages|view'),
  ('crm.messages|view,edit,export'),
  ('newsletter|view,export'),
  ('users|view,create,edit'),
  ('roles|view'),
  ('audit.logs|view'),
  ('client.projects|view')
) as v(pair)
cross join lateral unnest(string_to_array(split_part(pair, '|', 2), ',')) as action
on conflict do nothing;

insert into public.role_permissions (role_key, resource_key, action_key)
select 'content_manager', split_part(pair, '|', 1), action
from (values
  ('admin.section|view'),
  ('site.content|view,create,edit,publish'),
  ('industries|view,edit'),
  ('solutions|view,edit'),
  ('products|view'),
  ('legal.pages|view')
) as v(pair)
cross join lateral unnest(string_to_array(split_part(pair, '|', 2), ',')) as action
on conflict do nothing;

insert into public.role_permissions (role_key, resource_key, action_key)
select 'product_manager', split_part(pair, '|', 1), action
from (values
  ('admin.section|view'),
  ('products|view,create,edit,delete,publish,export'),
  ('industries|view,create,edit'),
  ('solutions|view,create,edit'),
  ('site.content|view')
) as v(pair)
cross join lateral unnest(string_to_array(split_part(pair, '|', 2), ',')) as action
on conflict do nothing;

insert into public.role_permissions (role_key, resource_key, action_key)
select 'sales_manager', split_part(pair, '|', 1), action
from (values
  ('admin.section|view'),
  ('crm.messages|view,create,edit,export'),
  ('newsletter|view,export'),
  ('products|view'),
  ('solutions|view'),
  ('industries|view')
) as v(pair)
cross join lateral unnest(string_to_array(split_part(pair, '|', 2), ',')) as action
on conflict do nothing;

insert into public.role_permissions (role_key, resource_key, action_key)
select 'support_manager', split_part(pair, '|', 1), action
from (values
  ('admin.section|view'),
  ('crm.messages|view,create,edit'),
  ('newsletter|view'),
  ('client.projects|view')
) as v(pair)
cross join lateral unnest(string_to_array(split_part(pair, '|', 2), ',')) as action
on conflict do nothing;

-- developer and client hold NO administrative grant: developer.tools is granted
-- to nothing by default, so a developer profile reaches /admin but sees no area
-- until a super admin explicitly grants one.
insert into public.role_permissions (role_key, resource_key, action_key)
select 'editor', split_part(pair, '|', 1), action
from (values
  ('admin.section|view'),
  ('site.content|view,create,edit,publish')
) as v(pair)
cross join lateral unnest(string_to_array(split_part(pair, '|', 2), ',')) as action
on conflict do nothing;

-- Catalogue of every permission actually referenced.
insert into public.permissions (resource_key, action_key)
select distinct resource_key, action_key from public.role_permissions
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- can(): authoritative, database-side permission check.
-- SECURITY DEFINER + pinned search_path, same pattern as the existing
-- is_admin()/is_staff_editor(), and it reads profiles as the owner so it does
-- not re-enter RLS (no recursion).
-- ---------------------------------------------------------------------------
create or replace function public.can(p_resource text, p_action text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.role_permissions rp
    join public.profiles pr on pr.role::text = rp.role_key
    where pr.id = auth.uid()
      and rp.resource_key = p_resource
      and rp.action_key = p_action
  );
$$;

revoke all on function public.can(text, text) from public;
grant execute on function public.can(text, text) to anon, authenticated;

comment on function public.can(text, text) is
  'Authoritative permission check for the current session: role_permissions joined to profiles.role. Returns false when unauthenticated.';

-- ---------------------------------------------------------------------------
-- RLS: catalogue metadata is readable by signed-in staff, writable by nobody
-- through the API (no insert/update/delete policy exists, so only the service
-- role or a migration can change the authorization matrix).
-- ---------------------------------------------------------------------------
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

drop policy if exists "roles_select_authenticated" on "public"."roles";
create policy "roles_select_authenticated" on "public"."roles"
  for select to authenticated using (public.is_staff_editor());

drop policy if exists "permissions_select_authenticated" on "public"."permissions";
create policy "permissions_select_authenticated" on "public"."permissions"
  for select to authenticated using (public.is_staff_editor());

drop policy if exists "role_permissions_select_authenticated" on "public"."role_permissions";
create policy "role_permissions_select_authenticated" on "public"."role_permissions"
  for select to authenticated using (public.is_staff_editor());

-- ============================================================================
-- VERIFICATION
--   select count(*) from public.roles;                                   -- 9
--   select count(*) from public.permissions;                             -- 51
--   select count(*) from public.role_permissions;                        -- 58
--   select role_key, count(*) from public.role_permissions group by 1 order by 1;
--   select enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid
--     where t.typname='user_role' order by enumsortorder;                -- 10 values
--   -- as an admin session: select public.can('users','view');   -> true
--   -- as a content_manager session: select public.can('users','manage'); -> false
--   -- as anon: select public.can('products','delete'); -> false
-- ============================================================================
-- ROLLBACK
--   drop function if exists public.can(text,text);
--   drop table if exists public.role_permissions;
--   drop table if exists public.permissions;
--   drop table if exists public.roles;
--   -- enum values cannot be removed while rows may reference them; leaving the
--   -- 5 added values in place is harmless (no row uses them).
-- ============================================================================
