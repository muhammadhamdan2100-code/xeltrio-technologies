-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
-- Every content table had a "public_read" SELECT policy plus a separate
-- "staff_write" FOR ALL policy — the latter's own implicit SELECT clause
-- meant every read had to evaluate two permissive policies instead of one.
-- Splitting "for all" into insert/update/delete (never select) fixes that;
-- select is already fully covered by the public/staff read policies.
-- Also wrapping auth.uid()/auth.<fn>() in `(select ...)` per Postgres RLS
-- performance guidance, so it's evaluated once per query, not once per row.

do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('company', 'company_staff_write', 'is_staff_editor'),
      ('founder', 'founder_staff_write', 'is_staff_editor'),
      ('content_items', 'content_items_staff_write', 'is_staff_editor'),
      ('product_categories', 'product_categories_staff_write', 'is_staff_editor'),
      ('products', 'products_staff_write', 'is_staff_editor'),
      ('industries', 'industries_staff_write', 'is_staff_editor'),
      ('solutions', 'solutions_staff_write', 'is_staff_editor'),
      ('roadmap_steps', 'roadmap_steps_staff_write', 'is_staff_editor'),
      ('news_articles', 'news_staff_write', 'is_staff_editor'),
      ('press_releases', 'press_staff_write', 'is_staff_editor'),
      ('announcements', 'announcements_staff_write', 'is_staff_editor'),
      ('careers_jobs', 'careers_staff_write', 'is_staff_editor'),
      ('testimonials', 'testimonials_staff_write', 'is_staff_editor'),
      ('faqs', 'faqs_staff_write', 'is_staff_editor'),
      ('brand_pages', 'brand_pages_staff_write', 'is_staff_editor'),
      ('hm_signature_fragrances', 'hm_fragrances_staff_write', 'is_staff_editor'),
      ('navigation_items', 'navigation_staff_write', 'is_staff_editor'),
      ('footer_links', 'footer_links_staff_write', 'is_staff_editor'),
      ('legal_pages', 'legal_pages_staff_write', 'is_staff_editor'),
      ('resources', 'resources_staff_write', 'is_staff_editor')
    ) as x(tbl, policy, fn)
  loop
    execute format('drop policy if exists %I on public.%I', t.policy, t.tbl);
    execute format(
      'create policy %I on public.%I for insert with check ((select public.%I()))',
      t.policy || '_insert', t.tbl, t.fn
    );
    execute format(
      'create policy %I on public.%I for update using ((select public.%I())) with check ((select public.%I()))',
      t.policy || '_update', t.tbl, t.fn, t.fn
    );
    execute format(
      'create policy %I on public.%I for delete using ((select public.%I()))',
      t.policy || '_delete', t.tbl, t.fn
    );
  end loop;
end $$;

-- profiles used is_admin() directly via "for all" too, plus its own
-- select/update-own policies overlapping with it — same fix.
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_insert" on public.profiles
  for insert with check ((select public.is_admin()));
create policy "profiles_admin_update" on public.profiles
  for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "profiles_admin_delete" on public.profiles
  for delete using ((select public.is_admin()));

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using ((select auth.uid()) = id or (select public.is_admin()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
