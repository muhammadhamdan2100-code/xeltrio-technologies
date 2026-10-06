# Xeltrio Technologies — Database Foundation (Part 02, Step 27)

- **Project:** Supabase `yparzhgzhpwewyrjhqud` · org "xeltrio technologies Org" · plan **FREE** (Nano, `ap-south-1` Mumbai) · PostgreSQL (Supabase-managed)
- **Date:** 2026-10-05
- **Mode:** documentation of a **read-only** audit. **No schema change, no migration created, no migration applied, no data change, no RLS/policy/index/function/trigger/storage change.**
- **Evidence:** Part 01 live captures (`docs/_audit_supabase_*.txt`), Part 02 live re-verification (`docs/_audit_p02/live-verification-log.md`), Part 02 read-only query set (`tmp-audit/p02-readonly-metadata.sql`).
- **Confidence labels:** `VERIFIED` = observed by live read-only SQL in this project · `PARTIAL` = observed but incompletely (e.g. only some rows re-read) · `UNVERIFIED` = requires catalog access that was unavailable this session; **not guessed**.

---

## 1. Database Overview

A single application schema (`public`) of 23 tables serving a corporate marketing site, with 92 row-level-security policies, 4 helper functions, 44 indexes, 15 applied migrations, 7 storage buckets, and 101 seeded rows. The schema was built ahead of the application: **the frontend does not read from or write to this database at all** (zero Supabase imports, zero environment variables, contact form simulated). RLS is enabled on every table; anonymous access is limited to content reads plus exactly two public insert paths.

Advisors: no security or performance issues reported (dashboard Advisor Center, Part 01). Backups: none (FREE plan).

## 2. Existing Tables (23) with reconciliation status (Step 4)

Status vocabulary: **KEEP** correct/useful · **MODIFY** useful, needs structural improvement · **MERGE** duplicates a concept · **DEPRECATE** not needed, keep for now · **FUTURE** architecture table not required yet.

| # | Table | Rows | Status | Basis |
|---|---|---|---|---|
| 1 | `profiles` | 2 | KEEP | RBAC anchor (`role` values `admin`, `staff` VERIFIED) |
| 2 | `company` | 1 | KEEP | single company record |
| 3 | `founder` | 1 | KEEP | single founder record |
| 4 | `content_items` | 32 | **MODIFY (needs definition)** | 32 rows vs ~150 constant records; role ambiguous until columns/rows are read (M01+M08 detail) — highest-priority UNVERIFIED item |
| 5 | `products` | 12 | KEEP | columns `id,name,slug,category_id` VERIFIED (partial) |
| 6 | `product_categories` | 3 | KEEP | category parent of `products` |
| 7 | `solutions` | 9 | KEEP | parity with `SOLUTIONS` (9) |
| 8 | `industries` | 9 | KEEP | parity with `INDUSTRIES` (9) |
| 9 | `roadmap_steps` | 10 | MODIFY | must separate company roadmap (7 in constants) from BusinessOS roadmap (7) from `ROADMAP_STEPS` (10) — needs a scope/product discriminator (existence UNVERIFIED) |
| 10 | `legal_pages` | 4 | KEEP | add versioning later (Step 8/10) |
| 11 | `faqs` | 5 | KEEP | parity with `CONTACT_FAQ` (5) |
| 12 | `hm_signature_fragrances` | 4 | KEEP | brand-specific; must not merge with corporate `products` (Step 11/DOMAIN 11) |
| 13 | `contact_messages` | 1 | KEEP | inbound CRM; provenance of the 1 row UNVERIFIED |
| 14 | `newsletter_subscribers` | 0 | KEEP | public insert policy ready; no consumer yet |
| 15 | `navigation_items` | 0 | KEEP (populate later) | front end still uses `NAV_LINKS` (9+children) |
| 16 | `footer_links` | 0 | KEEP (populate later) | front end uses 6 `FOOTER_*` arrays (23 links) |
| 17 | `brand_pages` | 0 | FUTURE | would host HM Signature/HAMIA narrative |
| 18 | `announcements` | 0 | FUTURE | — |
| 19 | `news_articles` | 0 | FUTURE | press/news section currently constants |
| 20 | `press_releases` | 0 | FUTURE | same |
| 21 | `careers_jobs` | 0 | FUTURE | `CAREERS_PILLARS` is not job data |
| 22 | `resources` | 0 | FUTURE | `RESOURCES_SECTIONS` (7) constants |
| 23 | `testimonials` | 0 | FUTURE | no frontend surface |

**Migrations are the only sanctioned path to change any of the above. Nothing was changed in Part 02.**

## 2b. Verified per-table column counts, sizes and realtime flags (Part 02 completion)

Recovered from the live **Database → Tables** capture (`docs/_audit_supabase_database_tables.txt`, captured 2026-10-05 read-only; the dashboard lists NAME / COLUMNS / ROWS-ESTIMATED / SIZE / REALTIME):

