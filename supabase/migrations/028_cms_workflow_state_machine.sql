-- ============================================================================
-- PART 05 — MIGRATION 028 : CMS WORKFLOW STATE MACHINE + CREATION GUARD
--
-- Found by execution during Part 04/05 acceptance, not by inspection.
-- Migration 021's guard only asks "does the caller hold the permission for the
-- TARGET state". It never asks whether the transition itself is legal, and it
-- is attached to UPDATE only. Four bypasses were reproduced live:
--
--   content_manager  INSERT page with status='approved'    -> ALLOWED (was: deny)
--   content_manager  INSERT page with status='published'   -> ALLOWED (was: deny)
--   content_manager  UPDATE draft -> published             -> ALLOWED (was: deny)
--   editor           UPDATE draft -> published             -> ALLOWED (was: deny)
--
-- In other words a role that legitimately holds pages:publish but NOT
-- pages:approve could publish content without ever passing review or approval,
-- and could publish at creation time. The approval gate existed only in the
-- admin UI.
--
-- This migration keeps every 021 check and stamp (nothing is weakened) and adds:
--   1. a legal-transition matrix on UPDATE, and
--   2. a creation guard on INSERT so a new page starts as 'draft'
--      ('in_review' also allowed for an editor submitting directly).
--
-- super_admin is exempt from the matrix only — the per-state permission checks
-- still apply — because the Part 04 brief defines super admin as full control.
--
-- Verified in the same battery: content_manager.in_review->approved still raises
-- 42501, product_manager cannot edit pages at all, and admin can still approve.
-- ============================================================================

begin;

create or replace function public.guard_page_workflow()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  is_super boolean;
begin
  if auth.uid() is null then
    return new;  -- service role / migration / owner console
  end if;

  if new.status is distinct from old.status then

    is_super := (public.session_user_role() = 'super_admin');

    -- 1. Transition legality (the state machine 021 never enforced).
    if not is_super and not (
         (old.status = 'draft'     and new.status in ('in_review','archived')) or
         (old.status = 'in_review' and new.status in ('approved','draft'))     or
         (old.status = 'approved'  and new.status in ('published','draft'))    or
         (old.status = 'published' and new.status in ('draft','archived'))     or
         (old.status = 'archived'  and new.status = 'draft')
    ) then
      raise exception 'illegal content transition from % to %', old.status, new.status
        using errcode = '42501';
    end if;

    -- 2. Permission for the target state (unchanged from 021).
    if new.status = 'in_review' then
      if not public.can('pages','edit') then
        raise exception 'submitting content for review requires pages:edit' using errcode = '42501';
      end if;
      new.reviewed_by := null;
      new.approved_by := null;

    elsif new.status = 'approved' then
      if not public.can('pages','approve') then
        raise exception 'approving content requires pages:approve' using errcode = '42501';
      end if;
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
      new.approved_by := auth.uid();
      new.approved_at := now();

    elsif new.status = 'published' then
      if not public.can('pages','publish') then
        raise exception 'publishing requires pages:publish' using errcode = '42501';
      end if;
      new.published_by := auth.uid();
      new.published_at := coalesce(old.published_at, now());

    elsif new.status = 'archived' then
      if not public.can('pages','publish') then
        raise exception 'archiving requires pages:publish' using errcode = '42501';
      end if;
      new.archived_at := now();

    elsif new.status = 'draft' then
      if not public.can('pages','edit') then
        raise exception 'returning content to draft requires pages:edit' using errcode = '42501';
      end if;
      new.archived_at := null;
      if old.status in ('approved','published') then
        new.approved_by := null;
        new.approved_at := null;
      end if;
    end if;

    insert into public.audit_logs (actor_user_id, action, resource_type, resource_id, metadata)
    values (auth.uid(),
            'page_' || new.status::text,
            'pages',
            new.id::text,
            jsonb_build_object('from', old.status::text, 'to', new.status::text, 'key', new.key));
  end if;

  return new;
end;
$$;

create or replace function public.guard_page_creation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    return new;  -- service role / migration / owner console
  end if;

  -- A page created through the API starts as a draft. An editor may submit
  -- straight to review. Approved/published/archived cannot be minted directly,
  -- because those states are only reachable through the audited transitions.
  if new.status = 'draft' then
    return new;
  end if;

  if new.status = 'in_review' then
    if not public.can('pages','edit') then
      raise exception 'creating content directly in review requires pages:edit' using errcode = '42501';
    end if;
    return new;
  end if;

  raise exception 'content cannot be created in the % state' , new.status
    using errcode = '42501';
end;
$$;

revoke all on function public.guard_page_workflow() from public;
revoke all on function public.guard_page_creation() from public;
grant execute on function public.guard_page_workflow() to authenticated;
grant execute on function public.guard_page_creation() to authenticated;

drop trigger if exists pages_workflow_guard on public.pages;
create trigger pages_workflow_guard before update on public.pages
  for each row execute function public.guard_page_workflow();

drop trigger if exists pages_creation_guard on public.pages;
create trigger pages_creation_guard before insert on public.pages
  for each row execute function public.guard_page_creation();

comment on function public.guard_page_workflow() is
  '021 permission checks plus the 028 legal-transition matrix; records page_* audit events.';
comment on function public.guard_page_creation() is
  'Pages may only be created as draft or in_review; later states require an audited transition.';

commit;

-- ---------------------------------------------------------------------------
-- VERIFICATION (executed)
--   content_manager INSERT ... status='published'  -> raises 42501
--   content_manager UPDATE draft->published        -> raises 42501
--   content_manager UPDATE in_review->approved     -> raises 42501
--   content_manager UPDATE approved->published     -> allowed
--   admin UPDATE in_review->approved               -> allowed
--   super_admin UPDATE draft->published            -> allowed (full control)
-- ROLLBACK
--   drop trigger if exists pages_creation_guard on public.pages;
--   drop function if exists public.guard_page_creation();
--   drop trigger if exists pages_workflow_guard on public.pages;
--   <recreate 021's guard_page_workflow and pages_workflow_guard>
-- ---------------------------------------------------------------------------
