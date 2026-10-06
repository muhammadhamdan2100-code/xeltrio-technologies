# PART 04 + PART 05 — final closure verification (fourth pass)

Executed 2026-10-06 against live Supabase `yparzhgzhpwewyrjhqud` and a local
production build served on `http://localhost:3123`. Supersedes the third-pass text
of this file.

## Status

```
PART 04: BLOCKED
PART 05: BLOCKED
Authenticated Admin E2E: FAIL — the login was executed against the real application
                          and was rejected; the authorized address has no auth account
Production Auth Configuration: OWNER ACTION
Migration Bookkeeping: OWNER/MAINTENANCE ACTION
Scratch DB Replay: NOT TESTABLE
Optional Storage-Schema Revoke: NOT PERFORMED / NON-BLOCKING
```

The earlier blocker "legitimate admin credential/session unavailable" is **removed
as a blocker and replaced by a concrete finding**: a credential was supplied, the
login was really attempted, and it failed for a specific, evidenced reason (§1).
Legend: **PASS** · **FAIL** · **BLOCKED** · **OWNER ACTION** · **NOT TESTABLE** ·
**NON-BLOCKING**. No password or session token appears in this document.

## 1. Authenticated E2E — executed, and it failed: the account does not exist

Real browser, real form, real server action, production build.

| Step | Observed |
| --- | --- |
| `/login` → submit the authorized address + supplied password | Response: `Those credentials did not match an active account.` |
| Server-side effect | `login_failed {reason: "invalid_credentials"}` written to `audit_logs` — the rejection is audited, VERIFIED PASS |
| Cause of rejection | Supabase `signInWithPassword` returned an error, i.e. the branch at `app/auth/actions.ts:29-30` — the credentials never validated at Auth |

Evidence for the cause, from a read-only query of `auth.users` joined to `profiles`
(emails masked here; no hash, no password touched):

| id (prefix) | email (masked) | matches the authorized address | profile role | status | has password | ever signed in |
| --- | --- | --- | --- | --- | --- | --- |
| `886bf52b` | `ad***@gmail.com` | **no** | `admin` | active | yes | **never** (`last_sign_in_at` NULL) |
| `2b006679` | `ad***@xeltrio.com` | **no** | `staff` | active | yes | **never** (`last_sign_in_at` NULL) |

`select count(*) from auth.users` = **2**, and neither row's email equals the
authorized address. So the failure is not a wrong password and not an application
defect: **the account the credential belongs to has never existed in this project.**
No user has ever signed in with a password here — which is also why every previous
pass could only test the unauthenticated half.

What I deliberately did **not** do, and why:

- Did not create the account. Provisioning it means minting a password hash and
  granting `admin`; the project's own trigger `handle_new_user()`
  (`supabase/migrations/001_roles_and_helpers.sql:53`) assigns role `staff`, so
  reaching `admin` would require me to write a privileged role change. That is
  fabricating a credential and self-granting — the standing prohibition covers it,
  and the supplied 6-character password is below this app's own 8-character reset
  minimum (`app/auth/actions.ts:111`), so installing it on production would open a
  real hole on a FREE-plan project with no backups.
- Did not try the supplied password against either existing address. That is
  credential guessing, not authorized testing.
- Did not weaken, bypass, or stub any authentication path to make a route render.