| Table | Cols | Size (est) | Realtime | Table | Cols | Size (est) | Realtime |
|---|---|---|---|---|---|---|---|
| `announcements` | 7 | 24 kB | Disabled | `legal_pages` | 8 | 48 kB | Disabled |
| `brand_pages` | 10 | 24 kB | Disabled | `navigation_items` | 9 | 24 kB | Disabled |
| `careers_jobs` | 13 | 24 kB | Disabled | `news_articles` | 12 | 32 kB | Disabled |
| `company` | 10 | 32 kB | **Enabled** | `newsletter_subscribers` | 5 | 48 kB | Disabled |
| `contact_messages` | 12 | 48 kB | Disabled | `press_releases` | 9 | 32 kB | Disabled |
| `content_items` | 14 | 72 kB | Disabled | `product_categories` | 6 | 48 kB | Disabled |
| `faqs` | 8 | 48 kB | Disabled | `products` | 12 | 64 kB | Disabled |
| `footer_links` | 8 | 24 kB | Disabled | `profiles` | 6 | 32 kB | Disabled |
| `founder` | 13 | 32 kB | Disabled | `resources` | 7 | 16 kB | Disabled |
| `hm_signature_fragrances` | 8 | 32 kB | Disabled | `roadmap_steps` | 8 | 48 kB | Disabled |
| `industries` | 12 | 48 kB | Disabled | `solutions` | 10 | 48 kB | Disabled |

- **207 columns across 22 tables.** `testimonials` was below the capture's fold → its column count is **BLOCKED** (needs M01).
- **`ROWS (ESTIMATED)` reads 0 for every table while exact counts total 101.** This is expected: `pg_class.reltuples` is only populated by (auto)analyze, and the tables are too small/new to have triggered it. Consequence: **planner statistics are stale**, so `reltuples`, `pg_stat_*` scan counters and any index-usage conclusion must be treated as weak evidence until analyzed (M16 caveat). It also means migration `016` must not rely on estimated counts.
- `company` is the only table with **Realtime Enabled** — worth an explicit decision in Part 03, since realtime on a single-company row table is usually incidental rather than intentional. Realtime configuration was not changed.

## 3. Table Purpose (domain grouping, Step 5)

| Domain | Tables |
|---|---|
| 01 Identity & Access | `profiles` (+ `auth.users`, auth schema) |
| 02 Company | `company`, `founder` |
| 03 CMS | `content_items`, `brand_pages`, `announcements`, `navigation_items`, `footer_links` |
| 04 Services / Solutions | `solutions` (+ future `services` — see §17: **do not create if `solutions` is canonical**) |
| 05 Products | `products`, `product_categories` |
| 06 Industries | `industries` |
| 07 Roadmap | `roadmap_steps` |
| 08 Legal | `legal_pages` |
| 09 CRM / Inbound | `contact_messages`, `newsletter_subscribers` |
| 10 FAQ / Social proof | `faqs`, `testimonials` |
| 11 HM Signature | `hm_signature_fragrances` |
| 12 News/Press, Careers, Resources | `news_articles`, `press_releases`, `careers_jobs`, `resources` |

No `roles`, `permissions`, `user_roles`, `role_permissions`, `sessions` or `audit_logs` tables exist: RBAC is implemented as `profiles.role` + SQL helper functions (`is_admin`, `is_staff_editor`) — VERIFIED. The brief's instruction "do not duplicate existing RBAC tables" is satisfied because there is nothing to duplicate; see §17 for whether a real RBAC model is warranted in Part 03.

## 4. Relationships

- `products.category_id → product_categories.id` — VERIFIED column exists (Table Editor); FK constraint definition UNVERIFIED (M15).
- `profiles.id ↔ auth.users.id` — standard Supabase 1:1; provisioning trigger `handle_new_user` VERIFIED to exist.
- `content_items` → no relationship verified; if it is a polymorphic bucket (`type`/`slug`/`metadata`), it cannot express product/roadmap links, which is why §16 treats it as the top verification priority.
- All other inter-table relationships: **UNVERIFIED** (M02/M15 pending).

## 5. Primary Keys

`products.id` is `uuid` and the 12 seeded ids are UUID values — **VERIFIED** from the live Table Editor capture (`docs/_audit_supabase_products_table.txt`, which shows all 12 `products` ids as UUIDs alongside `name` and `slug`). Per-table column counts are now VERIFIED (§2b), which bounds the PK question: `profiles` has only 6 columns, `newsletter_subscribers` 5, `product_categories` 6.

Still **BLOCKED**: PK membership and default expression per table (needs M01/M02). The Step 7 standardization target (`id uuid default gen_random_uuid()`) is therefore **PARTIAL — 1 table's id type verified, 22 awaiting M01**, and no table was altered to "standardize" anything.

## 6. Foreign Keys

44 indexes exist, and Part 01 recorded that migration `013_missing_fk_indexes` added FK indexes — which implies FKs were defined and were previously unindexed. Exact FK list, `ON DELETE`/`ON UPDATE` rules and cascade behavior: **UNVERIFIED** (M15). Cascade review is a required Part 03 input so that deleting a category or solution cannot silently orphan published content.

## 7. Indexes

- Count: **44** — VERIFIED (Part 01 live query).
- Composition (which are PK-backed uniques, which are the FK indexes from migration 013, whether slug uniqueness is enforced): **UNVERIFIED** (M03).
- Duplicate/unused-index analysis and per-index `idx_scan` usage: **UNVERIFIED** (M16B).
- Step 11 rule retained: **no index is added without a documented reason.** No indexes were added or dropped in Part 02.

## 8. Constraints

