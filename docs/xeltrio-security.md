# Xeltrio Technologies — Security (Part 03)

Date: 2026-10-05 · project `yparzhgzhpwewyrjhqud` · companion evidence: `docs/_audit_p03/live-catalog-inspection.md`

Status vocabulary used throughout: **IMPLEMENTED / VERIFIED / PARTIALLY IMPLEMENTED / REQUIRES EXTERNAL CONFIGURATION / NOT IMPLEMENTED**. Nothing here is described as done unless it is actually in place and checked.

---

## 1. Critical finding — verified, with fix drafted

**`profiles` allowed self-promotion to `super_admin` at the database layer.**

Live state (captured read-only, `pg_policies`):

```
profiles_update  FOR UPDATE  TO public
  USING      (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin())
```

`WITH CHECK` re-tests only row ownership, and `id` never changes during an UPDATE — so any authenticated user can write `role = 'super_admin'` to their own row and the policy passes. Every RLS policy in this project ultimately trusts `profiles.role` (via `is_admin()` / `is_staff_editor()`), so a single self-update yields full administrative control of all content tables.

This is not mitigable by UI: an attacker uses the REST endpoint or a direct SQL call, not a button. Part 03 §11 and §15 explicitly forbid relying on frontend checks, and §14 requires that users cannot change their own role.

**Fix: `supabase/migrations/016_profiles_role_escalation_guard.sql`** (authored, **NOT applied** — see §5).
- `session_user_role()` — SECURITY DEFINER, STABLE, `SET search_path = 'public'`, EXECUTE to `anon`/`authenticated` (required so policies can evaluate it).
- `profiles_update_self` — owner may edit own row **only when `role` is unchanged** (`role is not distinct from session_user_role()`).
- `profiles_update_admin` — `is_admin()` may edit any row including roles.
- `guard_profiles_privileges()` BEFORE UPDATE trigger — role changes require admin; granting/revoking `super_admin` requires an existing `super_admin`; `auth.uid() IS NULL` (service role / migrations / owner console) remains the controlled provisioning path.
- Additive and reversible: no data touched, no column dropped, SELECT/INSERT/DELETE policies untouched, `user_role` enum untouched. Includes post-apply verification SELECTs, five security test cases, and a rollback block.

## 2. Existing function security — VERIFIED SAFE (this was Part 02's top open item)

| Function | SECURITY DEFINER | Volatility | search_path pinned | Recursion risk |
|---|---|---|---|---|
| `is_admin()` | yes | STABLE | yes (`public`) | none — DEFINER bypasses `profiles` RLS by design |
| `is_staff_editor()` | yes | STABLE | yes (`public`) | none — same pattern |
| `handle_new_user()` | yes | volatile | yes (`public`) | n/a |
| `set_updated_at()` | no (invoker — correct for a trigger) | volatile | yes (`public`) | n/a |

Verified conclusions against Part 03 §16:
- Every security-definer function pins `search_path` explicitly. ✓
- No dynamic SQL; no user-supplied role identifiers trusted: `handle_new_user()` **hardcodes `role = 'staff'`** and takes only `full_name` from `raw_user_meta_data`, so public signup cannot select `super_admin`/`admin`/etc. ✓ (§2.3, §15)
- Granting EXECUTE on the two helpers to `anon` is intentional and safe: with `auth.uid()` NULL both `coalesce(...)` to `false`. ✓
- `is_admin()` already recognizes `('super_admin','admin')` and `is_staff_editor()` `('super_admin','admin','editor','content_manager')`, so the existing 92 policies are already written for the enum the RBAC model will extend — new RBAC tables must key off `user_role`, not replace it.

## 3. RLS posture — VERIFIED (least privilege where it matters)

- RLS enabled on **23/23** tables; count unchanged at **92 policies** (public 90 / anon 2 / authenticated 2).
- Anonymous surface is **exactly two INSERTs**: `contact_messages`, `newsletter_subscribers` (`WITH CHECK true`), matching the two public entry points the site needs.
- Both inbound tables are **staff-gated for read/update/delete** (`is_staff_editor()`), so there is **no public SELECT** on contact or newsletter data — this closes Part 02's "public draft exposure" question for CRM data.
- `profiles`: SELECT self-or-admin, INSERT admin-only, DELETE admin-only — correct. Only UPDATE was defective (§1).
- Content tables are gated through `is_staff_editor()` for writes; publication state is enforced by the `content_status` enum (`draft, published, archived`) that already exists on every content table.

