-- ============================================================================
-- XELTRIO — MIGRATION 018 : profile account fields + session read functions
--
-- Adds the profile fields Part 03 §6 requires (avatar, status, metadata) and
-- the two SECURITY DEFINER readers used by the app, without touching the
-- existing columns, the stray "xeltrio technologies Org" column, any row value,
-- or migration 016's role-escalation guard.
--
-- status/privileged metadata stay admin-writable only.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_account_status' and typnamespace = 'public'::regnamespace) then
    create type public.user_account_status as enum ('active','pending_verification','suspended','archived');
  end if;
end $$;

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists status public.user_account_status not null default 'active',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.profiles.status is
  'Account state. Admin/service-role only: guarded by profiles_guard_account_fields; never accepted from a client form.';
comment on column public.profiles.metadata is
  'Non-secret account metadata. Admin/service-role only. Never stores credentials or tokens.';

-- ---------------------------------------------------------------------------
-- Guard: a normal user may edit their own name/avatar but not status/metadata.
-- Independent trigger (016 keeps guarding `role`); additive, no conflict.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profiles_account_fields()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  actor_role public.user_role;
begin
  if new.status is distinct from old.status or new.metadata is distinct from old.metadata then

    if auth.uid() is null then
      return new;  -- service role / migration / owner console
    end if;

    select role into actor_role from public.profiles where id = auth.uid();

    if actor_role is null or actor_role not in ('super_admin', 'admin') then
      raise exception 'account status and metadata require administrator privileges'
        using errcode = '42501';
    end if;

  end if;

  -- an admin editing someone else must not be able to blank their id
  if new.id is distinct from old.id then
    raise exception 'profile id is immutable' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_profiles_account_fields() from public;
grant execute on function public.guard_profiles_account_fields() to authenticated;

drop trigger if exists "profiles_guard_account_fields" on "public"."profiles";
create trigger "profiles_guard_account_fields"
  before update on "public"."profiles"
  for each row execute function public.guard_profiles_account_fields();

-- ---------------------------------------------------------------------------
-- session_profile(): the caller's own profile plus its auth email.
-- A function is used because anon/authenticated cannot select from auth.users.
-- ---------------------------------------------------------------------------
create or replace function public.session_profile()
returns table (
  id uuid,
  email text,
  full_name text,
  role public.user_role,
  status public.user_account_status,
  avatar_url text,
  metadata jsonb
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select p.id, u.email, p.full_name, p.role, p.status, p.avatar_url, p.metadata
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = auth.uid();
$$;

revoke all on function public.session_profile() from public;
grant execute on function public.session_profile() to authenticated;

-- ---------------------------------------------------------------------------
-- admin_profiles(): roster for administrators; refuses non-admins itself, so it
-- is safe even if a future policy forgets to gate it.
-- ---------------------------------------------------------------------------
create or replace function public.admin_profiles()
returns table (
  id uuid,
  email text,
  full_name text,
  role public.user_role,
  status public.user_account_status,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'administrator privileges required' using errcode = '42501';
  end if;

  return query
  select p.id, u.email, p.full_name, p.role, p.status, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  order by p.created_at desc;
end;
$$;

revoke all on function public.admin_profiles() from public;
grant execute on function public.admin_profiles() to authenticated;

comment on function public.admin_profiles() is
  'Administrator-only roster. Raises 42501 unless is_admin() is true; never exposed to anon.';

-- ============================================================================
-- VERIFICATION
--   select column_name, data_type from information_schema.columns
--     where table_schema='public' and table_name='profiles' order by ordinal_position;
--   select tgname from pg_trigger where tgrelid='public.profiles'::regclass and not tgisinternal;
--     -- profiles_guard_privileges (016), profiles_guard_account_fields (018), set_profiles_updated_at
--   select role, status, count(*) from public.profiles group by 1,2;  -- unchanged rows, status=active
-- ============================================================================
-- ROLLBACK
--   drop trigger if exists profiles_guard_account_fields on public.profiles;
--   drop function if exists public.guard_profiles_account_fields();
--   drop function if exists public.admin_profiles();
--   drop function if exists public.session_profile();
--   alter table public.profiles drop column if exists metadata;
--   alter table public.profiles drop column if exists status;
--   alter table public.profiles drop column if exists avatar_url;
--   drop type if exists public.user_account_status;
-- ============================================================================