Observed: `products` columns NOT NULL for at least `name`/`slug` (implied by seeded values, not by a read constraint) → treat as **UNVERIFIED**. Needed checks to evaluate once M02 runs: unique slugs per public content table, status CHECK constraints (or enum §12), non-null title/body on published rows, `order_index >= 0`, and `contact_messages` length caps. Nothing was added in Part 02.

## 9. RLS

- **Enabled on 23/23 tables — VERIFIED** (Part 01 live `pg_class.relrowsecurity` query; no `no_rls` rows).
- `FORCE ROW LEVEL SECURITY`: **UNVERIFIED** (M07). Without forcing, a table owner/bypass-capable role skips policies; this is a review item, not a change to make blind.
- RLS was not disabled, altered, or replaced at any point in Part 01 or Part 02.

## 10. Policies

- **92 policies — VERIFIED.** Role distribution: `public` 90 · `anon` 2 · `authenticated` 2 (VERIFIED).
- Anonymous write surface = exactly two: `contact_messages INSERT`, `newsletter_subscribers INSERT` (VERIFIED). This matches Step 13's "only required forms" rule.
- Staff write gating: `products` UPDATE qual = `( SELECT is_staff_editor() AS is_staff_editor )` (VERIFIED twice, Part 01 and Part 02).
- Full per-policy `qual`/`with_check` text for the remaining 89 policies: **UNVERIFIED** (M06). Step 24's "no broad `USING (true)` except genuine public content" cannot be asserted beyond the sample verified above.
- No policy was created, edited, or dropped in Part 02.

## 11. Functions

- 4 functions in `public`: `handle_new_user`, `is_admin`, `is_staff_editor`, `set_updated_at` — VERIFIED twice (Part 01, Part 02 L1).
- `SECURITY DEFINER` status, owner, and `search_path` pinning (Step 14 requirements: `SET search_path` on security-definer functions, no recursive RLS via `profiles`, no bypass) — **UNVERIFIED** (M04).
- These four checks are the highest-value security items still open, because RLS correctness depends on `is_admin()`/`is_staff_editor()` being non-exploitable.

## 12. Triggers

- `set_updated_at` function exists → `updated_at` triggers are expected on content tables; the actual trigger inventory (which table, which event, BEFORE UPDATE) is **UNVERIFIED** (M05).
- `handle_new_user` is consistent with an `auth.users` INSERT trigger (existence of the trigger itself UNVERIFIED).
- No trigger was created, replaced, or dropped.

## 13. Storage

- 7 buckets, names VERIFIED: `company-assets`, `founder`, `hm-signature`, `logos`, `media`, `news`, `products`.
- Public/private flag, file-size limits, allowed MIME types, object counts (all buckets were empty in Part 01), and per-bucket policies: **UNVERIFIED** (M09 / M09B).
- Architecture requirement recorded for later phases: client/private documents and AI knowledge files must be **private buckets accessed with signed URLs**; the current bucket set is a reasonable public-asset split (7 for a marketing site) and needs no new buckets until a client portal exists.
- No bucket, policy, or object was created or changed.

## 14. Seed Data

Total **101 rows / 13 seeded tables / 10 empty tables** — VERIFIED (full live capture in Part 01; 12 of 23 tables re-verified live in Part 02 with identical values, remaining 11 carried from the same-method Part 01 capture).

| Table | Rows | Table | Rows |
|---|---|---|---|
| `content_items` | 32 | `hm_signature_fragrances` | 4 |
| `products` | 12 | `legal_pages` | 4 |
| `roadmap_steps` | 10 | `product_categories` | 3 |
| `industries` | 9 | `profiles` | 2 |
| `solutions` | 9 | `company` / `founder` / `contact_messages` | 1 each |
| `faqs` | 5 | | |

Validation (Step 25): duplicate slugs, orphaned FKs, invalid statuses, blank required fields, duplicate business keys — **UNVERIFIED** (V01-V06). One documented content-safety issue instead: seeded company/founder rows almost certainly carry the same `"Xeltrio Technologies Private Limited"` claim found in the frontend, which is **CONTENT VERIFICATION REQUIRED** and must be resolved before the DB becomes the canonical source (see §16).

## 14b. Verified seed content (products domain) — Part 02 completion

From the live `products` Table Editor capture, all 12 rows were read (columns `id`, `category_id`, `name`, `slug` were on screen; 8 further columns were off-screen):

| id (uuid) | category_id | name | slug |
|---|---|---|---|
| `12cc2418-…b663` | **NULL** | HospitalOS | `hospitalos` |
| `140481e3-…7d4c` | **NULL** | LogisticsOS | `logisticsos` |
| `1bdf749a-…a256` | **NULL** | RestaurantOS | `restaurantos` |
| `1c810179-…8329` | **NULL** | Finance | `finance` |
| `3a50dc07-…5f16` | **NULL** | BusinessOS | `businessos` |
| `454869d3-…a3e5` | **NULL** | RetailOS | `retailos` |
| `6449b7cc-…0b99` | **NULL** | EducationOS | `educationos` |
| `7443a0b9-…e7c5` | **NULL** | Future AI Products | `future-ai-products` |
| `c1ce87a4-…e45a` | **NULL** | Inventory | `inventory` |
| `ea3d8c00-…cf2` | **NULL** | HRMS | `hrms` |
| `f230db8a-…de1a` | **NULL** | ManufacturingOS | `manufacturingos` |
| `fb15744f-…7c3e` | **NULL** | CRM | `crm` |

