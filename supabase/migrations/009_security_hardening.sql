-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
-- Fix: set_updated_at was missing a pinned search_path (every other
-- function already had one).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Fix: handle_new_user is a trigger-only function (fired internally when
-- auth.users gets a new row) — it never needs to be callable directly via
-- the PostgREST /rpc endpoint, so revoke that surface entirely.
revoke execute on function public.handle_new_user() from anon, authenticated;

-- is_admin()/is_staff_editor() intentionally remain executable by
-- anon/authenticated: RLS policies evaluate them in the querying role's
-- context, so revoking that would break every policy that calls them
-- (including plain "published OR staff" read policies). Both only ever
-- report a boolean about the caller's own auth.uid(), so this is safe —
-- Supabase's own RLS-helper-function pattern works this way by design.
