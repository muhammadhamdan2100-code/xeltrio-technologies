-- ============================================================================
-- XELTRIO TECHNOLOGIES — MIGRATION 016
-- profiles role-escalation guard (database-enforced privilege protection)
--
-- Part 03 §14 PROFILE SECURITY / §15 SUPER ADMIN PROTECTION / §12 DATABASE RBAC
--
-- WHY: verified live against project yparzhgzhpwewyrjhqud on 2026-10-05
-- (docs/_audit_p03/live-catalog-inspection.md §6). The existing single policy
--
--   profiles_update  FOR UPDATE  TO public
--     USING      (auth.uid() = id OR is_admin())
--     WITH CHECK (auth.uid() = id OR is_admin())
--
-- lets ANY authenticated user change the `role` column on their own row,
-- because WITH CHECK only re-tests row ownership and `id` never changes.
-- A user can therefore self-promote to 'super_admin'. UI hiding does not
-- mitigate this; enforcement must live in the database.
--
-- WHAT IT DOES  (additive; no data touched; no table/column dropped)
--   1. adds session_user_role()          — pinned search_path, STABLE, DEFINER
--   2. replaces profiles_update with
--        profiles_update_self            — owner may edit own row, role immutable
--        profiles_update_admin           — admins may edit any row, incl. roles
--   3. adds guard_profiles_privileges() trigger — role changes require admin;
--      assigning/removing super_admin requires an existing super_admin
--
-- WHAT IT DOES NOT DO
--   - no change to profiles SELECT / INSERT / DELETE policies
--   - no change to is_admin(), is_staff_editor(), handle_new_user(), set_updated_at()
--   - no change to the user_role enum, no role value rewritten, no row updated
--   - does NOT drop the stray "xeltrio technologies Org" column (separate owner decision)
--
-- SAFE TO APPLY? Existing rows are unaffected: the trigger fires on UPDATE only,
-- and the two current profiles (staff=1, admin=1) keep their roles.
--
-- ROLLBACK: see the commented block at the bottom of this file.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. caller's role, readable from policies without RLS recursion
--    SECURITY DEFINER owned by the table owner → the inner read bypasses
--    profiles RLS by design (same pattern already used by is_admin()).
-- ---------------------------------------------------------------------------
create or replace function public.session_user_role()
returns public.user_role
language sql
stable
security definer
set search_path to 'public'
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.session_user_role() from public;
grant execute on function public.session_user_role() to anon, authenticated;

comment on function public.session_user_role() is
  'Returns the user_role of the authenticated user (NULL when unauthenticated). '
  'Used by profiles RLS so a self-update cannot alter its own role.';

-- ---------------------------------------------------------------------------
-- 2. split the single permissive UPDATE policy into two scoped policies
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_update" on "public"."profiles";

-- Owner may update their own profile, but the role must be unchanged.
-- session_user_role() reads the pre-update snapshot, so new.role must equal
-- the role the caller already has.
create policy "profiles_update_self"
  on "public"."profiles"
  for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role is not distinct from public.session_user_role()
  );

-- Admins may update any profile, including role assignments.
create policy "profiles_update_admin"
  on "public"."profiles"
  for update
  to authenticated
  using (public.is_admin())
  with check (true);

-- ---------------------------------------------------------------------------
-- 3. defense in depth: reject privilege changes below admin, and protect
--    super_admin specifically (admin must not promote itself to super_admin,
--    and admin must not strip the last super_admin).
--    auth.uid() IS NULL → service_role, migrations and the dashboard owner,
--    which are the intended controlled provisioning paths.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profiles_privileges()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  actor_role public.user_role;
begin
  if new.role is distinct from old.role then

    if auth.uid() is null then
      return new;  -- service role / migration / owner console
    end if;

    select role into actor_role from public.profiles where id = auth.uid();

    if actor_role is null or actor_role not in ('super_admin', 'admin') then
      raise exception 'role changes require administrator privileges'
        using errcode = '42501';
    end if;

    if 'super_admin' in (old.role, new.role) and actor_role is distinct from 'super_admin' then
      raise exception 'only a super admin may grant or revoke the super_admin role'
        using errcode = '42501';
    end if;

  end if;

  return new;
end;
$$;

revoke all on function public.guard_profiles_privileges() from public;
grant execute on function public.guard_profiles_privileges() to authenticated;

comment on function public.guard_profiles_privileges() is
  'BEFORE UPDATE guard on profiles: enforces administrator-only role changes '
  'and super_admin-only super_admin assignments. Independent of RLS policies.';

drop trigger if exists "profiles_guard_privileges" on "public"."profiles";

create trigger "profiles_guard_privileges"
  before update on "public"."profiles"
  for each row
  execute function public.guard_profiles_privileges();

commit;

-- ============================================================================
-- VERIFICATION AFTER APPLY (all read-only)
--
-- -- 1. policies are now the two scoped ones (expect profiles_update gone)
-- select policyname, cmd, roles, qual, with_check
-- from pg_policies where schemaname = 'public' and tablename = 'profiles'
-- order by cmd;
--
-- -- 2. trigger is enabled
-- select tgname, tgenabled from pg_trigger
-- where tgrelid = 'public.profiles'::regclass and not tgisinternal;
--
-- -- 3. functions pin search_path and are marked correctly
-- select p.proname, p.prosecdef, p.provolatile,
--        array_to_string(p.proconfig, ',') as search_path_setting
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname in ('session_user_role','guard_profiles_privileges','is_admin','is_staff_editor')
-- order by p.proname;
--
-- -- 4. existing data untouched (expect roles still staff=1, admin=1)
-- select role, count(*) from public.profiles group by role order by role;
--
-- SECURITY TESTS — must FAIL for the attacker, using an authenticated (non-admin) session:
--   update public.profiles set role = 'super_admin' where id = auth.uid();
--     → expected 42501 (policy violation), not silent success
--   update public.profiles set role = 'content_manager' where id = auth.uid();
--     → expected 42501  (also blocked by the trigger)
--   update public.profiles set full_name = 'New Name' where id = auth.uid();
--     → expected SUCCESS (own non-privileged fields remain editable)
--   admin session: update public.profiles set role = 'editor' where id = '<other user id>';
--     → expected SUCCESS
--   admin session: update public.profiles set role = 'super_admin' where id = auth.uid();
--     → expected 42501 unless that admin is itself super_admin
-- ============================================================================

-- ============================================================================
-- ROLLBACK (restore the exact pre-016 state; documented, not executed)
--
-- begin;
-- drop trigger  if exists "profiles_guard_privileges" on "public"."profiles";
-- drop function if exists public.guard_profiles_privileges();
-- drop policy   if exists "profiles_update_self"  on "public"."profiles";
-- drop policy   if exists "profiles_update_admin" on "public"."profiles";
--
-- create policy "profiles_update"
--   on "public"."profiles"
--   for update
--   to public
--   using  (auth.uid() = id or public.is_admin())
--   with check (auth.uid() = id or public.is_admin());
--
-- revoke all on function public.session_user_role() from anon, authenticated;
-- drop function if exists public.session_user_role();
-- commit;
--
-- NOTE: rolling back re-opens the privilege-escalation hole. Roll back only to
-- restore a known state during an incident, then re-apply.
-- ============================================================================