Verified conclusions (no guesses):
1. **Content parity, not just count parity:** these 12 names are **exactly** the 12 names in `ECOSYSTEM_PRODUCTS` (`tmp-audit/parity-check.mjs` → `in constants only: (none)`, `in DB only: (none)`). The products domain is genuinely duplicated between the two systems, not drifted.
2. **`category_id` is NULL on 100% of rows** while `product_categories` holds 3 rows → the FK exists but is **entirely unpopulated**. V02 (orphans) is therefore clean *by vacuity*; the relationship is unmodeled data rather than verified data. Any CMS that groups products by category must first populate this column (via migration/seed, not by guessing which product belongs to which category).
3. **Slug convention is internally inconsistent:** 11 of 12 slugs are space-stripped lowercase (`hospitalos`, `manufacturingos`) but one is hyphenated (`future-ai-products`). All 12 are lowercase and **duplicate slugs = 0** (V01 PASS for products). For contrast, `INDUSTRIES` in constants uses hyphens consistently (`real-estate`). Step 9's slug standard therefore has no single existing convention to inherit — it must be chosen deliberately, and any normalization of `future-ai-products` would be a breaking URL change.
4. UUIDv4-format ids with no ordering → ordering must come from an explicit column (`order_index` or similar), the existence of which is BLOCKED pending M01.

## 14c. Legal content — compliance-sensitive divergence (VERIFIED from source)

`components/legal/LegalDocument.tsx` renders, for all four legal routes, an explicit block containing the literal strings **"PLACEHOLDER"** and *"This page is a placeholder, not a binding legal document. A complete, reviewed {title} will be published here before BusinessOS launches publicly."* followed by `LEGAL_PAGES[].topics`.

Consequences, established from evidence rather than assumption:
- **Full legal text exists nowhere in the frontend.** Constants hold only `slug`, `title`, `summary`, `topics[]` (4 entries: `privacy-policy`, `terms-of-service`, `cookie-policy`, `disclaimer`).
- The 4 `legal_pages` rows (8 columns each, table 48 kB) are the only plausible place for body text — whether they contain bodies, summaries, or the same placeholder prose is **BLOCKED** pending M01 + a content read.
- **Therefore: switching `/legal/*` to Supabase data could silently replace a self-declared, non-binding placeholder with text that looks like a real policy.** This must be gated by a content review by the owner, and **no legal text may be authored by an agent or generated to fill the gap.**

**VERIFIED (final pass, from prerendered build output — no DB needed):** the site does **not** misrepresent these pages as binding.
1. All four legal detail routes contain the disclaimer verbatim (`legal/privacy-policy.html`, `legal/terms-of-service.html`, `legal/cookie-policy.html`, `legal/disclaimer.html`).
2. The `/legal` index itself states *"These pages are placeholders today. Full, reviewed policies will be published here before BusinessOS launches publicly."* and every summary is future-tense ("will handle", "will govern", "will be used").
3. A sweep of **all 32 rendered routes** for consent/binding phrasing — "by using/submitting/continuing", "I agree", "accept our terms/cookies", "consent to", "subject to our", "in accordance with our", "legally binding", "official polic…" — returned **0 matches** (`tmp-audit/consent-sweep.mjs`). No form or page claims agreement to the placeholder policies.
   → **`OWNER LEGAL CONTENT REQUIRED`** remains open; the *safety* question is closed.

## 14d. Roadmap datasets — three overlapping lists, one table (VERIFIED from source)

- `ROADMAP_STEPS` — 10 items, fields `{label, status, detail}`, **status domain = {`current`, `next`, `future`}** (observed distinct values). Labels: Corporate Website, BusinessOS, EducationOS, HospitalOS, RetailOS, RestaurantOS, ManufacturingOS, LogisticsOS, Enterprise Marketplace, Global Expansion.
- `COMPANY_ROADMAP_STEPS` — 7 items, fields `{label, detail}` (no status): AI Automation Agency, BusinessOS, HM Signature, Future SaaS Products, Enterprise Marketplace, Global Expansion, Worldwide Technology Company.
- `BUSINESSOS_ROADMAP_STEPS` — 7 items, labels: Corporate Website, BusinessOS, EducationOS, HospitalOS, RetailOS, **Enterprise Platform**, Global Expansion.
- Overlap measurement: BusinessOS-roadmap shares **6 of 7** labels with `ROADMAP_STEPS` and renames one (`Enterprise Platform` vs `Enterprise Marketplace`). Company-roadmap shares **3 of 7** and adds 4 narrative milestones absent from the site roadmap.
- `roadmap_steps` holds **10 rows / 8 columns** — consistent with `ROADMAP_STEPS` being the seeded set, but no scope/product discriminator can be confirmed (BLOCKED: M01).
- **Conclusion for Step 10/§17:** a single `roadmap_steps` table cannot faithfully host all three lists; a scope discriminator (e.g. `product_id`/`scope`) or separate tables is **required before CMS migration**. The two 7-item lists must NOT be merged into the 10-row table, and their differing labels must not be reconciled by inventing or deleting milestones.

## 15. Migration History

