-- ============================================================================
-- PART 05 — MIGRATION 022 : CMS revisions (append-only history + safe restore)
--
-- Every meaningful page update stores a snapshot. Restoring does NOT destroy
-- history: it writes the current state as a new revision, applies the chosen
-- snapshot as a fresh update (which itself produces another revision), and is
-- audited.
-- ============================================================================

create table if not exists public.page_revisions (
  id             uuid primary key default gen_random_uuid(),
  page_id        uuid not null references public.pages (id) on delete cascade,
  revision_no    integer not null check (revision_no > 0),
  snapshot       jsonb not null,
  change_summary text,
  status_at_time public.content_status,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  unique (page_id, revision_no),
  check (jsonb_typeof(snapshot) = 'object')
);

create index if not exists page_revisions_page_idx on public.page_revisions (page_id, revision_no desc);
create index if not exists page_revisions_by_idx   on public.page_revisions (created_by, created_at desc);

comment on table public.page_revisions is
  'Append-only CMS history. No update/delete policy exists for normal roles.';

create or replace function public.snapshot_page_revision()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  next_no integer;
begin
  select coalesce(max(revision_no), 0) + 1 into next_no
  from public.page_revisions where page_id = new.id;

  insert into public.page_revisions (page_id, revision_no, snapshot, status_at_time, created_by, change_summary)
  values (
    new.id,
    next_no,
    to_jsonb(old) - 'updated_at' - 'created_at',
    old.status,
    coalesce(auth.uid(), old.updated_by),
    case when old.status is distinct from new.status
         then 'status ' || old.status::text || ' -> ' || new.status::text
         else 'content update' end
  );
  return new;
end;
$$;

revoke all on function public.snapshot_page_revision() from public;

drop trigger if exists pages_snapshot_revision on public.pages;
create trigger pages_snapshot_revision after update on public.pages
  for each row
  when (old.title is distinct from new.title
        or old.slug is distinct from new.slug
        or old.description is distinct from new.description
        or old.status is distinct from new.status
        or old.metadata is distinct from new.metadata
        or old.seo_title is distinct from new.seo_title
        or old.seo_description is distinct from new.seo_description
        or old.og_image_url is distinct from new.og_image_url)
  execute function public.snapshot_page_revision();

-- ---------------------------------------------------------------------------
-- Restore: authorized, non-destructive, audited.
-- ---------------------------------------------------------------------------
create or replace function public.restore_page_revision(p_page_id uuid, p_revision integer)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  snap jsonb;
  st   public.content_status;
begin
  if not public.can('pages','edit') then
    raise exception 'restoring a revision requires pages:edit' using errcode = '42501';
  end if;

  select snapshot, status_at_time into snap, st
  from public.page_revisions
  where page_id = p_page_id and revision_no = p_revision;

  if snap is null then
    raise exception 'revision not found' using errcode = 'P0002';
  end if;

  update public.pages set
    title            = coalesce((snap->>'title')::text, title),
    slug             = coalesce((snap->>'slug')::text, slug),
    key              = coalesce((snap->>'key')::text, key),
    description      = snap->>'description',
    seo_title        = snap->>'seo_title',
    seo_description  = snap->>'seo_description',
    og_image_url     = snap->>'og_image_url',
    metadata         = coalesce(snap->'metadata', '{}'::jsonb),
    status           = coalesce(st, status)
  where id = p_page_id;

  insert into public.audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
  values (auth.uid(), 'revision_restored', 'pages', p_page_id::text,
          jsonb_build_object('revision', p_revision));

  insert into public.admin_notifications (type, title, message, severity, target_role, resource_type, resource_id, metadata)
  values ('revision_restored', 'Revision restored',
          'Revision ' || p_revision::text || ' was restored on a page.', 'info',
          'content_manager', 'pages', p_page_id::text,
          jsonb_build_object('revision', p_revision))
  where exists (select 1 from public.roles where key = 'content_manager');

  return p_revision;
end;
$$;

revoke all on function public.restore_page_revision(uuid, integer) from public;
grant execute on function public.restore_page_revision(uuid, integer) to authenticated;

comment on function public.restore_page_revision(uuid, integer) is
  'Requires pages:edit. Writes the target snapshot as a NEW update so history is preserved; never deletes revisions.';

-- RLS: revisions are readable by page viewers, append-only for everyone.
alter table public.page_revisions enable row level security;

drop policy if exists revisions_select_staff on "public"."page_revisions";
create policy revisions_select_staff on "public"."page_revisions"
  for select to authenticated
  using (public.can('pages','view'));

-- Deliberately NO insert/update/delete policy: writes happen through the
-- SECURITY DEFINER trigger/function only.

-- ============================================================================
-- VERIFICATION
--   select policyname, cmd from pg_policies where tablename='page_revisions';  -- SELECT only
--   update public.pages set description='x' where id='<uuid>';
--     select revision_no, change_summary from public.page_revisions where page_id='<uuid>';
-- ROLLBACK
--   drop table if exists public.page_revisions;
--   drop function if exists public.restore_page_revision(uuid,integer);
--   drop function if exists public.snapshot_page_revision() cascade;
-- ============================================================================
