-- ============================================================================
-- PART 05 — MIGRATION 023 : media_assets + private bucket + STORAGE HARDENING
--
-- Two purposes:
--  1) media catalogue with real metadata, alt text, visibility and uploader.
--  2) FIX A REAL WEAKNESS found in the Phase 0 audit: the existing
--     storage_staff_insert / _update / _delete policies authorized ANY
--     authenticated role (including `client`) to write public buckets. They are
--     replaced with RBAC-checked policies via the existing public.can() matrix.
--
-- One additional bucket is created: `private-assets` (public = false) for
-- client documents / private files. The 7 existing public buckets are reused
-- for public site assets — no duplicates are created.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Private bucket (does not exist today; required for private/Client files)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-assets',
  'private-assets',
  false,
  26214400,
  array['image/png','image/jpeg','image/webp','image/svg+xml','application/pdf',
        'text/plain','application/json','image/avif']
)
on conflict (id) do nothing;

-- Tighten the existing public buckets: cap size and restrict to image/document
-- types instead of "any MIME, unlimited". Applied only where currently unset.
update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array['image/png','image/jpeg','image/webp','image/avif',
                                  'image/svg+xml','video/mp4','application/pdf']
 where id in ('company-assets','founder','hm-signature','logos','media','news','products')
   and file_size_limit is null;

create table if not exists public.media_assets (
  id                uuid primary key default gen_random_uuid(),
  bucket_id         text not null,
  storage_path      text not null,
  original_filename text not null,
  filename          text not null,
  mime_type         text not null,
  size_bytes        bigint not null check (size_bytes >= 0 and size_bytes <= 26214400),
  width             integer check (width is null or width between 1 and 20000),
  height            integer check (height is null or height between 1 and 20000),
  title             text,
  alt_text          text,
  description       text,
  category          text not null default 'general' check (category in
                    ('general','logo','icon','product','founder','brand','news','media','document')),
  visibility        text not null default 'public' check (visibility in ('public','private')),
  status            public.content_status not null default 'draft',
  metadata          jsonb not null default '{}'::jsonb,
  uploaded_by       uuid references public.profiles (id) on delete set null,
  updated_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- A private asset may only live in the private bucket, and a public asset may
  -- never be parked in it. Keeps DB metadata and storage location consistent.
  constraint media_assets_visibility_bucket_consistent check (
    (visibility = 'private' and bucket_id = 'private-assets')
    or (visibility = 'public' and bucket_id <> 'private-assets')
  ),
  unique (bucket_id, storage_path),
  check (storage_path ~ '^[A-Za-z0-9._/\-]{1,400}$')
);

create index if not exists media_assets_category_idx   on public.media_assets (category, created_at desc);
create index if not exists media_assets_visibility_idx on public.media_assets (visibility, status);
create index if not exists media_assets_uploader_idx   on public.media_assets (uploaded_by, created_at desc);
create index if not exists media_assets_name_idx       on public.media_assets (filename);

comment on table public.media_assets is
  'Media catalogue. visibility=private is always stored in the private-assets bucket (enforced by constraint) and is never publicly readable.';

drop trigger if exists set_media_assets_updated_at on public.media_assets;
create trigger set_media_assets_updated_at before update on public.media_assets
  for each row execute function public.set_updated_at();

create or replace function public.stamp_media_audit_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op = 'INSERT' then
    new.uploaded_by := auth.uid();
    new.updated_by := auth.uid();
  else
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

revoke all on function public.stamp_media_audit_columns() from public;

drop trigger if exists media_assets_stamp_actor on public.media_assets;
create trigger media_assets_stamp_actor before insert or update on public.media_assets
  for each row execute function public.stamp_media_audit_columns();

-- ---------------------------------------------------------------------------
-- media_assets RLS
-- ---------------------------------------------------------------------------
alter table public.media_assets enable row level security;

drop policy if exists media_select_public on "public"."media_assets";
create policy media_select_public on "public"."media_assets"
  for select to anon, authenticated
  using (visibility = 'public' and status = 'published');

drop policy if exists media_select_staff on "public"."media_assets";
create policy media_select_staff on "public"."media_assets"
  for select to authenticated
  using (public.can('media','view'));

