# PART 03 — SECURITY VERIFICATION EVIDENCE (executed)

Date: 2026-10-05 · project `yparzhgzhpwewyrjhqud` · all results below were **executed**, not inferred.

## A. Live catalog read-back (018 / 019)

| Object | Live state |
|---|---|
| `profiles` columns | 9: `id, full_name, role, created_at, updated_at, "xeltrio technologies Org", avatar_url, status, metadata` |
| `profiles.status` | `user_account_status` enum, all rows `active` |
| `profiles.metadata` | `jsonb`, all rows `{}` |
| Functions (Part 03 set) | **7 present**: `session_user_role`, `guard_profiles_privileges`, `guard_profiles_account_fields`, `can`, `session_profile`, `admin_profiles`, `audit_profile_role_change` |
| `profiles` triggers | **4**: `profiles_guard_privileges` (016), `profiles_guard_account_fields` (018), `profiles_audit_privileged_change` (019), `set_profiles_updated_at` |
| `audit_logs` | exists, **4 indexes** (PK + created_at/actor/action), **2 policies** (INSERT, SELECT), no UPDATE/DELETE policy |
| RBAC | `roles` **9**, `permissions` 54, `role_permissions` **135**, duplicates 0, orphans 0 |
| Enum `user_role` | 10 values incl. `editor` and the 5 new roles |
| RLS | tables with RLS off: **NONE** (23/23) · policies total **98** |

## B. Migration 016 regression tests — as real operations, inside a transaction, aborted at the end

Row counts were captured with `GET DIAGNOSTICS`, because RLS denies by **filtering** (0 rows) rather than raising — a plain error-only test would have mislabeled correct behavior as a failure.

| Test | Result | Evidence |
|---|---|---|
| **T3** owner updates own `full_name` | **ALLOWED — correct** | `T3_ownRows=1` |
| **T4** owner sets own `role='super_admin'` | **REJECTED — correct** | `role changes require administrator privileges` (trigger `guard_profiles_privileges`) |
| **T5** owner updates **another** user's profile | **BLOCKED — correct** | `T5_crossUserRows=0` (row invisible to that policy) |
| **T6** anonymous UPDATE / DELETE on profiles | **BLOCKED — correct** | `T6_anonUpd=0`, `T6_anonDelete=0` |
| **P8** self `status` change | **REJECTED** | `account status and metadata require…` (018 trigger) |
| **P8** self `metadata` change | **REJECTED** | same guard |
| **G** forged identity INSERT (existing id) | **REJECTED** | `new row violates row-level security policy` |
| **A4** audit INSERT with **another** actor id | **REJECTED** | same |

## C. RBAC bypass + positive tests (executed)

`staff` and `admin` are the only real profiles, so role-specific checks were run against `role_permissions` directly and `can()` under live sessions.

| Check | Result |
|---|---|
| `can()` as **staff** → `users:view`, `settings.security:manage`, `products:delete` | **f / f / f** — no grants (A, B, E, H behaviour) |
| `can()` as **anon** → `site.content:publish`, `users:manage` | **f / f** |
| `can()` as **admin** → `users:view`, `settings.security:manage`, `site.content:publish` | **t / f / t** — admin is NOT super_admin ✓ |
| `admin_profiles()` as **staff** | **REJECTED** `administrator privileges required` (function-level gate) |
| `admin_profiles()` as **admin** | **2 rows** ✓ (after fixing a real `varchar→text` return-type defect found by this test) |
| `session_profile()` as **admin** | **1 row** ✓ |
| admin attempts `UPDATE staff → super_admin` | **REJECTED** `only a super admin may grant or revoke the super_admin role` ✓ |
| Matrix for `client` / `developer` on `users`,`settings.security`,`products` | **no grants present** ✓ |
| `content_manager` on `products` | **view only** ✓ (no create/edit/delete/publish) |
| `product_manager` on `products` | create/edit/delete/publish/export ✓; on `users`/`settings.security` — none ✓ |

## D. Audit log verification

- **Append-only proven**: as `staff`, `UPDATE audit_logs` → **0 rows**, `DELETE` → **0 rows**, `SELECT` → **0 rows visible**; forged-actor INSERT rejected.
- **Real event captured end-to-end**: `GET /auth/callback?code=invalid` produced committed row `action=security_event`, `resource_type=auth`, `actor_user_id=NULL`, `ip=::ffff:127.0.0.1`, `user_agent=curl/8.21.0`.
- **Redaction proven in production data**: the request's `code` value does **not** appear in `metadata` — the allow-list filter stripped it.
- No historical/fake events were inserted. The single row above is genuine application output and was **left in place** (audit history is not rewritten).

