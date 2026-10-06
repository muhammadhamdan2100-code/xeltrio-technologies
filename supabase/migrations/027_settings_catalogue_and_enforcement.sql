-- ============================================================================
-- PART 04 — MIGRATION 027 : SETTINGS CATALOGUE + SETTINGS-DRIVEN ENFORCEMENT
--
-- /admin/settings needs a catalogue to edit, and a settings table is only worth
-- having if something reads it. This migration does both, and nothing else.
--
-- Integrity rules followed here:
--   * No invented business facts. Values that belong to the owner (legal name,
--     address, phone, social URLs, mail sender) are seeded as an EMPTY STRING,
--     which the UI renders as "Not configured". A blank is honest; a placeholder
--     is not.
--   * Canonical company facts are not copied. `company.name`, `company.tagline`
--     and `company.founded_year` stay in the `company` table; there is no
--     settings key that duplicates them.
--   * No secrets. There is deliberately no key for a service-role key, DB
--     password, SMTP password or token. Those belong in environment variables.
--     A CHECK below refuses values that look like credentials, so an admin
--     cannot turn this table into a secret store by accident.
--   * Two settings are actually enforced (see "ENFORCED BY" notes): the
--     notification switches in notify_new_contact_message(), and the media
--     upload ceiling read by the media upload action.
--
-- IDEMPOTENT: inserts use ON CONFLICT (key) DO NOTHING, so an already-entered
-- value is never overwritten by a re-run.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Refuse credential-looking values, at the table level.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.system_settings'::regclass
      and conname  = 'system_settings_value_not_secretish'
  ) then
    alter table public.system_settings
      add constraint system_settings_value_not_secretish check (
        value #>> '{}' is null
        or value #>> '{}' !~* '(service_role|secret_key|api[_-]?key|password|passwd|bearer [a-z0-9._-]{10,})'
      );
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Catalogue. category is constrained by 020 to
--    company | contact | branding | social | email | notifications | seo | system
-- ---------------------------------------------------------------------------
insert into public.system_settings (key, value, type, category, description, is_public) values
  -- Company (display only; the canonical record is the `company` table)
  ('company.display_name',    '""'::jsonb, 'string', 'company', 'Display name used by admin surfaces and shared metadata.', true),
  ('company.description',     '""'::jsonb, 'text',   'company', 'Short public description of the company.',                true),
  ('company.address',         '""'::jsonb, 'text',   'company', 'Postal address shown publicly.',                          true),
  ('company.phone',           '""'::jsonb, 'phone',  'company', 'Public company phone number.',                            true),
  ('company.email',           '""'::jsonb, 'email',  'company', 'Public company email address.',                           true),
  ('company.registration',    '""'::jsonb, 'string', 'company', 'Registration/identifier. Private: never returned by public_settings().', false),

  -- Contact
  ('contact.email',           '""'::jsonb, 'email',  'contact', 'Primary contact address for enquiries.',        true),
  ('contact.phone',           '""'::jsonb, 'phone',  'contact', 'Primary contact phone number.',                 true),
  ('contact.whatsapp',        '""'::jsonb, 'phone',  'contact', 'WhatsApp number for the contact page.',         true),
  ('contact.address',         '""'::jsonb, 'text',   'contact', 'Contact address.',                              true),
  ('contact.map_url',         '""'::jsonb, 'url',    'contact', 'Maps link for the location.',                   true),
  ('contact.hours',           '""'::jsonb, 'string', 'contact', 'Business hours text.',                          true),

  -- Branding (empty means "inherit the asset already used by the site")
  ('branding.brand_name',     '""'::jsonb, 'string', 'branding', 'Brand name override. Empty inherits the company display name.', true),
  ('branding.logo_url',       '""'::jsonb, 'url',    'branding', 'Primary logo URL.',                                            true),
  ('branding.favicon_url',    '""'::jsonb, 'url',    'branding', 'Favicon URL.',                                                 true),
  ('branding.og_image_url',   '""'::jsonb, 'url',    'branding', 'Default social sharing image.',                                 true),
  ('branding.accent_color',   '""'::jsonb, 'color',  'branding', 'Accent colour override, if the design ever needs one.',        true),

  -- Social
  ('social.linkedin_url',     '""'::jsonb, 'url', 'social', 'LinkedIn profile URL.',   true),
  ('social.facebook_url',     '""'::jsonb, 'url', 'social', 'Facebook page URL.',      true),
  ('social.instagram_url',    '""'::jsonb, 'url', 'social', 'Instagram profile URL.',  true),
  ('social.x_url',            '""'::jsonb, 'url', 'social', 'X / Twitter profile URL.', true),
  ('social.youtube_url',      '""'::jsonb, 'url', 'social', 'YouTube channel URL.',    true),

  -- Email (stored configuration only: no mail provider is wired up yet)
  ('email.sender_name',       '""'::jsonb, 'string', 'email', 'From-name for outbound mail. No provider is configured yet.', false),
  ('email.reply_to',          '""'::jsonb, 'email',  'email', 'Reply-to address for outbound mail.',                          false),
  ('email.notify_recipients', '""'::jsonb, 'string', 'email', 'Comma-separated admin recipients. Private.',                   false),

  -- Notifications — enforced by notify_new_contact_message() below
  ('notifications.enabled',           'true'::jsonb,  'boolean', 'notifications', 'Master switch for admin notifications.',            false),
  ('notifications.contact_messages',  'true'::jsonb,  'boolean', 'notifications', 'Create an admin notification for each contact form submission.', false),
  ('notifications.content_reviews',   'true'::jsonb,  'boolean', 'notifications', 'Notify administrators when content is submitted for review.',     false),
  ('notifications.security_events',   'true'::jsonb,  'boolean', 'notifications', 'Notify administrators on security events.',                      false),

  -- SEO defaults
  ('seo.default_suffix',      '""'::jsonb, 'string', 'seo', 'Suffix appended to page titles.',                 true),
  ('seo.default_description', '""'::jsonb, 'text',   'seo', 'Fallback meta description.',                      true),
  ('seo.default_og_image',    '""'::jsonb, 'url',    'seo', 'Fallback Open Graph image.',                      true),
  ('seo.default_keywords',    '[]'::jsonb, 'json',   'seo', 'Default keyword list (JSON array of strings).',    true),
  ('seo.robots',              '"index, follow"'::jsonb, 'string', 'seo', 'Default robots directive.',           true),

  -- System configuration — enforced by the media upload action
  ('system.media_max_upload_mb', '10'::jsonb, 'number', 'system', 'Maximum accepted media upload in megabytes.', false)
