-- ============================================================================
-- PART 04/05 — MIGRATION 024 : permissions + grants for the new capabilities
--
-- Adds resources `pages`, `media`, `settings`, `notifications` to the EXISTING
-- matrix and grants the minimum each role needs. No role gains anything because
-- its name sounds appropriate; every row below is a deliberate decision.
--
-- Notable boundaries preserved:
--   roles:manage            -> super_admin only
--   settings.security:manage-> super_admin only
--   settings:manage         -> super_admin only (admin gets view+edit)
--   users:manage            -> admin as well (user administration), while the 016
--                              database trigger still blocks any admin from
--                              granting or removing super_admin
--   developer / client      -> nothing added here
-- ============================================================================

insert into public.permissions (resource_key, action_key) values
  ('pages','view'),('pages','create'),('pages','edit'),('pages','delete'),
  ('pages','publish'),('pages','approve'),('pages','manage'),('pages','export'),
  ('media','view'),('media','create'),('media','edit'),('media','delete'),
  ('media','publish'),('media','manage'),('media','export'),
  ('settings','view'),('settings','edit'),('settings','manage'),
  ('notifications','view'),('notifications','manage'),
  ('dashboard','view')
on conflict do nothing;

-- super_admin: everything above
insert into public.role_permissions (role_key, resource_key, action_key)
select 'super_admin', p.resource_key, p.action_key
from public.permissions p
where p.resource_key in ('pages','media','settings','notifications','dashboard')
on conflict do nothing;

-- admin: full CMS + media operations, settings view/edit (NOT manage), notifications
insert into public.role_permissions (role_key, resource_key, action_key)
select 'admin', x.resource_key, x.action_key from (values
  ('admin','dashboard','view'),
  ('admin','pages','view'),('admin','pages','create'),('admin','pages','edit'),
  ('admin','pages','delete'),('admin','pages','publish'),('admin','pages','approve'),('admin','pages','export'),
  ('admin','media','view'),('admin','media','create'),('admin','media','edit'),('admin','media','delete'),('admin','media','export'),
  ('admin','settings','view'),('admin','settings','edit'),
  ('admin','notifications','view'),('admin','notifications','manage'),
  ('admin','users','manage')
) as x(role_key, resource_key, action_key)
on conflict do nothing;

-- content_manager: content work only
insert into public.role_permissions (role_key, resource_key, action_key)
select 'content_manager', x.resource_key, x.action_key from (values
  ('content_manager','dashboard','view'),
  ('content_manager','pages','view'),('content_manager','pages','create'),
  ('content_manager','pages','edit'),('content_manager','pages','publish'),
  ('content_manager','media','view'),('content_manager','media','create'),('content_manager','media','edit'),
  ('content_manager','notifications','view')
) as x(role_key, resource_key, action_key)
on conflict do nothing;

-- editor: same editorial surface as content_manager (compatibility role retained)
insert into public.role_permissions (role_key, resource_key, action_key)
select 'editor', x.resource_key, x.action_key from (values
  ('editor','dashboard','view'),
  ('editor','pages','view'),('editor','pages','create'),
  ('editor','pages','edit'),('editor','pages','publish'),
  ('editor','media','view'),('editor','media','create'),('editor','media','edit')
) as x(role_key, resource_key, action_key)
on conflict do nothing;

-- product_manager: product imagery + read-only page context
insert into public.role_permissions (role_key, resource_key, action_key)
select 'product_manager', x.resource_key, x.action_key from (values
  ('product_manager','dashboard','view'),
  ('product_manager','pages','view'),
  ('product_manager','media','view'),('product_manager','media','create'),('product_manager','media','edit')
) as x(role_key, resource_key, action_key)
on conflict do nothing;

-- sales_manager / support_manager: dashboard + their existing operational scope
insert into public.role_permissions (role_key, resource_key, action_key)
select x.role_key, 'dashboard', 'view' from (values ('sales_manager'),('support_manager')) as x(role_key)
on conflict do nothing;

insert into public.role_permissions (role_key, resource_key, action_key)
values ('support_manager','notifications','view')
on conflict do nothing;

-- developer and client intentionally receive NO new grants.

-- ---------------------------------------------------------------------------
-- Real notification source: inbound contact messages and security events.
-- Nothing here is synthetic; rows appear only when the underlying event occurs.
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_contact_message()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.admin_notifications
    (type, title, message, severity, target_role, resource_type, resource_id, metadata)
  values (
    'new_contact_message',
    'New contact message',
    'A new enquiry was submitted (status: ' || new.status::text || ').',
    'info',
    'admin',
    'contact_messages',
    new.id::text,
    jsonb_build_object('status', new.status::text, 'has_service', new.service is not null)
  );
  return new;
end;
$$;

create or replace function public.notify_security_event()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.action in ('role_change','account_status_change','authorization_denied','security_event') then
    insert into public.admin_notifications
      (type, title, message, severity, target_role, resource_type, resource_id, metadata)
    values (
      'security_event',
      case when new.action = 'authorization_denied' then 'Authorization denied'
           when new.action = 'role_change' then 'Role changed'
           when new.action = 'account_status_change' then 'Account status changed'
           else 'Security event' end,
      left(coalesce(new.resource_type,'resource') || ': ' || new.action, 200),
      case when new.action = 'authorization_denied' then 'warning' else 'critical' end,
      'super_admin',
      coalesce(new.resource_type,'audit_logs'),
      new.resource_id,
      jsonb_build_object('audit_action', new.action)
    );
  end if;
  return new;
end;
$$;

revoke all on function public.notify_new_contact_message() from public;
revoke all on function public.notify_security_event() from public;

drop trigger if exists contact_messages_notify_admin on public.contact_messages;
create trigger contact_messages_notify_admin after insert on public.contact_messages
  for each row execute function public.notify_new_contact_message();

drop trigger if exists audit_logs_notify_security on public.audit_logs;
create trigger audit_logs_notify_security after insert on public.audit_logs
  for each row execute function public.notify_security_event();

-- ============================================================================
-- VERIFICATION
--   select role_key, count(*) from public.role_permissions
--   where resource_key in ('pages','media','settings','notifications','dashboard')
--   group by 1 order by 1;
--   -- developer / client must be absent from that list
--   select policyname from pg_policies where tablename='media_assets';
-- ROLLBACK
--   drop trigger if exists audit_logs_notify_security on public.audit_logs;
--   drop trigger if exists contact_messages_notify_admin on public.contact_messages;
--   drop function if exists public.notify_security_event() cascade;
--   drop function if exists public.notify_new_contact_message() cascade;
--   delete from public.role_permissions where resource_key in ('pages','media','settings','notifications','dashboard');
--   delete from public.permissions      where resource_key in ('pages','media','settings','notifications','dashboard');
-- ============================================================================