15 migrations, VERIFIED from the live `supabase_migrations.schema_migrations` listing (Part 01), with timestamps:

```
20260802154455 001_roles_and_helpers        20260803003502 009_security_hardening
20260802154516 002_company_and_founder      20260803003604 010_fix_function_grants
20260802154552 003_content_items            20260803003635 011_finalize_function_grants
20260802154632 004_products_industries_...  20260803003723 012_split_write_policies_for_perf
20260802154659 005_news_press_careers_...   20260803003735 013_missing_fk_indexes
20260802154728 006_contact_and_newsletter   20260803003805 014_consolidate_select_policies
20260803003353 007_brand_pages_and_navigation  20260803182659 015_seed_solutions
20260803003412 008_storage_buckets
```

- Sequence intent is sound: roles/helpers → entities → content → storage → security hardening → grants → policy performance split → FK indexes → policy consolidation → seed.
- Migrations `010`/`011` (function grants) and `012` (write-policy split for performance) and `014` (SELECT consolidation) are exactly the artifacts a policy-quality review must re-read (M06 + those file contents are **not** available locally: the GitHub repo contains **0 SQL files**, verified in Part 02 — the integration is not mirroring `supabase/migrations`).
- **Next migration number: `016`.** No migration was created or applied in Part 02. Historical migrations were not edited.

## 16. Canonical Data Strategy

Adopted: **Supabase is the canonical business/content source; `lib/constants.ts` is a temporary fallback and is not deleted in Part 02.** Full per-export mapping, count parity findings, constants-only/DB-only sets, risks, and the 10-step migration order live in `docs/xeltrio-data-canonicality.md`. Headline results:

- 9 domains show exact count parity (products 12, solutions 9, industries 9, roadmap 10, legal 4, faqs 5, fragrances 4, company 1, founder 1).
- `content_items` (32) cannot account for ~150 constant records → its role is undefined pending M01.
- Nav/footer are constants-only (both tables empty).
- The legal-entity claim must be verified before the switchover.

## 17. Future Database Domains (Step 16 — documented, NOT created)

For each: why · dependencies · planned phase · relationship to existing tables.

| Domain | Tables (candidates) | Why | Depends on | Phase | Relation to existing |
|---|---|---|---|---|---|
| RBAC hardening | `permissions`, `role_permissions`, `user_roles`, `audit_logs` | Current model is a single `profiles.role` string + 2 helpers — adequate for staff/admin; insufficient for per-resource permissions | `profiles`, helper review (§11) | 03 | extends, does not replace `profiles.role` |
| Audit foundation (Step 18) | `audit_logs` (user, action, resource, resource_id, ip?, user_agent?, metadata, success) | Needed before any staff mutation matters | RBAC + first write path | 03 | `user_id → profiles.id`; no secrets/credentials stored |
| CMS | `pages`, `sections`, `page_sections`, `content_versions` | Draft→publish workflow and versioning the site will need | `content_items` definition, publication columns (§10 of Step 10) | 03–04 | `content_items` should become the canonical row store; `pages/sections` only if layout must become editable |
| CRM | `leads`, `contacts`, `companies`, `deals`, `activities`, `tasks`, `notes` | Turn `contact_messages` into an actionable pipeline | RLS review, contact form live | 04 | `contact_messages` → source of generated `leads` |
| Client portal | `clients`, `projects`, `project_members`, `milestones`, `project_tasks`, `project_files`, `messages`, `approvals` | Delivery/portal promise on the site | auth + storage private buckets | 05+ | new ownership-scoped RLS (client isolation by `user_id`) |
| Commercial | `proposals`, `contracts`, `invoices`, `payments` | Billing; payments explicitly prohibited until approved | legal-entity verification, CRM | 07 | links to `clients`/`projects` |
| AI | `ai_agents`, `ai_agent_versions`, `knowledge_sources`, `conversations`, `conversation_messages`, `ai_usage` | Site content becomes grounded knowledge; provider keys stay server-side | auth, storage, CMS | 06 | `knowledge_sources` references storage objects |
| Integrations | `integrations`, `integration_credentials`, `webhooks`, `webhook_events`, `integration_logs` | Third-party sync; secrets must never sit in plaintext rows | RBAC + KMS decision | 06+ | credential rows hold references, not secrets |
| Localization | `countries`, `regions`, `currencies`, `languages`, `locales`, `translations` | Stated markets (Dubai, London, NY, Riyadh, Singapore) + likely Arabic/RTL | CMS canonical first | 08 | `translations(entity_type, entity_id, field, locale)` decorates existing content rows |

**None of these were created.** They are architecture notes for Part 03+, per Step 16's "do not create these simply because they appear on this list."

**Localization non-blockers to check when access returns (Step 17):** content tables must not hardcode `NOT NULL` English copy without a locale concept; `slug` uniqueness should later become per-locale; `GLOBAL_EXPANSION_PHASES`/`GLOBAL_PRESENCE` store free-text regions today, so a future `countries`/`regions` reference will need a mapping; timezone/currency are absent entirely (no billing yet) — acceptable.

## 18. Naming Standards (Step 19)

Recommended standard, measured against what is VERIFIED observable:

- lowercase `snake_case`, plural table names — **already followed** across all 23 tables (VERIFIED names).
- singular function names, verb-prefixed helpers — `handle_new_user`, `is_admin`, `is_staff_editor`, `set_updated_at` conform (VERIFIED).
- timestamps `created_at` / `updated_at` — present on at least some tables (set_updated_at helper exists); per-table coverage **UNVERIFIED** (M13/M14).
- FK columns `<entity>_id` — `products.category_id` VERIFIED; the rest UNVERIFIED.
- future audit-ish columns `created_by` / `updated_by` — **UNVERIFIED** (M13).
- **Documented exceptions:** none needed so far; per the brief, existing tables are **not** renamed (renaming would break policy definitions and the frontend map).

## 19. Security Standards

Carried forward and reinforced:
1. RLS enabled everywhere; keep it enabled; do not force-change policies for integration convenience.
2. Anonymous writes limited to the two inbound forms — preserve; add server-side rate limiting/CAPTCHA before wiring, since a policy is an authorization gate, not an abuse control.
3. Service-role key: server-only, never in a client bundle, never printed; currently no key exists anywhere in the repo (VERIFIED by Part 01 env audit).
4. Security-definer helpers must pin `search_path` and avoid recursive `profiles` reads (§11 UNVERIFIED — verify before Part 03 builds on them).
5. No secrets in rows; sensitive tables (`contact_messages`) must never gain a public SELECT policy.
6. Free-plan reality: no PITR/backups — treat every write as irreversible until backups exist.

## 20. Performance Standards

- `012_split_write_policies_for_perf` and `013_missing_fk_indexes` show the schema already had one policy-performance pass; Part 03 should re-measure with `pg_stat_user_indexes` (M16B) rather than adding indexes speculatively.
- Content reads should stay build-time/ISR so the site keeps 33/33 static rendering; per-request Supabase round-trips are the main regression risk for a currently static site.
- Pagination readiness: content lists are small today (max 32 rows); add `order_index`/`created_at` ordering discipline before any list grows past a page.
- Large text (legal bodies, `content_items` payloads) may warrant TOAST/`select` discipline once sizes are measured (M16C).

## 21. Backup / Recovery Status

**Status: NO BACKUP EXISTS — re-verified in Part 02 completion.** Evidence: the live dashboard overview capture reads `LAST BACKUP — No backups`, plan `FREE`, compute `NANO (t3.nano)`, region `ap-south-1`, status `Healthy` (`docs/_audit_supabase_dashboard_overview.txt`); the Part 02 session's own dashboard snapshots still showed the `FREE` badge. Nothing has changed: the project still has no local `.env*` file, no configured database credentials, and no `supabase/` directory, so no dump path exists from this environment.

**`OWNER-PERFORMED DATABASE EXPORT REQUIRED BEFORE DESTRUCTIVE MIGRATIONS.`**

No dump was taken in Part 02 and **no backup is assumed to exist.** Mandatory before any migration that touches structure or data:
1. Owner-performed export: dashboard backup/export, or `pg_dump` using the connection string from Project Settings → Database (handled by the owner; credentials must never be pasted into chat or committed).
2. Minimum fallback if a dump is impossible: capture M01/M02/M03/M06 output plus the 101 rows as SQL text and store them alongside this documentation.
3. Record the pre-change baseline (all VERIFIED): 15 migrations, 23 tables, 101 rows, 92 policies, 44 indexes, 4 functions, 7 buckets, 2 auth users, 207+ columns.
4. If neither export is possible, **stop before any destructive migration.** Additive-only changes with an explicit written rollback statement are the minimum acceptable risk.

## 22. Migration Strategy

- One numbered migration per logical change, applied via `supabase db push`/dashboard, never ad-hoc DDL: next is **`016_*`**.
- Order of work once DB access is stable:
  1. `016_readonly_baseline_checks` — none needed: verification is queries, not migrations.
  2. `016_timestamps_and_triggers` — add missing `created_at`/`updated_at` + reuse the existing `set_updated_at` (no duplicate trigger functions).
  3. `017_slug_and_status_integrity` — unique slugs per content table, status CHECK/enum reconciliation.
  4. `018_publication_readiness` — published/at/archived semantics without exposing drafts publicly.
  5. `019_index_rationalization` — only gaps with documented query reasons; drop duplicates found by M16B.
  6. `020_audit_log` — if Part 03 proceeds, audit foundation lands with RBAC.
- Every migration must be deterministic, idempotent where practical, and carry an explicit rollback note; historical migrations `001`–`015` are never edited.
- **Part 02 created and applied zero migrations** (per the recovery instruction: no migration creation or application).

## 23. Phase 03 Dependencies (what must be true before Authentication/RBAC)

1. §11 helper-function review complete (SECURITY DEFINER, `search_path`, recursion) — M04.
2. §10 full policy text review — M06, to confirm no table beyond the two inbound forms grants `anon`.
3. §9 `relforcerowsecurity` decision — M07.
4. `profiles` column inventory + role constraint values — M01/M13 (does `role` have a CHECK? is it text or enum?).
5. `audit_logs` design accepted (§17) and created by a new migration, not manual SQL.
6. Backup/dump performed (§21).
7. `@supabase/ssr` + middleware plan (session refresh, `/admin` protection) — frontend-side, out of Part 02 scope.
8. Canonicality gate: legal-entity claim resolved (§16) before `company`/`founder` rows become the rendered source of truth.

---

