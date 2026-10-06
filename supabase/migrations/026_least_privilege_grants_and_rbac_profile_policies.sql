-- ============================================================================
-- PART 04 — MIGRATION 026 : LEAST-PRIVILEGE TABLE GRANTS + RBAC-BACKED
--                  PROFILE WRITE/DELETE POLICIES
--
-- Found by execution during Part 04/05 acceptance, not by inspection:
--
--  1. `anon` and `authenticated` hold TRUNCATE, TRIGGER and REFERENCES on every
--     table in public (36 tables each). TRUNCATE is not governed by row-level
--     security — a role that holds it can empty a table regardless of any
--     policy. It is not reachable through PostgREST (no HTTP verb for it), so
--     this is defense-in-depth rather than an exploitable remote hole, but an
--     audit trail whose rows can be TRUNCATEd by the anonymous role is not
--     append-only in the strongest sense the Part 03/04 briefs require.
--
--  2. `audit_logs` additionally carries UPDATE and DELETE table grants for
--     anon/authenticated. No RLS policy permits those commands, so both are
--     already blocked at row level (verified: 0 rows affected). Revoking them
--     makes append-only true at the privilege layer too, so a future policy
--     mistake cannot silently turn it over.
--
--  3. `profiles_admin_delete` used USING (is_admin()) and
--     `profiles_update_admin` used WITH CHECK (true). Both predate Part 04.
--     They are re-expressed through the authoritative RBAC check can(), so the
--     database — not only the server action — decides the privilege:
--       * delete a profile            -> users:delete (super_admin only)
--       * write another user's profile-> users:edit    (admin, super_admin)
--
-- WHAT THIS DOES NOT DO
--   * no SELECT/INSERT/UPDATE/DELETE is revoked from authenticated anywhere
--     except audit_logs — application writes rely on those table privileges.
--   * service_role privileges are untouched (it bypasses RLS by design).
--   * no data is read, rewritten or deleted.
--   * migrations 016–019 protections are kept, and 016's guard triggers remain
--     the escalation backstop for the admin-writable path.
--
-- IDEMPOTENT: revoke / drop-policy-if-exists / create-policy are all repeatable.
-- ============================================================================

begin;

-- 1. Remove non-runtime privileges from the two web-facing roles, and stop
--    them being granted to tables created later by the owner role.
revoke truncate, trigger, references on all tables in schema public from anon, authenticated;

alter default privileges in schema public
  revoke truncate, trigger, references on tables from anon, authenticated;

-- 2. audit_logs: append-only at the privilege layer as well as the policy layer.
revoke update, delete, truncate on public.audit_logs from anon, authenticated;

-- 3. profile write/delete policies now consult RBAC.
drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete"
  on public.profiles for delete
  to authenticated
  using ( public.can('users', 'delete') );

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using ( public.is_admin() )
  with check ( public.can('users', 'edit') );

-- 4. The 016 privilege guard is kept and made strictly stronger, not weaker.
--    Before: a role change needed the actor to be admin or super_admin.
--    Now:    a role change additionally needs the RBAC permission roles:manage
--            (super_admin only), so the legality of a role change is decided by
--            role_permissions in the database instead of by the admin screen.
--    Every pre-existing check is preserved, including the super_admin
--    grant/revoke restriction and the unattended (auth.uid() is null) path.
create or replace function public.guard_profiles_privileges()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $
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

    if not public.can('roles', 'manage') then
      raise exception 'role changes require the roles:manage permission'
        using errcode = '42501';
    end if;

    if 'super_admin' in (old.role, new.role) and actor_role is distinct from 'super_admin' then
      raise exception 'only a super admin may grant or revoke the super_admin role'
        using errcode = '42501';
    end if;

  end if;

  return new;
end;
$;

revoke all on function public.guard_profiles_privileges() from public;
grant execute on function public.guard_profiles_privileges() to authenticated;

comment on function public.guard_profiles_privileges() is
  'Migration 016 escalation guard, hardened by 026: role changes need administrator '
  'membership AND the roles:manage permission; super_admin grants need a super_admin actor.';

commit;

-- ---------------------------------------------------------------------------
-- VERIFICATION (executed during acceptance)
--   select grantee, privilege_type from information_schema.role_table_grants
--     where table_name='audit_logs' and grantee in ('anon','authenticated')
--     order by 1,2;                      -> INSERT, SELECT only
--   select grantee || '=' || string_agg(privilege_type, ',' order by 2)
--     from information_schema.role_table_grants
--     where table_schema='public' and grantee in ('anon','authenticated')
--     group by grantee;                  -> no TRUNCATE/TRIGGER/REFERENCES
--   select policyname, cmd, coalesce(with_check::text,'-')
--     from pg_policies where schemaname='public' and tablename='profiles';
-- ROLLBACK
--   drop policy if exists "profiles_admin_delete" on public.profiles;
--   create policy "profiles_admin_delete" on public.profiles
--     for delete using ( public.is_admin() );
--   drop policy if exists "profiles_update_admin" on public.profiles;
--   create policy "profiles_update_admin" on public.profiles
--     for update using ( public.is_admin() ) with check ( true );
--   grant truncate, trigger, references on all tables in schema public
--     to anon, authenticated;
--   grant update, delete, truncate on public.audit_logs to anon, authenticated;
-- ---------------------------------------------------------------------------