drop policy if exists media_insert_staff on "public"."media_assets";
create policy media_insert_staff on "public"."media_assets"
  for insert to authenticated
  with check (public.can('media','create'));

drop policy if exists media_update_staff on "public"."media_assets";
create policy media_update_staff on "public"."media_assets"
  for update to authenticated
  using (public.can('media','edit'))
  with check (public.can('media','edit'));

drop policy if exists media_delete_staff on "public"."media_assets";
create policy media_delete_staff on "public"."media_assets"
  for delete to authenticated
  using (public.can('media','delete'));

-- ---------------------------------------------------------------------------
-- storage.objects policies: REPLACE the role-blind staff_* policies with
-- RBAC-checked ones. Anonymous read stays limited to the public buckets.
-- ---------------------------------------------------------------------------
drop policy if exists storage_public_read on storage.objects;
drop policy if exists storage_staff_insert on storage.objects;
drop policy if exists storage_staff_update on storage.objects;
drop policy if exists storage_staff_delete on storage.objects;

create policy storage_public_read on storage.objects
  for select to anon, authenticated
  using (
    -- explicit allow-list of public marketing buckets; private-assets is absent
    bucket_id in ('company-assets','founder','hm-signature','logos','media','news','products')
  );

-- Private bucket: authorized staff only (bucket is also non-public, so unsigned
-- URLs fail regardless — this is defence in depth, not the only control).
create policy storage_private_read_authorized on storage.objects
  for select to authenticated
  using (bucket_id = 'private-assets' and public.can('media','view'));

create policy storage_upload_authorized on storage.objects
  for insert to authenticated
  with check (
    public.can('media','create')
    and (
      (bucket_id in ('company-assets','founder','hm-signature','logos','media','news','products'))
      or bucket_id = 'private-assets'
    )
  );

create policy storage_update_authorized on storage.objects
  for update to authenticated
  using (public.can('media','edit'))
  with check (public.can('media','edit'));

create policy storage_delete_authorized on storage.objects
  for delete to authenticated
  using (public.can('media','delete'));

-- ---------------------------------------------------------------------------
-- Atomic-ish delete with compensation: remove the object first, then the row,
-- so a failure can never leave a publicly reachable orphan object.
-- ---------------------------------------------------------------------------
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

  select * into rec from public.media_assets where id = p_id;
  if rec.id is null then
    raise exception 'media asset not found' using errcode = 'P0002';
  end if;

  delete from storage.objects where bucket_id = rec.bucket_id and name = rec.storage_path;
  delete from public.media_assets where id = p_id;

  insert into public.audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
  values (auth.uid(), 'media_deleted', 'media_assets', p_id::text,
          jsonb_build_object('bucket', rec.bucket_id, 'visibility', rec.visibility,
                              'size_bytes', rec.size_bytes));

  return rec.storage_path;
end;
$$;

revoke all on function public.delete_media_asset(uuid) from public;
grant execute on function public.delete_media_asset(uuid) to authenticated;

comment on function public.delete_media_asset(uuid) is
  'Requires media:delete. Deletes the storage object before the catalogue row so no orphan object can survive.';

-- Signed URL helper for private assets (used server-side only).
create or replace function public.media_visibility_is_private(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(visibility = 'private', false) from public.media_assets where id = p_id;
$$;

revoke all on function public.media_visibility_is_private(uuid) from public;
grant execute on function public.media_visibility_is_private(uuid) to authenticated;

-- ============================================================================
-- VERIFICATION
--   select id, public, file_size_limit from storage.buckets order by id;  -- 8 buckets
--   select policyname, cmd, roles from pg_policies where schemaname='storage' order by 1;
--   select count(*) from pg_policies where schemaname='public';
--   as a `client` session: insert into storage.objects ... -> rejected (can()=false)
-- ROLLBACK
--   drop policy if exists storage_public_read, storage_private_read_authorized,
--     storage_upload_authorized, storage_update_authorized, storage_delete_authorized on storage.objects;
--   -- original staff_* policies were intentionally not restored (they were the weakness);
--   -- restore them from migration 008 if a rollback of this file is ever required.
--   drop function if exists public.media_visibility_is_private(uuid);
--   drop function if exists public.delete_media_asset(uuid) cascade;
--   drop table if exists public.media_assets;
--   delete from storage.buckets where id = 'private-assets';
-- ============================================================================
