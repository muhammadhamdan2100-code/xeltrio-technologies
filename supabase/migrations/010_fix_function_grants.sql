-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
-- The previous migration revoked from anon/authenticated directly, but
-- Postgres grants EXECUTE to the PUBLIC pseudo-role by default at CREATE
-- time — revoking from named roles doesn't touch a PUBLIC grant. Fix that,
-- then explicitly re-grant only where the function is actually meant to be
-- called from an RLS policy (is_admin, is_staff_editor).

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.set_updated_at() from public;

-- set_updated_at also doesn't need SECURITY DEFINER — it only ever touches
-- NEW within the triggering statement's own privileges. Correcting that
-- back to SECURITY INVOKER (the safer default) while we're in here.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function public.set_updated_at() from public;

-- is_admin()/is_staff_editor() are intentionally still callable by
-- anon/authenticated — RLS policies run as the querying role, so this
-- grant is what lets "published OR is_staff_editor()" evaluate at all.
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_staff_editor() to anon, authenticated;