## Part 02 corrections register (owner-authorized fix pass, 2026-10-05)

Scope of this pass: fix only what evidence had already proven. All protected catalog areas were left untouched.

| FIX | Disposition | Detail |
|---|---|---|
| 1 — products↔categories | **NOT APPLIED — owner decision required** | Proven: `category_id` NULL on 12/12 products, `product_categories` = 3 rows / 6 columns. **The 3 category names are not present in any available evidence**, so no product→category mapping can be derived without inventing categories. The mapping procedure is specified in `docs/xeltrio-data-canonicality.md` §6.9 and must be executed only after the owner confirms the category list. No `UPDATE` was issued. |
| 2 — legal pages | **NO CHANGE NEEDED — verified already safe** | `components/legal/LegalDocument.tsx` renders the literal label `PLACEHOLDER` and the sentence *"This page is a placeholder, not a binding legal document."* on all four routes, and never presents itself as policy. No legal text was written, none was copied into `legal_pages`, and `legal_pages` is **not** made canonical. Registered as: **`OWNER LEGAL CONTENT REQUIRED`**. |
| 3 — unverified legal entity claim | **APPLIED (frontend wording only)** | `"Xeltrio Technologies Private Limited"` → `"Xeltrio Technologies"` at the 4 rendered sites: `lib/constants.ts` `FOUNDER.company` (covers `app/founder/page.tsx:43` and `components/sections/Founder.tsx:41`), `components/layout/Footer.tsx` copyright, `components/sections/HamiaWorksAI.tsx` and `app/hamiaworks-ai/page.tsx` ("DIVISION OF" blocks — meaning preserved). No SECP number, NTN, incorporation date, registration number, registered office, certificate or director information was added anywhere. **Residual, intentionally untouched:** `README.md:3` (internal repository doc, not public UI). Sweep confirms **zero** occurrences remain in `app/`, `components/`, `lib/`. |
| 4 — `content_items` | **NO CHANGE** | Not populated from constants, not deleted, not redesigned, no CMS migration created. Registered blocker: **`content_items semantics are not sufficiently established to become canonical.`** Its 32 rows are untouched. |
| 5 — roadmap datasets | **NO CHANGE, NOT MERGED** | `roadmap_steps` (10), `COMPANY_ROADMAP_STEPS` (7), `BUSINESSOS_ROADMAP_STEPS` (7) left as three distinct scopes. Requirement recorded: **`scope discriminator required before canonical roadmap migration`**. |
| 6 — navigation | **NO CHANGE** | `navigation_items` (0 rows) not populated; frontend `NAV_LINKS` remains the live source. Future CMS requirement recorded in the canonicality doc §5 step 9. |
| 7 — footer | **NO CHANGE** | `footer_links` (0 rows) not populated; the 23 frontend links remain as-is. Future migration only. |
| 8 — `contact_messages` | **NO CHANGE** | The single existing row was not deleted, modified, or read as CRM truth. Registered: **`Existing row provenance requires owner verification.`** |
| 9 — stale planner statistics | **NO ACTION TAKEN** | No `ANALYZE`, no `VACUUM`, no planner configuration change. Registered: **`Planner statistics are stale; ANALYZE requires explicit owner authorization.`** |
| 10 — frontend quality | **APPLIED (2 unused imports)** | `PRODUCT_LEARN_MORE_HREF` removed from the `app/products/page.tsx` import list; `useRef` removed from the `components/layout/Nav.tsx` import list. Both were provably unreferenced in their files. No behavior, markup, styling, or layout change. Result: lint now reports **0 errors, 0 warnings** (previously 2 warnings). Note: the `PRODUCT_LEARN_MORE_HREF` **export** in `lib/constants.ts` is now unreferenced across the codebase; it was deliberately left in place (removal was outside the authorized scope). |
| 11 — protected areas | **UNTOUCHED** | RLS, policies, `SECURITY DEFINER` functions, `search_path`, triggers, `FORCE ROW LEVEL SECURITY`, grants, storage policies, bucket visibility, indexes, sequences, enums, constraints, views, extensions — all still blocked pending live catalog reads, and none was guessed at or altered. |

## Verification register (Part 02 completion)

Status: **PASS** = closed with evidence · **PARTIAL** = some facts closed, remainder named · **BLOCKED** = requires live catalog access; reason stated.