**Partially verified / open:** the exact expressions of the remaining ~88 content-table policies were not all captured; `relforcerowsecurity` was not read; the four `storage.objects` policies were counted but their expressions not captured. None of these are assumed safe — they are listed as remaining checks in §5.

## 4. Storage — verified flags, one real constraint for later

All 7 buckets (`company-assets, founder, hm-signature, logos, media, news, products`) are **`public = true`**, with **no size limit**, **no MIME restriction**, and **0 objects**.

Public read is appropriate for marketing assets and harmless today because the buckets are empty. It is **not** compatible with Part 03 §26/Part 02 §13's requirement that client files, private documents and AI knowledge files be protected and served via signed URLs. Recommended (not yet done, no bucket created): keep these seven public for public assets, and introduce private buckets plus storage policies when client/portal data actually arrives — never loosen these to make an upload easier.

## 5. What blocks the rest of Part 03

| Gate | Type | Detail |
|---|---|---|
| Apply migration 016 | **OWNER AUTHORIZATION + EXPORT** | FREE plan, dashboard reports `LAST BACKUP — No backups`. §30 forbids applying migrations without a backup or explicit authorization. 016 is additive and reversible, but it drops and recreates a live policy. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **REQUIRES EXTERNAL CONFIGURATION** | Absent (no `.env*` exists). Login, session validation and every auth test are impossible to run without them. `SUPABASE_SERVICE_ROLE_KEY` must stay server-only and is not needed for the login flow. |
| `@supabase/ssr` | **DEPENDENCY DECISION** | Not installed (only `@supabase/supabase-js`). Cookie-based sessions in Next 16's App Router need it, otherwise a hand-rolled cookie adapter must be written. Needs your approval to add a package. |
| `super_admin` provisioning | **OWNER DECISION** | Enum already contains `super_admin`, but live roles are `staff=1, admin=1` — **no super_admin exists**. §32 forbids silently rewriting existing roles; the promotion must be an explicit owner action (ideally via the service-role path 016 leaves open). |
| Missing roles | **OWNER DECISION** | `user_role` lacks `product_manager, sales_manager, support_manager, developer, client`. Adding enum values needs `ALTER TYPE … ADD VALUE`, which cannot share a transaction with a `CREATE TYPE` and must be sequenced carefully in Supabase migrations. Also: `editor` exists in the enum but not in the Part 03 §6 target list — keep or retire? |
| Stray column | **OWNER DECISION** | `profiles` has a 6th column literally named **`"xeltrio technologies Org"`**, type `user_role`, default `'admin'` — an accidental duplicate of `role`. Not dropped in this pass. Recommended removal in a later numbered migration after confirming no consumer and taking an export. |
| Remaining catalog checks | Follow-up reads | 4 × `storage.objects` policy expressions, `relforcerowsecurity` per table, the other content-table policy texts (`pg_get_functiondef` style read of `pg_policies`). |

## 6. Frontend facts established for implementation (Next.js 16.2.12)

Verified against the version's own bundled docs (`node_modules/next/dist/docs/`), not memory:
- **`middleware.ts` is deprecated → `proxy.ts`** (root-level, Node.js runtime only; setting `runtime` throws). Matcher config still applies; without a matcher it runs on every request including static assets.
- `cookies()` / `headers()` are **async only** (sync access removed in 16). Cookie **writes are allowed only in Server Actions or Route Handlers** — never during Server Component rendering. Options are `maxAge` / `path` (there is no `maxPath`).
- Server Actions require `'use server'`, must be async, take `FormData`; `redirect()` inside an action yields **303**.
- Route Handlers are **not cached by default** — no `force-dynamic` needed for auth routes.
- Reading `cookies()` opts a route into dynamic rendering; Cache Components is **off** in this project, so `dynamic`/`revalidate` remain valid.
- `forbidden()` / `unauthorized()` exist but are **experimental** (`experimental.authInterrupts: true`, marked canary) → Part 03 uses explicit redirects + an `/unauthorized` page + real 401/403 responses in route handlers instead.
- The proxy docs state the rule this whole file rests on: **"Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone."**
- Repository audit found **zero** pre-existing auth infrastructure to duplicate: no `supabase`/`createClient`/`createServerClient`/`getUser`/`getSession` references, no `middleware`/`proxy`, no `/admin`, no `/app`, no `profiles` usage anywhere in `app/`, `components/`, `lib/`, `hooks/`.

## 7. Mutations performed to produce this document

**0** schema changes applied, **0** data changes, **0** migrations applied. Migration **016 exists only as a local file** and has not been run. All database interaction in Part 03 so far was SELECT / `pg_catalog` / `information_schema` / `pg_get_*`. No secret values were read or printed.
