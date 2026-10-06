-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
-- Storage buckets for every asset category the brief named. All are public
-- read (they back a public marketing site) with staff-only write access,
-- mirroring the content_items RLS shape.

insert into storage.buckets (id, name, public) values
  ('company-assets', 'company-assets', true),
  ('hm-signature', 'hm-signature', true),
  ('products', 'products', true),
  ('news', 'news', true),
  ('founder', 'founder', true),
  ('logos', 'logos', true),
  ('media', 'media', true)
on conflict (id) do nothing;

create policy "storage_public_read" on storage.objects
  for select using (
    bucket_id in ('company-assets', 'hm-signature', 'products', 'news', 'founder', 'logos', 'media')
  );

create policy "storage_staff_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('company-assets', 'hm-signature', 'products', 'news', 'founder', 'logos', 'media')
    and public.is_staff_editor()
  );

create policy "storage_staff_update" on storage.objects
  for update to authenticated using (
    bucket_id in ('company-assets', 'hm-signature', 'products', 'news', 'founder', 'logos', 'media')
    and public.is_staff_editor()
  );

create policy "storage_staff_delete" on storage.objects
  for delete to authenticated using (
    bucket_id in ('company-assets', 'hm-signature', 'products', 'news', 'founder', 'logos', 'media')
    and public.is_staff_editor()
  );
