# PART 04 — Super Admin Control Center: security verification

Executed against the live Supabase project `yparzhgzhpwewyrjhqud` and the built
application (`next start`, port 3111) on 2026-10-06. Every result below comes from
a statement that was actually run, not from code inspection.

Legend: **PASS** executed and matched expectation · **FAIL** executed and did not
match · **NOT TESTED** could not be executed in this environment ·
**OWNER ACTION REQUIRED** · **FUTURE ENHANCEMENT**.

## 0. Environment

| Item | Value |
| --- | --- |
| Next.js | 16.2.12 (App Router, `proxy.ts`) |
| Node | v24.18.0 |
| Database | Supabase Postgres, FREE plan, `ap-south-1`, NANO/t3.nano |
| Backups | none available on this plan (verified in Part 02) |
| Credentials used | publishable/anon key only. No service-role key exists in the repo or environment. |
| Authenticated app session | NOT AVAILABLE — no owner password was provided and none was requested. |

Because no app login was possible, role-level authorization was exercised at the
database layer with `set local role authenticated` plus
`set local request.jwt.claims = {"sub": …}`, which is the same evaluation path
`can()`, `session_profile()` and every RLS policy use in production. Each test
script ran inside `begin; … rollback;` and finished with `raise exception`, so the
transaction always aborted and nothing persisted.

## 1. Migration and schema state

| Test | Expected | Actual | Result |
| --- | --- | --- | --- |
| `supabase_migrations.schema_migrations` before work | reflects applied DDL | only 001–015 recorded (15 rows); 016–025 absent | **FAIL (found)** |
| History reconciliation 016–026 | added without touching schema | 15 → 26 rows, versions `016`…`026` | **PASS** |
| History reconciliation 027–029 | added | 26 → 29 rows | **PASS** |
| Duplicate schema objects created by reconciliation | zero | zero (metadata insert only) | **PASS** |
| Public base tables | all present | 33 tables, RLS enabled 33/33 | **PASS** |
| Policy count | grew with 020–024 | 127 policies | **PASS** |
| RBAC catalogue | 9 roles / 75 permissions / 199 grants | exactly 9 / 75 / 199, 0 duplicates | **PASS** |
| Functions from 016–024 (`can`, `session_profile`, `admin_profiles`, `session_user_role`, `public_settings`, `admin_settings`, `delete_media_asset`, `restore_page_revision`, `guard_page_workflow`, `guard_profiles_privileges`, `guard_profiles_account_fields`, `stamp_settings_audit_columns`, `snapshot_page_revision`, `notify_new_contact_message`, `notify_security_event`, …) | all exist | 17/17 present in `pg_proc` | **PASS** |
| Triggers from 016–024 (`profiles_guard_privileges`, `profiles_guard_account_fields`, `profiles_audit_privileged_change`, `pages_workflow_guard`, `pages_snapshot_revision`, `pages_stamp_actor`, `system_settings_stamp_updated_by`, `media_assets_stamp_actor`, `contact_messages_notify_admin`, `audit_logs_notify_security`) | all exist | 16/16 present in `pg_trigger` | **PASS** |
| Migration 023 | not rewritten | file untouched; only its broken constraint replaced by 025 | **PASS** |
| Migrations 016–019 | intact | files unchanged, live objects verified | **PASS** |

### Defects found and fixed in this phase

1. **025 was only half applied.** `media_assets_path_length` existed, `media_assets_path_charset`
   did not. 025 was rewritten with catalog probes (Postgres has no
   `ADD CONSTRAINT IF NOT EXISTS`) and the missing constraint was applied.
   Verified: both constraints now present, definition
   `CHECK ((storage_path ~ '^[A-Za-z0-9._/-]+$'::text))`.
2. **`anon` and `authenticated` held TRUNCATE / TRIGGER / REFERENCES on 36 public
   tables, including `audit_logs`.** TRUNCATE is not governed by RLS. Not
   reachable through PostgREST, so this was defense-in-depth, not a live hole.
   Fixed by migration 026; verified `trunc=0` afterwards.