on conflict (key) do nothing;

-- Fix the two keys 020 already seeded so the catalogue is consistent.
update public.system_settings set category = 'seo' where key = 'seo.default_suffix' and category <> 'seo';

-- ---------------------------------------------------------------------------
-- 3. Make the notification switches real: the contact-message trigger now
--    consults notifications.enabled / notifications.contact_messages.
-- ---------------------------------------------------------------------------
create or replace function public.notify_new_contact_message()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  for_contact boolean;
begin
  -- Both switches must be on. If either row is missing the default is "on",
  -- which is the behaviour that existed before this migration.
  select coalesce(bool_and((value #>> '{}')::boolean), true)
    into for_contact
  from public.system_settings
  where key in ('notifications.enabled', 'notifications.contact_messages');

  if not for_contact then
    return new;
  end if;

  insert into public.admin_notifications (type, title, message, severity, target_role, resource_type, resource_id, metadata)
  values (
    'new_contact_message',
    'New contact message',
    'A new enquiry was submitted (status: ' || new.status::text || ').',
    'info',
    'admin',
    'contact_messages',
    new.id::text,
    jsonb_build_object('status', new.status::text)
  );

  return new;
end;
$$;

comment on function public.notify_new_contact_message() is
  'Creates the admin notification for a contact submission. Honors notifications.enabled and notifications.contact_messages.';

commit;

-- ---------------------------------------------------------------------------
-- VERIFICATION
--   select category, count(*) from public.system_settings group by 1 order by 1;   -- 8 categories
--   select key, value #>> '{}' from public.system_settings where is_public order by key;
--   select public_settings();   -- must return only is_public rows
--   select admin_settings();    -- 42501 unless settings:view
-- ROLLBACK
--   delete from public.system_settings where key in (
--     'company.description','company.address','company.phone','company.email','company.registration',
--     'contact.email','contact.phone','contact.whatsapp','contact.address','contact.map_url','contact.hours',
--     'branding.brand_name','branding.logo_url','branding.favicon_url','branding.og_image_url','branding.accent_color',
--     'social.linkedin_url','social.facebook_url','social.instagram_url','social.x_url','social.youtube_url',
--     'email.sender_name','email.reply_to','email.notify_recipients',
--     'notifications.contact_messages','notifications.content_reviews','notifications.security_events',
--     'seo.default_description','seo.default_og_image','seo.default_keywords','seo.robots',
--     'system.media_max_upload_mb');
--   alter table public.system_settings drop constraint if exists system_settings_value_not_secretish;
-- ---------------------------------------------------------------------------
