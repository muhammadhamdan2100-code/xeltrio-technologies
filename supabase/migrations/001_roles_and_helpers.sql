-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
-- Shared enums, helper functions/triggers, and the profiles/roles table
-- that every other table's RLS policies depend on.

create type public.user_role as enum ('super_admin', 'admin', 'editor', 'content_manager', 'staff');
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.employment_type as enum ('full_time', 'part_time', 'contract', 'internship');
create type public.job_status as enum ('open', 'closed', 'draft');
create type public.message_status as enum ('new', 'read', 'responded', 'archived');

-- updated_at auto-touch trigger, reused by every content table
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles: one row per auth.users row, carrying the role used by every
-- RLS policy below. A profile is created automatically on signup.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.user_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user is created.
-- New users default to 'staff' — promote to admin/editor manually via SQL.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'staff');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by every other table's RLS policies: true if the current
-- JWT belongs to a profile with edit rights (anything above plain 'staff').
create or replace function public.is_staff_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('super_admin', 'admin', 'editor', 'content_manager')
     from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('super_admin', 'admin') from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Profiles RLS: people can read their own profile; admins can read/manage everyone's.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());
