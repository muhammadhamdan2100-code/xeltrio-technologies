-- ============================================================================
-- PART 04 — MIGRATION 020 : system_settings + admin_notifications
--
-- Adds the settings model and admin notification store. Both are authorized by
-- the EXISTING RBAC engine (public.can()) so no parallel permission system is
-- introduced. Nothing existing is modified or dropped.
--
-- Secret policy: system_settings holds only safe application configuration.
-- Values marked is_public = false are never returned by the public reader, and
-- credentials/tokens belong in environment variables, not in this table.
-- ============================================================================

create table if not exists public.system_settings (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique check (key ~ '^[a-z][a-z0-9_.]{1,80}$'),
  value       jsonb not null default '""'::jsonb,
  type        text not null default 'string' check (type in ('string','text','number','boolean','json','url','email','phone','color','date')),
  category    text not null check (category in ('company','contact','branding','social','email','notifications','seo','system')),
  description text,
  is_public   boolean not null default false,
  updated_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists system_settings_category_idx on public.system_settings (category, key);
create index if not exists system_settings_public_idx   on public.system_settings (is_public) where is_public;

comment on table public.system_settings is
  'Safe application configuration only. Secrets belong in environment variables. is_public=false rows are never returned by public_settings().';

create table if not exists public.admin_notifications (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type ~ '^[a-z][a-z0-9_]{2,60}$'),
  title       text not null,
  message     text,
  severity    text not null default 'info' check (severity in ('info','success','warning','critical')),
  is_read     boolean not null default false,
  read_at     timestamptz,
  target_role text references public.roles (key) on delete set null,
  target_user uuid references public.profiles (id) on delete cascade,
  resource_type text,
  resource_id   text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists admin_notifications_created_idx on public.admin_notifications (created_at desc);
create index if not exists admin_notifications_unread_idx  on public.admin_notifications (is_read, created_at desc) where is_read = false;
create index if not exists admin_notifications_target_idx  on public.admin_notifications (target_role, target_user);

comment on table public.admin_notifications is
  'Admin notification feed. Written by server-side flows and triggers; never fabricated.';

-- ---------------------------------------------------------------------------
-- updated_at maintenance: reuse the existing set_updated_at() (no duplicate fn)
-- ---------------------------------------------------------------------------
drop trigger if exists set_system_settings_updated_at on public.system_settings;
create trigger set_system_settings_updated_at
  before update on public.system_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger context guard: row-level security cannot see the writer's intent for
-- system columns, so stamp audit columns in a BEFORE trigger.
-- ---------------------------------------------------------------------------
create or replace function public.stamp_settings_audit_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  new.updated_by := auth.uid();
  return new;
end;
$$;

revoke all on function public.stamp_settings_audit_columns() from public;

drop trigger if exists system_settings_stamp_updated_by on public.system_settings;
create trigger system_settings_stamp_updated_by
  before insert or update on public.system_settings
  for each row execute function public.stamp_settings_audit_columns();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.system_settings enable row level security;
alter table public.admin_notifications enable row level security;

-- Public site may read ONLY explicitly public settings, and only published-safe
-- columns (enforced by the function below, not by column grants).
drop policy if exists settings_select_public on "public"."system_settings";
create policy settings_select_public on "public"."system_settings"
  for select to anon, authenticated
  using (is_public = true);

drop policy if exists settings_select_privileged on "public"."system_settings";
create policy settings_select_privileged on "public"."system_settings"
  for select to authenticated
  using (public.can('settings','view'));

drop policy if exists settings_write_authorized on "public"."system_settings";
create policy settings_write_authorized on "public"."system_settings"
  for update to authenticated
  using (public.can('settings','edit'))
  with check (public.can('settings','edit'));

drop policy if exists settings_insert_authorized on "public"."system_settings";
create policy settings_insert_authorized on "public"."system_settings"
  for insert to authenticated
  with check (public.can('settings','manage'));

drop policy if exists settings_delete_authorized on "public"."system_settings";
create policy settings_delete_authorized on "public"."system_settings"
  for delete to authenticated
  using (public.can('settings','manage'));

drop policy if exists notifications_select_authorized on "public"."admin_notifications";
create policy notifications_select_authorized on "public"."admin_notifications"
  for select to authenticated
  using (
    (target_user is not null and target_user = auth.uid())
    or (target_user is null and (target_role is null or target_role = public.session_user_role()::text))
    or public.can('notifications','manage')
  );

drop policy if exists notifications_update_own_read on "public"."admin_notifications";
create policy notifications_update_own_read on "public"."admin_notifications"
  for update to authenticated
  using (target_user = auth.uid())
  with check (target_user = auth.uid() and is_read = true);

-- Notifications are raised by server-side flows running as an authorized
-- principal, or by SECURITY DEFINER triggers (which bypass RLS by design).
drop policy if exists notifications_insert_authorized on "public"."admin_notifications";
create policy notifications_insert_authorized on "public"."admin_notifications"
  for insert to authenticated
  with check (public.can('notifications','manage'));

-- ---------------------------------------------------------------------------
-- Readers
-- ---------------------------------------------------------------------------
create or replace function public.settings_is_configured()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select to_regclass('public.system_settings') is not null;
$$;

create or replace function public.public_settings()
returns table (key text, value jsonb, type text, category text)
language sql
stable
security definer
set search_path to 'public'
as $$
  -- SECURITY DEFINER + explicit is_public filter: non-public rows can never be
  -- enumerated by an anonymous caller even if a policy were later relaxed.
  select s.key, s.value, s.type, s.category
  from public.system_settings s
  where s.is_public = true
  order by s.category, s.key;
$$;

revoke all on function public.public_settings() from public;
grant execute on function public.public_settings() to anon, authenticated;

create or replace function public.admin_settings()
returns table (key text, value jsonb, type text, category text, description text,
               is_public boolean, updated_by uuid, updated_at timestamptz)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not public.can('settings','view') then
    raise exception 'settings access requires authorization' using errcode = '42501';
  end if;
  return query
  select s.key, s.value, s.type, s.category, s.description, s.is_public, s.updated_by, s.updated_at
  from public.system_settings s
  order by s.category, s.key;
end;
$$;

revoke all on function public.admin_settings() from public;
grant execute on function public.admin_settings() to authenticated;

comment on function public.admin_settings() is
  'Full settings reader including private values. Requires settings:view; raises 42501 otherwise. Never expose to anon.';

-- ---------------------------------------------------------------------------
-- Seed: only structural defaults for settings that already have a real value in
-- the project today. No invented business/legal/contact data.
-- ---------------------------------------------------------------------------
insert into public.system_settings (key, value, type, category, description, is_public) values
  ('company.display_name',    '"Xeltrio Technologies"'::jsonb, 'string', 'company',   'Brand name used in admin and metadata', true),
  ('seo.default_suffix',      '"Xeltrio Technologies"'::jsonb, 'string', 'seo',       'Appended to page titles', true),
  ('seo.indexable',           'true'::jsonb,                                       'boolean','seo',       'Whether robots should allow indexing', true),
  ('notifications.enabled',   'true'::jsonb,                                       'boolean','notifications','Master switch for admin notifications', false)
on conflict (key) do nothing;

-- ============================================================================
-- VERIFICATION
--   select count(*) from public.system_settings;                     -- 4
--   select key, is_public from public.system_settings order by key;
--   select policyname, cmd, roles from pg_policies where tablename in
--     ('system_settings','admin_notifications') order by 1,2;
--   select public.can('settings','view');      -- as anon -> false
-- ROLLBACK
--   drop trigger if exists system_settings_stamp_updated_by on public.system_settings;
--   drop function if exists public.admin_settings(); drop function if exists public.public_settings();
--   drop function if exists public.settings_is_configured();
--   drop function if exists public.stamp_settings_audit_columns() cascade;
--   drop table if exists public.admin_notifications; drop table if exists public.system_settings;
-- ============================================================================