3. **`audit_logs` carried UPDATE and DELETE table grants for `anon`/`authenticated`.**
   No policy allowed those commands, so RLS already blocked them; 026 revokes
   them so append-only holds at the privilege layer too. Verified
   `anon_audit=INSERT,SELECT`.
4. **`profiles_admin_delete` used `USING (is_admin())` and `profiles_update_admin`
   used `WITH CHECK (true)`** (pre-Part-04 design). Both re-expressed through
   `can()`: delete → `can('users','delete')` (super_admin only), write →
   `can('users','edit')`. This makes an admin's ability to delete a profile
   impossible at the database, not only in the server action.
5. **Role changes were decided by role name, not by RBAC.** `guard_profiles_privileges()`
   accepted any `admin` or `super_admin` actor. 026 replaces it with a strictly
   stronger version that also requires `can('roles','manage')`. Migration 016's
   original file is untouched and every pre-existing check is preserved.

## 2. `/admin/users` — user management (Phase 3)

Files: `app/admin/users/page.tsx`, `app/admin/users/[id]/page.tsx`,
`app/admin/users/actions.ts`.

| Capability | Permission required (server) | Database backstop | Result |
| --- | --- | --- | --- |
| List/search/paginate accounts | `users:view` | `admin_profiles()` raises 42501 for non-admins | **PASS** |
| View one account | `users:view` | same | **PASS** |
| Edit permitted fields (`full_name`, `avatar_url`) | `users:edit` | `profiles_update_admin` `WITH CHECK can('users','edit')` | **PASS** |
| Deactivate account (`status=suspended`) | `users:manage` | `guard_profiles_account_fields()` requires admin | **PASS** |
| Reactivate account (`status=active`) | `users:manage` | same | **PASS** |
| Delete profile | `users:delete` (super_admin only) | `profiles_admin_delete USING can('users','delete')` | **PASS** |
| Assign / change role | `roles:manage` (super_admin only) | hardened `guard_profiles_privileges()` | **PASS** |
| Create account | `users:create` | **NOT AVAILABLE** — provisioning a sign-in needs the Supabase Auth Admin API (service-role key), which this deployment deliberately does not hold. The page states this instead of faking it. | **OWNER ACTION REQUIRED** |
| Full account deletion (auth user) | — | same reason; only the profile row is removed | **OWNER ACTION REQUIRED** |

Untrusted-input rules, each verified by an executed statement:

| Attack | Expected | Actual | Result |
| --- | --- | --- | --- |
| Client role attempts to set own role to `super_admin` | rejected | `raise(42501)` | **PASS** |
| Client role attempts to read another account's roster via `admin_profiles()` | rejected | `raise(42501)` | **PASS** |
| Client role attempts `update profiles set full_name=…` on another user | 0 rows | `rows:0` | **PASS** |
| Admin attempts to delete another profile | rejected | `raise(42501)` (new policy) | **PASS** |
| Admin attempts a role change | rejected | `raise(42501)` (`roles:manage` missing) | **PASS** |
| Submitted form role/status values | never read | `updateUserAction` reads only `full_name`/`avatar_url`; status and role have separate authorized actions | **PASS (code)** |
| Submitted account id | shape-validated only | UUID regex; authorization comes from RLS + `can()` | **PASS (code)** |

Super Admin safety:

| Rule | Enforced by | Result |
| --- | --- | --- |
| Normal admin cannot grant `super_admin` | 016 guard (`only a super admin may grant or revoke the super_admin role`) | **PASS** |
| Normal admin cannot revoke `super_admin` | same guard | **PASS** |
| Ordinary users cannot change their own role | `profiles_update_self` WITH CHECK role unchanged + guard | **PASS** |
| Ordinary users cannot change another user's role/status | RLS + both guard triggers | **PASS** |
| client/developer cannot obtain admin privileges | zero grants; verified in the matrix | **PASS** |
| Dangerous actions require confirmation | typed `DISABLE` / `GRANT` / `DELETE` | **PASS (code)** |
| Dangerous actions are audited | `admin_user_updated`, `admin_user_disabled`, `admin_user_enabled`, `admin_user_deleted`, `role_changed`, `role_assigned` | **PASS (code)** |
| Last active super admin cannot be disabled/demoted/deleted | action refuses when `admin_profiles()` shows ≤1 active super admin | **PASS (code), NOT TESTED against a live third account** |