| Ref | Item | Status | Evidence / exact blocker |
|---|---|---|---|
| M01 | Column inventory | **PARTIAL** | Column **counts** for 22/23 tables VERIFIED (§2b); `products` 4 of 12 columns verified by name+type+value (§14b). **BLOCKED:** column names/types/defaults/identity/generated expressions for the other ~203 columns — requires `information_schema`/M01. `testimonials` count also blocked (below capture fold). |
| M02 | Constraint inventory | **BLOCKED** | No constraint definitions obtainable without live access (M02). |
| M03 | Index composition | **PARTIAL** | Count 44 VERIFIED; table sizes VERIFIED (§2b, 16–72 kB each). **BLOCKED:** per-index definitions, uniqueness, PK status, predicates, duplicates (M03). |
| M04 | Function security review | **PARTIAL** | 4 function names + ownership context VERIFIED twice; `products` UPDATE qual references `is_staff_editor()` VERIFIED. **BLOCKED:** bodies, `SECURITY DEFINER`, `search_path`, volatility, grants (M04). |
| M05 | Trigger inventory | **BLOCKED** | Only inference available (`set_updated_at` + `handle_new_user` exist). No trigger rows captured — requires M05. |
| M06 | Full policy review | **PARTIAL** | 92 policies, role distribution (public 90 / anon 2 / authenticated 2), and the exact anon set (`contact_messages` INSERT, `newsletter_subscribers` INSERT) VERIFIED. **BLOCKED:** the other 91 qual/with-check texts (M06). |
| M07 | RLS force status | **BLOCKED** | `relrowsecurity` = true on 23/23 VERIFIED; `relforcerowsecurity` never captured — requires M07. |
| M08 | Grants | **BLOCKED** | Requires M11/M08 (`information_schema.role_table_grants`, `pg_proc` ACLs). |
| M09/M09B | Storage | **PARTIAL** | 7 bucket names VERIFIED, all empty at capture. **BLOCKED:** public/private flags, size limits, MIME lists, object counts today, storage policies (M09/M09B). |
| M10 | Enums / domains | **BLOCKED** | Requires M12. Note: constants-side status vocabulary for roadmaps is `{current,next,future}` (§14d) — useful as the reconciliation target, **not** as a claim about the DB. |
| M12 | `profiles.role` representation | **BLOCKED** | Values `admin`/`staff` VERIFIED; whether plain text / enum / domain / CHECK is unknown (M01+M02+M12). |
| M13 | Sequences / identity | **BLOCKED** | Requires M13. |
| M14 | Views / matviews | **BLOCKED** | Requires M14. (No view-like names among the 23 base tables; the base-table count is confirmed at 23.) |
| M15 | Extensions | **BLOCKED** | Requires M15. |
| M16/B/C | Performance metadata | **PARTIAL — staleness objectively CONFIRMED** | Table sizes VERIFIED (16–72 kB). **Confirmed discrepancy:** the live dashboard lists `ROWS (ESTIMATED)` = **0 for all 22 captured tables** while exact `count(*)` totals **101** across 13 tables — proof that `pg_class.reltuples` was never populated, i.e. no analyze has run on these tables. Consequently scan counters, index-usage figures and cost-based inferences are unreliable evidence, and the Advisor "no performance issues" signal is weak at this scale. **No `ANALYZE`, `VACUUM` or `REINDEX` was executed**; usage statistics are recorded as UNVERIFIED because they cannot be reliably obtained — `Planner statistics are stale; ANALYZE requires explicit owner authorization.` |
| M17 | Catalog reconciliation | **PARTIAL** | All eight counts were live-verified earlier the same day and remain mutually consistent (23 / 101 / 15 / 44 / 92 / 4 / 7 / 2). A **fresh re-count was BLOCKED in the final pass** — the dashboard had dropped to its login screen, so no SQL executed at all that pass. Since this agent ran zero statements, nothing it did could have altered the counts; an owner-initiated change in the interim cannot be ruled out, hence PARTIAL rather than PASS. |

**Root cause for every BLOCKED row:** the only live read-only channel is the Supabase dashboard SQL Editor, and it now requires sign-in. In the final pass the page attached and answered normally (Monaco present, `readyState: complete`), but the SPA was rendering the **login screen**, i.e. the dashboard session had expired. Per instruction a single bounded attempt was made and browser work stopped there — **no sign-in was attempted and no credentials were handled.** Earlier fallbacks were already exhausted and remain exhausted: the GitHub repo holds 0 SQL files, and the project has no `.env*`, no database credentials and no `supabase/` directory. No count, name or constraint in this document was inferred to fill that gap.
| V01 | Duplicate slugs | **PASS (products only)** | 12 slugs, duplicates = 0, all lowercase (§14b). Other slug-bearing tables BLOCKED. |
| V02 | Orphaned FKs | **PASS (products only)** | `category_id` NULL on 12/12 rows → no orphans, but the relationship is unpopulated (§14b). All other FK paths BLOCKED (needs M02/M15). |
| V03 | Invalid statuses | **BLOCKED** | Requires per-table distinct-value reads. |
| V04 | Required-field integrity | **PARTIAL** | One real data-quality issue found on the constants side: `SOLUTIONS` stores the sentence `"Coming in a future ecosystem release"` inside a structured `product` field (and two rows share `BusinessOS`). If that string was seeded into `solutions.product`, it is placeholder prose in a data column — must be checked, not copied (§16 of canonicality doc). |
| V05 | Duplicate business identifiers | **PASS (products slugs) / BLOCKED (emails, codes)** | Slug uniqueness verified for products only; nothing else observable without live reads. |
| V06 | Seed ↔ constants reconciliation | **PARTIAL** | Products: exact content parity (§14b). Roadmap: three-way overlap quantified (§14d). Legal: placeholder divergence proven (§14c). Nav/footer: constants-only, tables empty (VERIFIED counts). `contact_messages` provenance: **BLOCKED** (12 columns exist; source of the 1 row cannot be established from metadata without reading it). |

**Root cause for every BLOCKED row:** the only live read-only channel is the Supabase dashboard SQL Editor; the built-in browser's renderer stopped responding to page-level automation and, per instruction, exactly one bounded probe was made this pass (it timed out) before switching to evidence. No count, name or constraint below was inferred to fill that gap.