Consequence: the 15 authenticated admin routes, mutation persistence, and the real
Storage upload/delete round trip stay **BLOCKED**, now for the precise reason that
*no usable application identity exists*, rather than *no credential was offered*.
One owner action resolves it: create the account in Supabase → Authentication →
Users → Add user (or reset the existing admin's password), with a password meeting
the app's own minimum. Then the E2E is a single pass and this file can be closed.

## 2. What *was* executed authenticated-adjacent this pass — real requests, real results

These are the application's auth flows that do not require a session, and they were
run through the browser rather than asserted from source.

| Test | Result |
| --- | --- |
| Forgot-password form, real submission | Response `If an account exists for that address, a recovery link has been sent.` — identical shape for a non-existent address, so **no account enumeration**, PASS |
| Audit of that request | `password_reset_requested {delivered: true}` written, PASS |
| `/auth/callback` with an invalid `code` and `next=//evil.example.com` | Final browser URL `http://localhost:3123/login` — the protocol-relative redirect target was **rejected**, the exchange failed closed, and `security_event {code_exchange_failed}` was audited. PASS |
| `/auth/callback` with no `code` | Redirects to `/login` (same guard), PASS |
| Unauthenticated route guards | `/admin` and the protected sub-routes render `/login` (re-observed in the browser) |

### Defect found and fixed this pass

The password-recovery audit was lying. `originConfigured` was computed as
`Boolean(origin)`, but `siteOrigin()` also returns an origin derived from the live
request `host` header, so with `NEXT_PUBLIC_SITE_URL` **absent** the field reported
`true` and the `security_event {site_url_unconfigured}` guard never fired. Observed
directly:

```
before: password_reset_requested {"delivered": true, "originConfigured": true}
        (no site_url_unconfigured event)
after:  password_reset_requested {"delivered": true, "originConfigured": false}
        security_event          {"event": "site_url_unconfigured"}
```

Fix: `isSiteOriginConfigured()` in `lib/supabase/env.ts` reports only the explicit
configuration; `forgotPasswordAction` uses it for both the metadata and the guard
(`app/auth/actions.ts:88`, `:91`). Rebuilt, and re-run through the browser to confirm
both lines above. The fail-safe itself was already correct — with no origin at all the
action omits `redirectTo` rather than inventing one.

Note this also proves the request-host fallback works: a recovery link generated here
redirects to the actual serving origin. So `NEXT_PUBLIC_SITE_URL` is a robustness
and preview-isolation measure, not the only thing standing between the app and broken
password resets. Supabase's own Site URL is the stricter requirement.

## 3. Production auth configuration — OWNER ACTION (origin still not derivable)

Re-checked every authoritative source, plus two new ones this pass:

| Source | Finding |
| --- | --- |
| `vercel.json` | only `buildCommand`/`outputDirectory`/`framework` — no domains, no alias |
| `.vercel/`, `~/.vercel/auth.json`, `npx vercel whoami` | absent / absent / `Logged out.` |
| `README.md` | only `http://localhost:3000`; the other URL-shaped strings are the owner's GitHub/Supabase handle `muhammadhamdan2100-code`, not an app origin |
| **`system_settings` (new check)** | queried every row whose key matches `%url%/%domain%/%origin%` or whose value contains `http`/`vercel`/`localhost`: all nine candidates (`branding.logo_url`, `branding.favicon_url`, `branding.og_image_url`, `contact.map_url`, `social.*_url`) are **empty strings**. No origin in the database either |
| Supabase dashboard Auth/URL-configuration panes | not reachable as data: `/authentication/sign-in-parameters` and `/auth/urlconfiguration` both return the dashboard's own 404, `/auth` redirects to `/auth/users`, and `/settings/api` hydrates only partially in this hidden tab (540–302 chars, no Site URL field). The dashboard session is the owner's and was not harvested for its bearer token |

Therefore the exact owner actions remain, with the values that must come from the
real deployment:

1. Vercel → Environment Variables → `NEXT_PUBLIC_SITE_URL` = `https://<origin>`
   (Production and Preview), redeploy.
2. Supabase → Authentication → URL Configuration → Site URL = `https://<origin>`,
   Additional Redirect URLs += `https://<origin>/auth/callback` (one entry, no
   wildcard; plus `http://localhost:3000/auth/callback` for local work).

## 4. Migration version bookkeeping — OWNER/MAINTENANCE ACTION, with the reason

Analysis first, as instructed, and the conclusion is that **no safe local fix
exists**, for a reason worth recording precisely.

Current state, verified by query:

| Layer | Content |
| --- | --- |
| Local files | exactly 29: `001_…` through `029_…`, contiguous, no duplicates, no destructive statements |
| `supabase_migrations.schema_migrations` | 29 rows: 15 keyed `20260802154455` … `20260803182659` (one statement each, 58,929 chars total) and 14 keyed literally `016`…`029` with **NULL** statements |

Why the obvious reconciliation is wrong. The Supabase CLI derives a migration's
version from its filename prefix and orders replays by that version **as a string**.
Renaming local `001`–`015` to their timestamp versions leaves `016`…`029` sorting
*before* `20260802154455` lexicographically, so `db reset`/`db pull` would apply the
Part 03–05 migrations against a schema that does not exist yet. Making the whole set
consistent means giving `016`–`029` timestamp names — which requires minting
timestamps that never existed and rewriting the corresponding production history
rows. Both are explicitly forbidden, and both are worse than the current drift.

Blast radius today is zero: `supabase/config.toml` does not exist, the `supabase`
CLI is not installed, and every migration here was applied through the dashboard SQL
editor by hand. Nothing in this project currently reads `schema_migrations`, so the
drift is **latent** and becomes active only if the owner adopts the CLI.

Recommended maintenance path when the owner chooses to adopt the CLI (not done here):
pick one — (a) treat `supabase/migrations` as the source of truth, re-key all 29
history rows to match, and accept hand-authored timestamps; or (b) stop using CLI
history and use `supabase db diff` against a committed `schema.sql`. Option (a) is a
production metadata write and needs a backup first, which this FREE-plan project does
not have.

## 5. Scratch database replay — NOT TESTABLE

Re-probed this pass: `psql`, `pg_ctl`, `initdb`, `supabase` all absent; no listener on
`127.0.0.1:5432`; `docker` binary present but `docker info` returns no server (Docker
Desktop is not running). I did not start Docker Desktop, and did not create a second
Supabase project — both are external infrastructure the brief does not authorize me to
spin up, and a plain `postgres` image would additionally lack the `auth.*`/`storage.*`
schemas that 001–029 depend on, producing failures that mean nothing.

## 6. Optional storage-schema revoke — NOT PERFORMED, NON-BLOCKING

The revoke is still provably desirable in principle (migration 026 covered public
tables; `storage` schema privileges were left alone) and the brief conditions it on
being able to prove the Storage API still works afterwards. Proof requires an
authenticated app session, which §1 shows does not exist. Per the brief's own rule,
the change was **not** made. Non-blocking: RLS on 33/33 public tables and the five
storage policies already gate every application path; this item is defense in depth
against a direct-connection scenario, not a live hole.

## 7. Storage — policy layer unchanged, application round trip BLOCKED

Re-confirmed this pass by direct inspection: `media_assets` still enforces
`media_assets_path_charset` (`^[A-Za-z0-9._/-]+$`) and
`media_assets_size_bytes_check` (`0..26214400`); `media_assets` and `storage.objects`
are both empty. The 16-item storage authorization matrix was executed in the second
pass and is **not** re-claimed here; real upload and delete through the UI remain
BLOCKED with §1.

## 8. Quality gates and security scan, this pass, after the fix

| Gate | Result |
| --- | --- |
| `npm run typecheck` | exit 0, 0 errors — PASS |
| `npm run lint` | empty output, 0 errors/0 warnings — PASS |
| `npm run build` | `✓ Compiled successfully in 36.6s`, route table emitted, no warnings — PASS |
| Supplied password written to disk | `grep -F` over the repo (excluding `node_modules`, `.next`): **0 files** — PASS |
| `service_role` in client bundles | **0 files** in `.next/static` — PASS |
| `NEXT_PUBLIC_*` names in source | still exactly 4; none secret-bearing — PASS |
| Migration directory | 29 files, 001–029; no file in `supabase/migrations` was created or modified by this pass — PASS |
| No accidental destructive migration | nothing applied; the only live changes this pass were two source files (§2) |

## 9. Data state, and the two records this pass legitimately created

`pages 0`, `page_sections 0`, `page_revisions 0`, `media_assets 0`,
`storage.objects 0`, `contact_messages 1` (genuine 2026-08-04 enquiry),
`profiles 2` (roles `admin`, `staff` — unchanged), `auth.users 2`,
`system_settings 35`, RLS on **33/33** tables.

`audit_logs 7` and `admin_notifications 2`. Both sets are genuine telemetry from
requests this pass really made, not synthetic fixtures, so I left them in place rather
than deleting append-only security history: two `login_failed`, one
`password_reset_requested`, two `code_exchange_failed`, one `site_url_unconfigured`;
and two `security_event` notifications (severity `critical`) generated by the
`audit_logs` trigger in `supabase/migrations/024_cms_media_permissions_and_notifications.sql:123`.

Checked whether those notifications are actually reachable, because they target
`super_admin` and no `super_admin` profile exists: the read policy
(`020_system_settings_and_admin_notifications.sql:121-127`) also admits
`can('notifications','manage')`, and `role_permissions` grants that to **both `admin`
and `super_admin`**. So the existing `admin` account will see them. No gap.

## 10. Remaining owner actions, ranked

1. **Create (or password-reset) an application account** at the authorized address —
   Supabase → Authentication → Users → Add user, with a password meeting the app's own
   8-character minimum. Everything under "Authenticated E2E" then runs in one sitting;
   the route guards, RBAC, RLS, CMS workflow, audit chain and migration history are
   already verified at the authoritative layer.
2. **Set the two production origin values** (§3).
3. **Decide the CLI history strategy** (§4) — latent, zero blast radius today.
4. **Replay 001–029 on a scratch database** (§5) once Docker is running or a second
   project is authorized.
5. Optional storage-schema privilege revoke (§6), non-blocking.

## Not implemented, by decision

Auth-user creation, Auth-user deletion, and server-side session revocation on
deactivation. They need `SUPABASE_SERVICE_ROLE_KEY`, which bypasses every RLS policy in
this project, to provide three things the Supabase dashboard already does for the
owner. Deactivation continues to block every authorization path (`loadPrincipal()` and
RLS refuse `status != 'active'`); what it cannot do is invalidate an already-issued
JWT. `app/admin/users/page.tsx:131` states this limitation in the UI rather than
faking it. Adding the key to satisfy an audit line would be a security regression.