## E. Route + proxy behaviour (running production build, port 3717)

| Request | Result |
|---|---|
| `/admin`, `/admin/users`, `/admin/settings`, `/app` unauthenticated | **307 → `/login?next=…`** ✓ |
| `/login?next=https://evil.example` | hidden field `value="/admin"` — **external target rejected** ✓ |
| `/login?next=//evil.example` | normalised to `/evil.example`, same-origin path — **protocol-relative rejected** ✓ |
| `/login`, `/forgot-password`, `/reset-password`, `/unauthorized` | **200** ✓ |
| `POST /logout` | 307 → `/` ✓ · `GET /logout` **405** ✓ |
| `/auth/callback?code=invalid` | 307 → `/login`, no crash, event audited ✓ |
| Redirect loop check | `/admin/settings` chain terminates at `/login` **200** ✓ |
| Headers on `/login` | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, `Cache-Control: no-store` |

## F. Source security audit

- **No** `service_role` / `SUPABASE_SERVICE_ROLE_KEY` reference anywhere in `app/`, `lib/`, `components/`, `proxy.ts`, `.env.local`.
- **No** client-supplied `role`/`permission`/`userId`/`status` is ever read from a form (`grep` → none).
- **No** `dangerouslySetInnerHTML` anywhere in `app/`, `components/`, `lib/`.
- `getSession()` appears **only** in `proxy.ts` as an early guard; every authorization decision uses `getUser()` + `public.can()` + RLS.
- `WITH CHECK (true)` appears once — `profiles_update_admin` (016), where `USING is_admin()` scopes the rows and the 018 trigger makes `id` immutable: intentional and layered, documented.
- `.env.local` is ignored (`.gitignore` `.env*`, `.env.local`). The publishable key appears only in `.next/` build artifacts (ignored, client-side by design); no secret exists in any source file.

## G. Final integrity

`profiles`: **staff=1, admin=1, super_admin=0**, `full_name` still NULL on both rows (no test data persisted), `status=active`, `metadata={}` · RLS off: **NONE** · policies **98** · `roles` 9 · `grants` 135.

## H. Validation

`npm run build` **PASS** (compiled, 0 errors/warnings) · `npx tsc --noEmit` **PASS** · `npm run lint` **PASS (0 errors, 0 warnings)**.

## I. Not verified / open

- **Password login success and logout with a real session** — no user credentials exist in this environment and none were created.
- **Reset email delivery + PKCE completion** — needs a real mailbox, `NEXT_PUBLIC_SITE_URL`, and the Supabase Auth redirect allow-list.
- Rate limiting (Supabase Auth config), CSP (deliberately not added), Vercel env vars, private storage buckets.

---

# FINALIZATION PASS (2026-10-05, Phases 1–16)

## Baseline (Phase 1)

next `16.2.12` · react `19.2.4` · `@supabase/ssr` `^0.12.7` · `@supabase/supabase-js` `^2.112.0`.
Present: `proxy.ts`; `lib/supabase/{env,server,client}.ts`; `lib/authz/{permissions,guards,audit}.ts`; `app/auth/actions.ts`; `app/{login,forgot-password,reset-password,unauthorized}`; `app/auth/callback/route.ts`; `app/logout/route.ts`; `app/admin/{layout,page,users,settings,audit,content,products,messages,account}`; `app/app/{layout,page}`. Migrations `016`–`019` on disk. No `.vercel` directory.

## Defect found and FIXED in this pass

`app/auth/actions.ts` built the reset `redirectTo` as `` `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback…` ``. With `NEXT_PUBLIC_SITE_URL` unset (the current state) that yields the **relative** value `/auth/callback?next=/reset-password`, which Supabase rejects — recovery links would silently break.

Fix implemented: `siteOrigin()` in `lib/supabase/env.ts` (prefers `NEXT_PUBLIC_SITE_URL`, else derives from `x-forwarded-proto`/`x-forwarded-host`/`host`, **returns null rather than inventing a production origin**), wired through `resolveSiteOrigin()` in `lib/supabase/server.ts`. When the origin is unknown the action omits `redirectTo` (Supabase uses its configured default) and records a `security_event` with `event=site_url_unconfigured`. Audit metadata still never stores the email address.

Retest: build/typecheck/lint all PASS (§Validation). Runtime delivery of a reset email remains **NOT TESTED** (requires a real mailbox and credentials).

