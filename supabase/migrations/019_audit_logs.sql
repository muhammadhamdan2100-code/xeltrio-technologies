-- ============================================================================
-- XELTRIO — MIGRATION 019 : audit_logs (append-only) + privileged-change capture
--
-- RLS grants INSERT (anon + authenticated, self-or-null actor) and SELECT
-- (administrators only). NO UPDATE or DELETE policy exists, so with RLS on,
-- normal roles can neither rewrite nor erase history — only the service role or
-- a migration can, which is the intended append-only guarantee.
--
-- Never stores passwords, access/refresh tokens, reset codes or secrets.
-- ============================================================================

create table if not exists public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles (id) on delete set null,
  action        text not null check (action ~ '^[a-z][a-z_]{2,60}$'),
  resource_type text,
  resource_id   text,
  ip_address    text,
  user_agent    text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx      on public.audit_logs (actor_user_id, created_at desc);
create index if not exists audit_logs_action_idx     on public.audit_logs (action, created_at desc);
create index if not exists audit_logs_resource_idx   on public.audit_logs (resource_type, resource_id);

alter table public.audit_logs enable row level security;

-- Anyone (including an anonymous visitor whose sign-in attempt failed) may
-- append an event, but only about themselves or with no actor.
drop policy if exists "audit_logs_insert_public" on "public"."audit_logs";
create policy "audit_logs_insert_public" on "public"."audit_logs"
  for insert to anon, authenticated
  with check (actor_user_id is null or actor_user_id = auth.uid());

-- Administrators may read; nobody may update or delete (no such policy exists).
drop policy if exists "audit_logs_select_admin" on "public"."audit_logs";
create policy "audit_logs_select_admin" on "public"."audit_logs"
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Record role changes in the trail. Runs as owner so the write succeeds even
-- when the actor's own INSERT policy would not cover another user's id.
-- ---------------------------------------------------------------------------
create or replace function public.audit_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.role is distinct from old.role then
    insert into public.audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
    values (
      auth.uid(),
      'role_change',
      'profiles',
      new.id::text,
      jsonb_build_object('from_role', old.role::text, 'to_role', new.role::text)
    );
  end if;
  if new.status is distinct from old.status then
    insert into public.audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
    values (
      auth.uid(),
      'account_status_change',
      'profiles',
      new.id::text,
      jsonb_build_object('from', old.status::text, 'to', new.status::text)
    );
  end if;
  return new;
end;
$$;

revoke all on function public.audit_profile_role_change() from public;

drop trigger if exists "profiles_audit_privileged_change" on "public"."profiles";
create trigger "profiles_audit_privileged_change"
  after update on "public"."profiles"
  for each row execute function public.audit_profile_role_change();

-- New profiles are provisioned by handle_new_user() / admins; record them.
create or replace function public.audit_profile_created()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
  values (auth.uid(), 'profile_created', 'profiles', new.id::text, jsonb_build_object('role', new.role::text));
  return new;
end;
$$;

revoke all on function public.audit_profile_created() from public;

drop trigger if exists "profiles_audit_created" on "public"."profiles";
create trigger "profiles_audit_created"
  after insert on "public"."profiles"
  for each row execute function public.audit_profile_created();

comment on table public.audit_logs is
  'Append-only security/administrative trail. No update or delete policy exists for normal roles.';

-- ============================================================================
-- VERIFICATION
--   select policyname, cmd, roles from pg_policies where tablename='audit_logs';
--     -- exactly 2: INSERT (anon,authenticated) and SELECT (authenticated)
--   select tgname from pg_trigger where tgrelid='public.profiles'::regclass and not tgisinternal;
--   select action, count(*) from public.audit_logs group by 1;   -- empty until someone signs in
--   -- as authenticated non-admin: update public.audit_logs set action='x'; -> 42501
--   -- as authenticated non-admin: delete from public.audit_logs;          -> 42501
-- ============================================================================
-- ROLLBACK
--   drop trigger if exists profiles_audit_created on public.profiles;
--   drop trigger if exists profiles_audit_privileged_change on public.profiles;
--   drop function if exists public.audit_profile_created();
--   drop function if exists public.audit_profile_role_change();
--   drop table if exists public.audit_logs;
-- ============================================================================