## 3. `/admin/roles` — role assignment (Phase 4)

| Test | Expected | Actual | Result |
| --- | --- | --- | --- |
| Matrix rendered from `role_permissions` | yes | 9 role rows × 8 action columns, resource list from DB | **PASS (build)** |
| User count per role | real counts | derived from `admin_profiles()` | **PASS (build)** |
| Assignment UI visible only with `roles:manage` | hidden for `admin` | `can('roles','manage')` = false for admin → **verified in matrix test** | **PASS** |
| `super_admin` may assign roles | allowed | `can('roles','manage')` = T | **PASS** |
| Frontend is not the authority | DB re-checks | hardened 016 guard raises 42501 | **PASS** |

## 4. `/admin/settings` — settings management (Phase 5)

Files: `app/admin/settings/page.tsx`, `app/admin/settings/actions.ts`,
migration 027.

| Section | Keys seeded | Public/private | Result |
| --- | --- | --- | --- |
| Company | 6 | 5 public, 1 private (`company.registration`) | **PASS** |
| Contact | 6 | all public | **PASS** |
| Branding | 5 | all public | **PASS** |
| Social media | 5 | all public | **PASS** |
| Email | 3 | all private | **PASS** |
| Notifications | 4 | all private | **PASS** |
| SEO defaults | 5 | all public | **PASS** |
| System configuration | 1 | private | **PASS** |
| Total | **35** (26 public, 9 private) | | **PASS** |

| Test | Expected | Actual | Result |
| --- | --- | --- | --- |
| Anon reads `admin_settings()` | rejected | `raise(42501)` / REST `401 settings access requires authorization` | **PASS** |
| Client reads `admin_settings()` | rejected | `raise(42501)` | **PASS** |
| Anon reads `public_settings()` | only `is_public=true` | 26 rows = exactly the 26 public rows; private count 9, never returned | **PASS** |
| Content manager writes a setting | 0 rows | `rows:0` | **PASS** |
| Admin writes a setting | allowed (`settings:edit`) | `rows:1` | **PASS** |
| Super admin writes a setting | allowed | `rows:1` | **PASS** |
| Anon PATCH `system_settings` over REST | must not change data | HTTP 204 but read-back shows `company.phone` still `""` and `notifications.enabled` still `true` — RLS filtered it | **PASS** |
| Settings cannot become a secret store | table-level refusal | 027 adds `system_settings_value_not_secretish` CHECK rejecting `service_role`, `secret_key`, `api_key`, `password`, `bearer …` | **PASS** |
| Unknown/injected keys | impossible | `saveSettingsAction` iterates the DB catalogue, never the submitted form; keys matching `secret|password|token|credential|service_role|api_key` are skipped | **PASS (code)** |
| Audit of edits | `settings_updated` | written with key names only, never values | **PASS (code)** |
| Settings actually enforced | 2 settings | `notifications.enabled` + `notifications.contact_messages` gate `notify_new_contact_message()`; `system.media_max_upload_mb` is the upload ceiling | **PASS (see P05 doc for the executed gate test)** |

## 5. `/admin` dashboard (Phase 6)

File: `app/admin/page.tsx`, queries in `lib/admin/queries.ts`.

| Panel | Source | Result |
| --- | --- | --- |
| Overview metrics | real counts (`products`, `profiles`, `pages`, `media_assets`, `contact_messages`, `newsletter_subscribers`) | **BUILD PASS / authenticated render NOT TESTED** |
| Statistics | each statistic documents its source; visitors, revenue, projects, clients, AI activity have no collector and render `No data yet` / `Tracking not configured` | **PASS (no fabricated analytics)** |
| Recent Activity | `audit_logs` through `is_admin()`-gated SELECT | **PASS** |
| System Health | status only (DB reachable, auth configured, storage buckets present, RBAC rows present, audit active, env by NAME only) | **PASS (no secret values)** |
| Notifications | `admin_notifications` + unread count | **PASS** |
| Quick Actions | links gated by `getPermissionMatrix()` / `can()` server-side too | **PASS** |
| Unauthorized role reaching `/admin` | redirect to `/unauthorized` | **PASS (code), NOT TESTED live (no session)** |
| Unauthenticated `/admin` | redirect to `/login?next=/admin` | **PASS — HTTP 307 observed** |

