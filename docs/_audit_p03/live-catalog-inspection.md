# PART 03 — LIVE CATALOG INSPECTION (read-only, Supabase dashboard SQL Editor)

Date: 2026-10-05 · project `yparzhgzhpwewyrjhqud` · session: authenticated (owner-signed-in dashboard)
Mode: **SELECT / pg_catalog / information_schema only. Zero writes.** No DDL, no DML, no migration created or applied, no ANALYZE/VACUUM.

Every statement below was executed read-only via the SQL Editor. This file replaces the `UNVERIFIED`/`BLOCKED` placeholders in the Part 02 register for every item captured here.

## 1. Reconciliation (M17) — all counts re-confirmed live, unchanged

`23 tables | 92 policies | 44 indexes | 4 functions | 21 triggers | 0 sequences | 0 views | 5 enums`
Plus: 7 storage buckets, 4 storage policies (on `storage.objects`), 2 auth users, `profiles` = 2 rows (roles: `staff=1, admin=1`).

**No count changed since Part 01/02.** New facts: 21 triggers, 0 sequences, 0 views, 5 enums, 4 storage policies.

## 2. Enum types (M10) — VERIFIED

| Enum | Values (exact, in sort order) |
|---|---|
| `user_role` | `super_admin, admin, editor, content_manager, staff` |
| `content_status` | `draft, published, archived` |
| `message_status` | `new, read, responded, archived` |
| `job_status` | `open, closed, draft` |
| `employment_type` | `full_time, part_time, contract, internship` |

No domains (`typtype='d'`) exist. Publication workflow (Part 02 Step 10) is **already implemented** as `content_status` — do not add a parallel status system.

## 3. `profiles` — structure, constraints, indexes (M01/M02/M12) — VERIFIED

```
id           uuid          NOT NULL   PRIMARY KEY
full_name    text          nullable
role         user_role     NOT NULL   DEFAULT 'admin'::user_role
created_at   timestamptz   NOT NULL   DEFAULT now()
updated_at   timestamptz   NOT NULL   DEFAULT now()
"xeltrio technologies Org"  user_role  nullable  DEFAULT 'admin'::user_role   <-- SEE §4
```
Constraints: `profiles_pkey PRIMARY KEY (id)`; `profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE`.
Indexes: only `profiles_pkey` (unique btree on id). No index on `role`.

**Findings for Part 03:**
- `role` is an **enum**, not text, and has a DEFAULT of `admin` — a permissive default for a privileged column.
- No `email`, `avatar_url`, `status`, or account-metadata column exists → Part 03 §5's profile model needs added columns (email can be derived from `auth.users`; do not duplicate auth as the identity source).
- No uniqueness/CHECK beyond the enum itself; enum membership is the only role constraint.

## 4. SCHEMA DEFECT — stray column named `"xeltrio technologies Org"` (VERIFIED, needs owner decision)

