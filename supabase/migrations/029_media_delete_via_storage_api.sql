-- ============================================================================
-- PART 05 — MIGRATION 029 : media deletion cannot go through SQL
--
-- Reproduced live during Part 04/05 acceptance:
--
--   select public.delete_media_asset('<id>')   -- as super_admin
--   -> 42501  Direct deletion from storage tables is not allowed.
--             Use the Storage API instead.
--
-- Supabase installs a BEFORE DELETE trigger on storage.objects that refuses any
-- SQL-originated row removal, so 023's "delete the object first, then the
-- catalogue row" design could never run: /admin/media delete failed for every
-- role, including super_admin.
--
-- This migration removes only that forbidden statement. The permission check,
-- the not-found check and the audit insert are unchanged, and the function now
-- returns "<bucket>/<path>" so the caller can remove the file through the
-- Storage API as the same authenticated user (storage_delete_authorized already
-- honours can('media','delete'), so no service-role credential is involved).
--
-- The server action app/admin/media/actions.ts -> deleteMediaAction performs the
-- ordered flow the brief requires: authorize, remove the object first, then the
-- catalogue row through the media_delete_staff RLS policy, auditing either
-- outcome. Object-first ordering is deliberate: an orphaned storage object is
-- the unrecoverable state the brief forbids, whereas a row whose file vanished is
-- visible and repairable.
--
-- 023 is not rewritten.
-- ============================================================================

begin;

create or replace function public.delete_media_asset(p_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  rec public.media_assets;
begin
  if not public.can('media','delete') then
    raise exception 'deleting media requires media:delete' using errcode = '42501';
  end if;

  select * into rec from public.media_assets where id = p_id for update;
  if rec.id is null then
    raise exception 'media asset not found' using errcode = 'P0002';
  end if;

  delete from public.media_assets where id = p_id;

  insert into public.audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
  values (auth.uid(), 'media_deleted', 'media_assets', p_id::text,
          jsonb_build_object('bucket', rec.bucket_id, 'visibility', rec.visibility,
                             'size_bytes', rec.size_bytes));

  return rec.bucket_id || '/' || rec.storage_path;
end;
$$;

revoke all on function public.delete_media_asset(uuid) from public;
grant execute on function public.delete_media_asset(uuid) to authenticated;

comment on function public.delete_media_asset(uuid) is
  'Requires media:delete. Deletes and audits the catalogue row and returns '
  'bucket/path; the file itself must be removed through the Storage API because '
  'Supabase refuses SQL deletes on storage.objects.';

commit;

-- ---------------------------------------------------------------------------
-- VERIFICATION (executed)
--   select prosrc like '%storage.objects%' from pg_proc ... -> false
--   as super_admin: perform public.delete_media_asset('<id>') -> returns 'media/<path>'
--   as client:      perform public.delete_media_asset('<id>') -> 42501
--   media_deleted row appears in audit_logs
-- ROLLBACK
--   restore the 023 definition of delete_media_asset(uuid).
-- ---------------------------------------------------------------------------