## 6. `/admin/security` and audit logs (Phase 7)

| Item | Status | Result |
| --- | --- | --- |
| Login history (`login`, `logout`, `login_failed`, `password_reset_requested`) | written by `app/auth/actions.ts` into `audit_logs` | **PASS (writing verified in Part 03)** |
| Security events | `security_event` rows exist | **PASS — 1 genuine row present** |
| Audit list search / event-type / actor / date / severity filters + pagination (25/page) | implemented in `app/admin/security/audit-logs/page.tsx` | **BUILD PASS / render NOT TESTED** |
| UPDATE or DELETE controls in the UI | none exist; additionally impossible at the database | **PASS** |
| Sessions panel | `NOT AVAILABLE` — Supabase Auth sessions are not exposed through this architecture | **PASS (honest state, nothing fabricated)** |
| Devices panel | `NOT AVAILABLE` for the same reason | **PASS (honest state)** |
| IP / user-agent columns | stored from `requestContext()` when available | **PASS** |
| Normal staff/client reading audit logs | rejected | **PASS — `admin_profiles()`/`audit_logs` SELECT is `is_admin()`-gated; client read returned 0 rows / raise** |

## 7. Notifications (Phase 12)

| Test | Expected | Actual | Result |
| --- | --- | --- | --- |
| Real contact submission creates an admin notification | 1 new row | `notif_on_contact=1` | **PASS** |
| `notifications.enabled` / `notifications.contact_messages` gate it | 0 new rows when false | `notif_when_off=0` | **PASS** |
| Security event notification trigger `notify_security_event()` | exists on `audit_logs` | trigger `audit_logs_notify_security` present | **PASS (existence), render NOT TESTED** |
| Recipient forgery | impossible | `admin_notifications` INSERT is `can('notifications',…)`-gated; `target_role`/`target_user` are FK-checked and stamped server-side | **PASS (schema)** |
| Read scoping | only authorized admins | RLS SELECT policy via `can('notifications','view')` | **PASS (schema)** |
| Test notifications left behind | none | `admin_notifications` count = 0 | **PASS** |

## 8. Audit events (Phase 13)

| Event | Emitted by | Verified |
| --- | --- | --- |
| `admin_user_updated` / `_disabled` / `_enabled` / `_deleted` | `app/admin/users/actions.ts` | code path + permission tests |
| `role_assigned` / `role_changed` | same | code path |
| `permission_changed` | not implemented (grants change only via migrations) | **FUTURE ENHANCEMENT** |
| `settings_updated` | `app/admin/settings/actions.ts` | code path |
| `media_deleted` | `delete_media_asset()` **and** the server action | **PASS — `audited=1` executed** |
| `page_created` / `page_updated` / `page_submitted` / `page_approved` / `page_published` / `page_unpublished` / `page_archived` | `guard_page_workflow()` inserts `page_<status>` | **PASS (P05 doc)** |
| `revision_created` / `revision_restored` | `snapshot_page_revision()` / `restore_page_revision()` | **PASS (P05 doc)** |
| Actor cannot be forged | `audit_logs` INSERT policy `actor_user_id is null or = auth.uid()` | **PASS — forged actor raised 42501** |
| Append-only | no UPDATE/DELETE policy + 026 privilege revoke | **PASS — both raise 42501** |
| Metadata sanitized | `lib/authz/audit.ts` REDACTED regex + allow-listed scalars | **PASS (code), no secret in the single live row** |

## 9. RBAC matrix (executed, not inspected)

44 assertions evaluated through `public.can()` under simulated identities.
Result: **44/44 matched, 0 mismatches** (`P04MATRIX tested=44 mismatches=[NONE]`).

Highlights of what was proven false as well as true:

