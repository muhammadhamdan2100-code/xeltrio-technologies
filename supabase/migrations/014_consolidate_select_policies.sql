-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
-- Merge each table's "public sees published" + "staff sees everything"
-- pair into one combined SELECT policy, so a read only ever evaluates a
-- single permissive policy instead of two.

do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('content_items', 'content_items_public_read', 'content_items_staff_read_all'),
      ('products', 'products_public_read', 'products_staff_read_all'),
      ('industries', 'industries_public_read', 'industries_staff_read_all'),
      ('solutions', 'solutions_public_read', 'solutions_staff_read_all'),
      ('news_articles', 'news_public_read', 'news_staff_read_all'),
      ('press_releases', 'press_public_read', 'press_staff_read_all'),
      ('announcements', 'announcements_public_read', 'announcements_staff_read_all'),
      ('careers_jobs', 'careers_public_read', 'careers_staff_read_all'),
      ('testimonials', 'testimonials_public_read', 'testimonials_staff_read_all'),
      ('faqs', 'faqs_public_read', 'faqs_staff_read_all'),
      ('hm_signature_fragrances', 'hm_fragrances_public_read', 'hm_fragrances_staff_read_all')
    ) as x(tbl, public_policy, staff_policy)
  loop
    execute format('drop policy if exists %I on public.%I', t.public_policy, t.tbl);
    execute format('drop policy if exists %I on public.%I', t.staff_policy, t.tbl);
  end loop;
end $$;

-- careers_jobs uses status = 'open' for public visibility (not 'published'
-- like the rest) — handle it explicitly, then the other ten generically.
create policy "careers_read" on public.careers_jobs
  for select using (status = 'open' or (select public.is_staff_editor()));

create policy "content_items_read" on public.content_items
  for select using (status = 'published' or (select public.is_staff_editor()));
create policy "products_read" on public.products
  for select using (status = 'published' or (select public.is_staff_editor()));
create policy "industries_read" on public.industries
  for select using (status = 'published' or (select public.is_staff_editor()));
create policy "solutions_read" on public.solutions
  for select using (status = 'published' or (select public.is_staff_editor()));
create policy "news_read" on public.news_articles
  for select using (status = 'published' or (select public.is_staff_editor()));
create policy "press_read" on public.press_releases
  for select using (status = 'published' or (select public.is_staff_editor()));
create policy "announcements_read" on public.announcements
  for select using (status = 'published' or (select public.is_staff_editor()));
create policy "testimonials_read" on public.testimonials
  for select using (status = 'published' or (select public.is_staff_editor()));
create policy "faqs_read" on public.faqs
  for select using (status = 'published' or (select public.is_staff_editor()));
create policy "hm_fragrances_read" on public.hm_signature_fragrances
  for select using (status = 'published' or (select public.is_staff_editor()));

-- Same consolidation for profiles' two UPDATE policies (own row OR admin).
drop policy if exists "profiles_admin_update" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update" on public.profiles
  for update
  using ((select auth.uid()) = id or (select public.is_admin()))
  with check ((select auth.uid()) = id or (select public.is_admin()));
