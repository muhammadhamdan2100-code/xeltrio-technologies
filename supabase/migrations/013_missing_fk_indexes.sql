-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
create index products_category_id_idx on public.products (category_id);
create index solutions_industry_id_idx on public.solutions (industry_id);