## Privilege-escalation battery (Phase 3) — executed live, rolled back

| Case | Result |
|---|---|
| staff → self `role='admin'` / `'super_admin'` / `'developer'` / `'content_manager'` / `'product_manager'` | **REJECTED ×5** (no self-promotion to any privileged role) |
| staff → other user's `full_name` | **0 rows** (blocked) |
| staff → other user's `status` / `metadata` / `avatar_url` | **0 rows** each (blocked) |
| staff → `profiles.email` | **not a column** — email is not mutable through `profiles` (`column "email" does not exist`) |
| staff → `SELECT * FROM profiles` | **1 row visible (own only)** — cross-user read blocked |
| staff → `is_admin()` / `is_staff_editor()` / `can('site.content','publish')` / `can('users','view')` | **f / f / f / f** |
| forged actor audit INSERT, forged identity INSERT | **REJECTED** (earlier pass) |
| anon UPDATE / DELETE on profiles | **0 rows / 0 rows** |

**No privilege escalation path found.**

## RBAC matrix (Phase 4) — database-verified

`rolesPresent = 9/9` · `permissions = 54` (all 8 actions represented) · `dupGrants = 0` · `orphanGrants = 0`.
Matrix excerpt confirms: `admin` → products CRUD+publish+manage, site.content CRUD+approve+export, `users:view/create/edit`, `audit.logs:view`, **no `settings.security`**; `content_manager` → site.content + `products:view` only; `editor` retained with content capabilities; **`developer` and `client` hold zero administrative grants**; `settings.security:manage` is super_admin-only.
**`super_admin` runtime behaviour: NOT TESTED** — no account holds that role and none was created (creating one would be an unauthorized privilege change).

## Route protection (Phase 6) — production build, port 3718

`/admin`, `/admin/users`, `/admin/settings`, `/admin/audit`, `/admin/content`, `/app`, `/app/anything`, `/app/users` → **all 307 → `/login?next=<that path>`** ✓ (no privilege by URL entry, no loops).

Open-redirect attacks on `next` — hidden field after sanitisation:
`https%3A%2F%2Fevil.example` → `/admin` · `%2F%2Fevil.example` → `/admin` · `http://evil.example` → `/admin` · `//evil.e%78ample` → `/admin` · `/admin` → `/admin` ✓ **all external and protocol-relative values rejected**; only same-origin paths accepted.

`GET /login` sets **0** cookies when unauthenticated ✓. Server log contains **no** `sb_publishable`, `access_token`, `refresh_token` or `password` strings ✓.

## Source audit (Phase 12)

Zero matches for `service_role`, `SERVICE_ROLE_KEY`, `sk_live`, or embedded bearer tokens across `app/`, `lib/`, `components/`, `proxy.ts`, `next.config.ts`. No `console.log/error` in auth paths. `getUser()` is the authorization source (2 call sites); `getSession()` appears only inside `proxy.ts` as an early guard. `.gitignore` covers `.next`, `.env*`, `.env.local`.

## Statuses

| Area | Status |
|---|---|
| RBAC / RLS / audit / route protection / redirect safety / source audit / build+type+lint | **PASS** |
| Login success, invalid login, session logout, protected-route-after-logout, reset completion | **NOT TESTED — OWNER ACTION REQUIRED** (no credentials in this environment; none requested or created) |
| `NEXT_PUBLIC_SITE_URL` + Supabase Auth allow-list `<origin>/auth/callback` | **OWNER ACTION REQUIRED** — no `.vercel` project link and no Vercel CLI present, so the production origin cannot be discovered or configured from here; the fix now degrades safely instead of sending a broken relative redirect |
| Rate limiting | **A — provided by Supabase Auth** (thresholds not verified here). Application-level distributed limiter: **NOT IMPLEMENTED** and not claimed |
| Multi-device session revocation | **FUTURE ENHANCEMENT** (logout uses `scope: 'local'`; no global revoke exists) |
| CSP | **FUTURE ENHANCEMENT** — deliberately omitted; untested policy would break fonts/three.js/Supabase endpoints |
| Private storage buckets + signed URLs | **FUTURE** (all 7 buckets remain public and empty) |

## Post-pass integrity

`profiles` total **2** (staff=1, admin=1), `super_admin` count **0**, all `status='active'`, `metadata='{}'`, `full_name` unchanged; `audit_logs` total **1** — the genuine `security_event` from the invalid-callback test; **no fabricated events**, no test mutations persisted, RLS 23/23, policies 98.

