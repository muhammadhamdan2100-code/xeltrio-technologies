-- recovered verbatim from supabase_migrations.schema_migrations.statements (md5 2c206cd8d3ea249c704d03d582ac8ed4)
-- Recording the grant fix from the previous debugging pass as a proper
-- tracked migration (idempotent — safe to run again).
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_staff_editor() to anon, authenticated;