| Assertion | Result |
| --- | --- |
| `admin` → `roles:manage`, `users:delete`, `settings:manage` | **F** (correct) |
| `super_admin` → all of the above | **T** |
| `content_manager` → `users:view`, `roles:manage`, `settings:edit`, `media:delete` | **F** |
| `product_manager` → `pages:edit`, `users:view` | **F** |
| `sales_manager` / `support_manager` → `pages:publish`, `media:delete`, `users:view` | **F** |
| `developer` → every tested resource | **F** (developer holds **zero** grants) |
| `client` → every tested resource | **F** (client holds **zero** grants) |
| `editor` → `pages:publish` | **T** |

Authoritative grant map for the privileged resources:

```
roles:manage            -> super_admin
settings:manage         -> super_admin
settings.security:manage-> super_admin
settings:edit           -> admin, super_admin
users:create            -> admin, super_admin
users:edit              -> admin, super_admin
users:manage            -> admin, super_admin
users:delete            -> super_admin
```

## 10. Route protection and app-layer results

| Test | Expected | Actual | Result |
| --- | --- | --- | --- |
| GET `/admin` unauthenticated | 307 → `/login?next=%2Fadmin` | exactly that | **PASS** |
| GET `/admin/users` | 307 → login | `next=%2Fadmin%2Fusers` | **PASS** |
| GET `/admin/roles`, `/admin/settings`, `/admin/security`, `/admin/security/audit-logs`, `/admin/cms`, `/admin/media`, `/app` | 307 → login | all 307 with correct `next` | **PASS** |
| Anon REST read of `profiles` | filtered | `200 []` | **PASS** |
| Anon REST insert into `profiles` with `role=super_admin` | rejected | `401 42501 RLS` | **PASS** |
| Anon REST PATCH/DELETE `audit_logs` | rejected | `401 42501` with "GRANT UPDATE/DELETE" hint (026) | **PASS** |
| Anon REST POST `pages`, `media_assets` | rejected | `401 42501` | **PASS** |
| Anon REST GET `role_permissions` | filtered | `200 []` | **PASS** |
| Authenticated page render of all 8 admin routes | — | **NOT TESTED**: no owner credentials were available and none were requested | **NOT TESTED** |
| Server Action execution as an authenticated but unauthorized role | — | **NOT TESTED** (same reason); the equivalent database gate is proven above | **NOT TESTED** |

## 11. Data integrity after the battery

| Table | Count | Note |
| --- | --- | --- |
| `media_assets` | 0 | smoke artifact removed, all test rows rolled back |
| `pages` / `page_sections` / `page_revisions` | 0 / 0 / 0 | CMS test content created only inside aborted transactions |
| `admin_notifications` | 0 | no fake notifications remain |
| `system_settings` | 35 | 027 catalogue; 26 public, 9 private |
| `audit_logs` | 1 | one genuine `security_event` (site-URL unconfigured) produced by the real forgot-password flow in Part 03; retained, not fabricated |
| `profiles` | 2 | unchanged (1 admin, 1 staff); no role changed |
| `auth.users` | untouched | no test accounts created |
| `storage.objects` | 0 | probe objects existed only inside aborted transactions |
| `contact_messages` | 1 | pre-existing genuine enquiry (dated 2026-08-04), not test data |
| RLS | 33/33 enabled | `profiles_guard_privileges` and `profiles_guard_account_fields` active |

## 12. Build / TypeScript / Lint

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | exit 0, no output |
| `npm run lint` | clean, 0 errors 0 warnings |
| `npm run build` | compiled successfully; all `/admin/*` routes present |

## 13. Remaining owner actions (Part 04)

1. `NEXT_PUBLIC_SITE_URL` and the Supabase Auth redirect allow-list
   (`<production-origin>/auth/callback`) — carried over from Part 03; the app
   refuses to invent an origin and records a `security_event` instead.
2. User provisioning / true account deletion require a server-side
   service-role credential. Adding one is a deliberate security decision and was
   not taken silently.
3. Deactivation does not revoke an already-issued Auth session (no Admin API).
4. `permission_changed` audit event and multi-device session revocation:
   **FUTURE ENHANCEMENT**.
5. Migrations 001–015 exist in the project history but not as files in
   `supabase/migrations/`; a local `supabase db reset` would therefore fail.
   Export them to the repo.
