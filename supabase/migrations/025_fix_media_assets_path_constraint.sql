-- ============================================================================
-- PART 05 — MIGRATION 025 : FIX media_assets storage_path check constraint
--
-- Why this exists: migration 023 created an inline CHECK on storage_path using
-- a bracketed regex with an escaped hyphen ([A-Za-z0-9._/\-]). As stored in the
-- catalog the pattern is invalid ("invalid regular expression: invalid
-- repetition count(s)"), which made EVERY media_assets insert fail. Discovered
-- by execution during the Part 04/05 verification, not by inspection.
--
-- 023 is not rewritten (it was already applied); this migration replaces the
-- broken constraint with two equivalent, escape-free checks:
--   * length bound (1..400)
--   * character allow-list expressed with the hyphen last, so no escape is needed
--
-- IDEMPOTENT BY DESIGN. The first pass of this migration landed the length
-- check but the charset check never reached the live catalog, so a plain
-- re-run had to be able to finish the job without creating a duplicate
-- constraint. PostgreSQL has no ADD CONSTRAINT IF NOT EXISTS, so both adds are
-- wrapped in catalog probes. Re-running is a no-op.
-- ============================================================================

alter table public.media_assets
  drop constraint if exists media_assets_storage_path_check;

alter table public.media_assets
  drop constraint if exists media_assets_storage_path_format;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.media_assets'::regclass
      and conname  = 'media_assets_path_length'
  ) then
    alter table public.media_assets
      add constraint media_assets_path_length
      check (char_length(storage_path) between 1 and 400);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.media_assets'::regclass
      and conname  = 'media_assets_path_charset'
  ) then
    alter table public.media_assets
      add constraint media_assets_path_charset
      check (storage_path ~ '^[A-Za-z0-9._/-]+$');
  end if;
end;
$$;

comment on constraint media_assets_path_charset on public.media_assets is
  'Path allow-list (hyphen placed last; no backslash escaping, which broke the 023 version).';

-- VERIFICATION
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--     where conrelid = 'public.media_assets'::regclass order by 1;
--   -> both media_assets_path_length and media_assets_path_charset must appear.
--   insert into public.media_assets (bucket_id,storage_path,original_filename,filename,
--     mime_type,size_bytes,visibility,status,category)
--   values ('media','acceptance/check.png','check.png','check.png','image/png',1,'public','draft','general');
--     -> must succeed; then delete the acceptance row and its storage object if any.
-- ROLLBACK
--   alter table public.media_assets drop constraint if exists media_assets_path_charset;
--   alter table public.media_assets drop constraint if exists media_assets_path_length;