`profiles` contains a 6th column whose name is literally **`xeltrio technologies Org`** (the Supabase organization's display name), type `user_role`, nullable, default `'admin'::user_role`.

It is a duplicate of `role` and carries the same type and default — the signature of an accidental creation, most likely a mis-paste into the "column name" field of the dashboard table editor. Consequences: it is selectable by any policy that grants profile reads, it duplicates privileged data, and `SELECT *` clients will keep shipping it around.

**Not dropped and not altered in this pass** (destructive; requires owner authorization and an export first). Recommendation: after confirming no consumer exists, remove it in a numbered migration `DROP COLUMN IF EXISTS "xeltrio technologies Org"` following a backup.

## 5. Functions — complete security review (M04, Part 03 §16) — VERIFIED SAFE

| Function | DEFINER | Volatility | search_path | Owner | EXECUTE granted to |
|---|---|---|---|---|---|
| `handle_new_user()` | **yes** | volatile | `public` | postgres | postgres, service_role |
| `is_admin()` | **yes** | STABLE | `public` | postgres | **anon, authenticated**, postgres, service_role |
| `is_staff_editor()` | **yes** | STABLE | `public` | postgres | **anon, authenticated**, postgres, service_role |
| `set_updated_at()` | no (invoker) | volatile | `public` | postgres | postgres, service_role |

Bodies (verbatim from `pg_get_functiondef`):
```sql
handle_new_user(): insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'staff'); return new;

is_admin():             select coalesce((select role in ('super_admin','admin')
                          from public.profiles where id = auth.uid()), false);
is_staff_editor():      select coalesce((select role in ('super_admin','admin','editor','content_manager')
                          from public.profiles where id = auth.uid()), false);
set_updated_at():       new.updated_at = now(); return new;
```

Assessment against Part 03 §16:
- **`search_path` is pinned** on all four → the Part 02 top security blocker is **CLOSED / SAFE**.
- **No RLS recursion:** `is_admin()`/`is_staff_editor()` are SECURITY DEFINER owned by `postgres` (table owner), so their inner `profiles` read runs as owner and does **not** re-enter the caller's RLS policy. Correct pattern.
- Anon EXECUTE on the two helpers is **required** (policies must evaluate them under the anon role) and is **not** a bypass: with `auth.uid()` NULL both return `false` via `coalesce`.
- `handle_new_user()` hardcodes `role = 'staff'`, so **browser-supplied `raw_user_meta_data` cannot choose a role** — the only client-influenced field is `full_name` (plain text). Good default-deny posture for §2.3/§15.
- Note for Part 03: `handle_new_user` seeds `staff`, but `staff` is **not** in `is_staff_editor()`'s list, so new users get no editorial rights by default.

## 6. Policies on the security-critical tables (M06 subset) — VERIFIED, ONE REAL ISSUE

`profiles`:
```
SELECT   [public]  USING (auth.uid() = id OR is_admin())
INSERT   [public]  WITH CHECK (is_admin())
UPDATE   [public]  USING (auth.uid() = id OR is_admin())
                  WITH CHECK (auth.uid() = id OR is_admin())     <-- ISSUE
DELETE   [public]  USING (is_admin())
```

**VERIFIED PRIVILEGE-ESCALATION HOLE (Part 03 §14/§15 target).** Because the UPDATE `WITH CHECK` only requires that the resulting row still belongs to the caller, and `id` never changes, **any authenticated user can set their own `role`**, including to `super_admin`. Hiding UI is irrelevant — this is database-enforceable today. Must be fixed by a numbered migration (policy split + a role-guard trigger), not by frontend checks.

`contact_messages` and `newsletter_subscribers` (identical shape):
```
INSERT   [anon, authenticated]  WITH CHECK (true)     -- intended public write path
SELECT   [public]  USING (is_staff_editor())
UPDATE   [public]  USING (is_staff_editor()) WITH CHECK (is_staff_editor())
DELETE   [public]  USING (is_staff_editor())
```
Least-privilege **correct**: no anonymous read, no anonymous update/delete, staff-only triage. Part 02's "public draft exposure" question is answered for inbound data: **no public SELECT exists on either table.**

## 7. RBAC tables — confirmed ABSENT

Query for tables matching `role|permission|audit|session|member` → **`NONE`**. There is no `roles`, `permissions`, `role_permissions`, `user_roles`, `audit_logs` or `sessions` table. Part 03 §8's normalized model must therefore be **created**, not reconciled — and must extend, not replace, the existing `user_role` enum + `profiles.role`, which is what all 92 policies currently depend on.

## 8. Triggers (M05) — VERIFIED: 21, uniform

20 × `set_<table>_updated_at` — `BEFORE UPDATE` (tgtype event mask 16), **enabled `O`**, invoking `set_updated_at()` — one per content table (announcements, brand_pages, careers_jobs, company, content_items, faqs, footer_links, founder, hm_signature_fragrances, industries, legal_pages, navigation_items, news_articles, press_releases, product_categories, products, resources, roadmap_steps, solutions, testimonials), plus `handle_new_user` on `auth.users`.
**No duplicate trigger functions exist** — Part 03 must reuse `set_updated_at()` (per brief) and add no new `updated_at` machinery.

## 9. Complete column catalog (M01) — VERIFIED, all 23 tables

`+NN` = NOT NULL. (`enum` names shown where `USER-DEFINED`.)

- **announcements**: id+NN, title+NN, content, published_at, status:content_status+NN, created_at+NN, updated_at+NN
- **brand_pages**: id+NN, page_key+NN, hero_title, hero_subtitle, hero_description, story:jsonb+NN, logo_url, metadata:jsonb+NN, created_at+NN, updated_at+NN
- **careers_jobs**: id+NN, department+NN, title+NN, location, employment_type:employment_type+NN, salary_range, status:job_status+NN, description, requirements:jsonb+NN, benefits:jsonb+NN, application_link, created_at+NN, updated_at+NN
- **company**: id+NN, name+NN, tagline, mission_statement, vision_statement, founded_year:int, logo_url, icon_url, created_at+NN, updated_at+NN
- **contact_messages**: id+NN, full_name+NN, company_name, email+NN, phone, country, service, budget, timeline, message+NN, status:message_status+NN, created_at+NN  *(no updated_at — deliberate: append-mostly inbound record)*
- **content_items**: id+NN, **collection+NN**, title+NN, subtitle, description, icon_name, badge, image_url, href, sort_order:int+NN, status:content_status+NN, metadata:jsonb+NN, created_at+NN, updated_at+NN
- **faqs**: id+NN, page_key+NN, question+NN, answer+NN, sort_order:int+NN, status:content_status+NN, created_at+NN, updated_at+NN
- **footer_links**: id+NN, column_key+NN, label+NN, href+NN, sort_order:int+NN, is_active:bool+NN, created_at+NN, updated_at+NN
- **founder**: id+NN, name+NN, title+NN, company_name, photo_url, story:jsonb+NN, quote_lines:jsonb+NN, quote_attribution, mission_statement, vision_statement, company_vision_statement, created_at+NN, updated_at+NN
- **hm_signature_fragrances**: id+NN, name+NN, note, image_url, status:content_status+NN, sort_order:int+NN, created_at+NN, updated_at+NN
- **industries**: id+NN, slug+NN, name+NN, description, challenge, ai_solution, future_product, icon_name, sort_order:int+NN, status:content_status+NN, created_at+NN, updated_at+NN
- **legal_pages**: id+NN, slug+NN, title+NN, summary, topics:jsonb+NN, status:content_status+NN, created_at+NN, updated_at+NN  **(no body/content column — see §10)**
- **navigation_items**: id+NN, **parent_id:uuid** (self-FK → nesting supported), label+NN, href+NN, description, sort_order:int+NN, is_active:bool+NN, created_at+NN, updated_at+NN
- **news_articles**: id+NN, title+NN, slug+NN, excerpt, content, image_url, category, featured:bool+NN, published_at, status:content_status+NN, created_at+NN, updated_at+NN
- **newsletter_subscribers**: id+NN, email+NN, status:text+NN, subscribed_at+NN, unsubscribed_at  *(status is plain text here, not an enum)*
- **press_releases**: id+NN, title+NN, slug+NN, excerpt, content, published_at, status:content_status+NN, created_at+NN, updated_at+NN
- **product_categories**: id+NN, name+NN, slug+NN, sort_order:int+NN, created_at+NN, updated_at+NN
- **products**: id+NN, category_id:uuid (nullable), name+NN, slug+NN, description, badge, icon_name, href, status:content_status+NN, sort_order:int+NN, created_at+NN, updated_at+NN
- **profiles**: see §3
- **resources**: id+NN, title+NN, description, status:content_status+NN, sort_order:int+NN, created_at+NN, updated_at+NN
- **roadmap_steps**: id+NN, **roadmap_key+NN**, label+NN, detail, status:text+NN, sort_order:int+NN, created_at+NN, updated_at+NN  *(status is plain text, unlike every other content table)*
- **solutions**: id+NN, industry_id:uuid (nullable), industry_name+NN, product_name, problem, solution, sort_order:int+NN, status:content_status+NN, created_at+NN, updated_at+NN  *(denormalized industry name alongside the FK)*
- **testimonials**: id+NN, author_name+NN, author_title, company_name, quote+NN, avatar_url, status:content_status+NN, sort_order:int+NN, created_at+NN, updated_at+NN

Standardization verdict (Part 02 Step 7): `id uuid + created_at + updated_at` is already the house standard on every content table; **0 sequences** ⇒ all PKs are uuid, no identity columns to reconcile.

## 10. Data-semantics questions from Part 02 — now ANSWERED

| Part 02 blocker | Resolution |
|---|---|
| "`content_items` semantics not established" | **Resolved.** It is a `collection`-keyed generic content table. Live distribution: `company_trust=8, core_values=7, hamiaworks_services=11, why_xeltrio=6` (32 total). Each count **exactly matches** the corresponding constants array (`COMPANY_TRUST_PILLARS` 8, `CORE_VALUES` 7, `HAMIAWORKS_SERVICES` 11, `WHY_XELTRIO` 6). So only 4 of ~35 constant domains are seeded, and the table is provably shaped to absorb more — per-collection migration is safe. |
| "scope discriminator required for roadmap" | **Resolved — it already exists.** `roadmap_steps.roadmap_key` is NOT NULL; all 10 seeded rows use `roadmap_key='global'`. Company and BusinessOS roadmaps can coexist as additional keys with **no schema change**. Caveat: `roadmap_steps.status` is plain `text`, not `content_status`, unlike every sibling table. |
| "navigation_items cannot prove nesting" | **Resolved.** `parent_id uuid` self-reference exists; `NAV_LINKS`' nested `children` map onto it. |
| "legal bodies may be split" | **Resolved and worse than feared.** `legal_pages` has **no body/content column** — only `slug, title, summary, topics jsonb`. Full legal text exists nowhere in the system. Frontend renders an explicit placeholder. `OWNER LEGAL CONTENT REQUIRED` stands, now with schema precision: canonical legal text will need an added column (or a `content` field in the CMS) before `/legal/*` can be DB-driven. |
| "product category taxonomy unknown" | **Resolved as to names**: `Vertical/vertical`, `Core/core`, `Platform/platform`. Mapping the 12 products to these is still a judgment call (e.g. is `CRM` Core or Platform? is `BusinessOS` Platform or Core?), so it remains an **owner decision**, but the option set is now concrete instead of unknown. |
| "`contact_messages` provenance" | Structure read: `status message_status+NN` defaults to `new`; there is **no source/channel column**, so provenance cannot be derived from schema metadata. Row content deliberately not dumped (PII). → `OWNER VERIFICATION REQUIRED` stands. |
| "stale planner statistics" | Confirmed environmental: 0 sequences, tables never analyzed (estimated rows 0 vs 101 actual). **No ANALYZE was run.** |

## 11. Storage (M09/M09B) — VERIFIED flags; policies partially

All 7 buckets are **`public = true`**, `file_size_limit = none`, `allowed_mime_types = any`, `objects = 0`:
`company-assets, founder, hm-signature, logos, media, news, products`.

4 policies exist on `storage.objects` (their exact expressions were not captured in this session — the one remaining Part 03 inspection item).

Security implication for Part 03: every bucket is world-readable and size/MIME unrestricted. That is acceptable today **only because they are empty**; it is incompatible with the brief's requirement that client files and private documents use protected access + signed URLs. Adding private buckets and write policies is a Part 03+ storage task (bucket creation is additive, non-destructive).

## 12. Part 03 design consequences (from verified facts, not assumptions)

1. Reuse `user_role` enum + `profiles.role`; extend it with the 5 missing roles via `ALTER TYPE … ADD VALUE` — noting that value addition cannot occur in the same transaction as a `CREATE TYPE`, and Supabase migrations run inside a transaction ⇒ each `ADD VALUE` needs care (separate migration or `IF NOT EXISTS` guard).
2. `super_admin` already exists in the enum but **no user has it** (`staff=1, admin=1`) ⇒ promoting an account is a live role change requiring explicit owner authorization.
3. The privilege-escalation fix (§6) is the highest-priority security migration, ahead of any new UI.
4. Add `roles`/`permissions`/`role_permissions`/`audit_logs` as new tables (none exist), keyed to the existing enum so current policies keep working.
5. `@supabase/ssr` is **not installed** (only `@supabase/supabase-js`); Next 16 requires `proxy.ts`, not `middleware.ts`, and async `cookies()`.
6. Reuse `set_updated_at()` for new tables; do not create duplicate trigger functions.
7. Next migration number is **016**; the project has no local `supabase/migrations` and the GitHub integration mirrors **0 SQL files**, so migration files must be created locally and applied through the owner's chosen path.

## 13. Mutations performed by this inspection

**INSERT 0 · UPDATE 0 · DELETE 0 · TRUNCATE 0 · DROP 0 · ALTER 0 · CREATE 0 · GRANT/REVOKE 0 · policy changes 0 · RLS changes 0 · function/trigger changes 0 · storage changes 0 · ANALYZE 0 · VACUUM 0 · REINDEX 0 · migrations created 0 · migrations applied 0.**
All statements were SELECT / pg_catalog / information_schema / `pg_get_*`. No secret values were read or printed (no API keys, no row-level PII dumps).
