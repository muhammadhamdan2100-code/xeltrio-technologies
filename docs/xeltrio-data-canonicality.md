# Xeltrio Technologies — Data Canonicality Plan (Part 02, Step 6)

- **Date:** 2026-10-05
- **Rule adopted:** **Supabase = canonical business/content source.** `lib/constants.ts` = temporary fallback/reference only. **`lib/constants.ts` is NOT deleted in Part 02** and the frontend is NOT yet connected to Supabase (Step 30).
- **Evidence basis:** constants side = local static analysis (`tmp-audit/scan-constants.mjs`, `tmp-audit/constants-shapes.mjs`, `tmp-audit/verify-constants-counts.mjs` — element counts cross-checked by two independent methods). Database side = live read-only counts from `docs/_audit_supabase_counts_final.txt` + Part 02 re-verification `docs/_audit_p02/live-verification-log.md`.
- **Status legend:** `PARITY` (counts match) · `CONSTANTS_ONLY` (no table or table empty) · `DB_ONLY` (no frontend surface) · `UNVERIFIED` (needs M01-M17 catalog access).

---

## 1. Content that exists in BOTH (constants ↔ database)

| Frontend Constant | Items | Supabase Table | Rows | Canonical Source | Migration Status |
|---|---|---|---|---|---|
| `ECOSYSTEM_PRODUCTS` (`{name, description, badge}`) | 12 | `products` | 12 | Supabase | PARITY on count — field mapping PENDING (needs M01) |
| `SOLUTIONS` (`{industry, product, problem, solution}`) | 9 | `solutions` | 9 | Supabase | PARITY on count — field mapping PENDING |
| `INDUSTRIES` (`{slug, name, description, challenge, aiSolution, futureProduct}`) | 9 | `industries` | 9 | Supabase | PARITY on count; `slug` exists on the constants side; DB `slug` UNVERIFIED |
| `ROADMAP_STEPS` (`{label, status, detail}`) | 10 | `roadmap_steps` | 10 | Supabase | PARITY on count; constants carry a `status` field — DB status column UNVERIFIED |
| `LEGAL_PAGES` (`{slug, title, summary, topics[]}`) | 4 | `legal_pages` | 4 | Supabase | PARITY on count; constants hold **summary + topics only, no body text** → the table must carry the full document (UNVERIFIED) |
| `CONTACT_FAQ` | 5 | `faqs` | 5 | Supabase | PARITY on count |
| `HM_COLLECTION_PREVIEW` | 4 | `hm_signature_fragrances` | 4 | Supabase | PARITY on count (probable mapping; UNVERIFIED) |
| `FOUNDER` (+ `FOUNDER_PREVIEW`, `FOUNDER_MISSION_STATEMENT`, `FOUNDER_VISION_STATEMENT`, `FOUNDER_COMPANY_VISION`) | 1 object + 3 statements + 1 preview | `founder` | 1 | Supabase | PARITY (1 row); spread across 5-6 exports → column mapping UNVERIFIED |
| `GLOBAL_PRESENCE`, `CONTACT_INFO_CARDS`, `COMPANY_TRUST_PILLARS` (company-level facts) | — | `company` | 1 | Supabase | PARITY (1 row); mapping UNVERIFIED |

**Read of this section:** every mapped domain agrees on row count today. That is encouraging but it does **not** mean the content is identical — it only means nobody has edited either side since seeding. Column-level diffing is exactly what M01 + V01-V06 will establish.

## 2. Content that exists ONLY in constants (no database home, or table exists but empty)

| Frontend Constant | Items | Nearest table | Table rows | Disposition |
|---|---|---|---|---|
| `NAV_LINKS` (with nested `children`) | 9 top-level + children | `navigation_items` | **0** | Migrate into `navigation_items` when CMS starts (hierarchy shape UNVERIFIED) |
| `FOOTER_COMPANY_LINKS` / `_PRODUCT_` / `_SOLUTIONS_` / `_INDUSTRIES_` / `_RESOURCE_` / `_LEGAL_` | 3 + 4×5 = 23 links | `footer_links` | **0** | Migrate to `footer_links` (group column UNVERIFIED) |
| `ROADMAP_YEAR` (string) | 1 | `roadmap_steps` | 10 | Derived value; should come from data or config, not a constant |
| `COMPANY_ROADMAP_STEPS` | 7 | none | — | CONSTANTS_ONLY — decide: belongs in `roadmap_steps` (then `roadmap_steps` = 10 + 7 rows? conflict) or stays UI copy |
| `BUSINESSOS_ROADMAP_STEPS` | 7 | none | — | CONSTANTS_ONLY (product-specific roadmap) |
| `BUSINESSOS_MODULES` / `_MODULES_GRID` / `_FEATURES` / `_PILLARS` / `_ARCHITECTURE_LAYERS` / `_TECH_STACK` / `_SUBNAV` / `_FLOW_STEPS` | 16 / 18 / 19 / 4 / 5 / 10 / 9 / 8 | `content_items` (32) | 32 | AMBIGUOUS — `content_items` cannot absorb all of these under 32 rows; must confirm what the 32 rows actually are (UNVERIFIED) |
| `CORE_VALUES` 7, `WHY_XELTRIO` 6, `TECHNOLOGY_PILLARS` 5, `TECHNOLOGY_DEEP_DIVE` 12, `RESEARCH_AREAS` 6, `AI_FUTURE_STAGES` 6, `AI_PLATFORM_CAPABILITIES` 10, `SECURITY_PILLARS` 7, `ENTERPRISE_FEATURES` 6, `GLOBAL_EXPANSION_PHASES` 4, `RESOURCES_SECTIONS` 7, `CAREERS_PILLARS` 4, `PRESS_SECTIONS` 4, `INVESTOR_RELATIONS_SECTIONS` 4, `MEDIA_CENTER_SECTIONS` 4, `COMPANY_TRUST_PILLARS` 8, `WHY_CONTACT_XELTRIO` 5, `CONTACT_CHANNELS` 2, `CONTACT_SERVICE_OPTIONS`, `CONTACT_BUDGET_OPTIONS` 4, `CONTACT_TIMELINE_OPTIONS` 4, `HAMIAWORKS_SERVICES` 11, `ECOSYSTEM_NODES` 5, `PRODUCT_LEARN_MORE_HREF` (map) | ~150 records | `content_items` | 32 | MOSTLY CONSTANTS_ONLY — `content_items` is under-populated relative to the constant surface; per-domain decision needed at integration time |
| `HM_SIGNATURE` (config object), `HM_SIGNATURE_ASSETS`, `HM_BRAND_STORY`, `HM_PHILOSOPHY_PILLARS` 4, `HM_WHY_REASONS` 4, `HM_INGREDIENTS` 6, `HM_CRAFTSMANSHIP_STEPS` 6, `HM_FUTURE_VISION` 3 | ~30 records | none | — | CONSTANTS_ONLY — brand narrative; if HM Signature becomes a CMS-managed brand, needs `brand_pages` (currently 0 rows) |
| `FOUNDER_VISION_CARDS` 8, `FOUNDER_TIMELINE` 6, `FOUNDER_HIGHLIGHTS` 5 | 19 records | none | — | CONSTANTS_ONLY — candidate for `content_items` or a founder-extensions table later |

## 3. Content that exists ONLY in the database

| Table | Rows | Frontend surface | Note |
|---|---|---|---|
| `profiles` | 2 (`admin`, `staff`) | none | Auth/RBAC side — stays DB-canonical forever |
| `contact_messages` | 1 | **none** (form is simulated) | Provenance UNVERIFIED — the deployed site has never inserted a row. Either a manual test insert or a submission from another channel. Must be established before treating this table as live CRM data. |
| `product_categories` | 3 | implicit (no category constants) | DB-only structure — frontend grouping is currently hardcoded inside `ECOSYSTEM_PRODUCTS`/page layout |
| `testimonials`, `announcements`, `brand_pages`, `careers_jobs`, `news_articles`, `newsletter_subscribers`, `press_releases`, `resources` | 0 | none | FUTURE — schema ahead of need |

## 4. Inconsistencies and risks identified now

1. **`content_items` (32 rows) is the ambiguous bucket.** Roughly 150 discrete records live in constants; 32 rows cannot mirror them. Until M01 shows the actual columns and rows of `content_items`, nobody can say which frontend domains it is meant to canonicalize. **Highest-priority verification item.**
2. **Three different roadmap datasets.** `ROADMAP_STEPS` (10) matches `roadmap_steps` (10), while `COMPANY_ROADMAP_STEPS` (7) and `BUSINESSOS_ROADMAP_STEPS` (7) have no table. A single `roadmap_steps` table serving all three would need a discriminator column (`product_id`/`scope`) — UNVERIFIED whether one exists.
3. **Legal bodies are not in constants.** `LEGAL_PAGES` holds `summary` + `topics[]` only; the rendered legal text must therefore live in components or the DB. If `legal_pages.content` (UNVERIFIED) is the real body, then legal content is already split across two systems — a compliance-relevant divergence. **Do not write fake legal content** to reconcile it.
4. **Navigation and footer are 100% constants** while both tables are empty — the CMS will need these seeded into `navigation_items`/`footer_links` before an admin can edit menus.
5. **Unverifiable business claims propagate into the canonical source.** `"Xeltrio Technologies Private Limited"` appears in `lib/constants.ts:918` (FOUNDER.company), `components/sections/HamiaWorksAI.tsx:29`, `components/layout/Footer.tsx:62`, `app/hamiaworks-ai/page.tsx:80`, `README.md:3` — and is very likely mirrored into the seeded `company`/`founder` rows. Once Supabase becomes canonical, an unverifiable legal-entity claim becomes the system of record. **CONTENT VERIFICATION REQUIRED before that switchover** (registration evidence, e.g. SECP). Flag carried from Part 01 §12/§17.
6. **`contact_messages` provenance** (above) — a real inbound record must not be conflated with test data once the CRM phase starts.

## 5. Migration order for canonicality (to execute in later phases, NOT now)

Lowest-risk-first, one domain at a time, each verified by rendered-output comparison before the constant is retired:

1. `faqs` ← `CONTACT_FAQ` (5↔5, simplest shape)
2. `legal_pages` ← `LEGAL_PAGES` (4↔4) — only after confirming the body column exists
3. `industries` ← `INDUSTRIES` (9↔9, slug present)
4. `solutions` ← `SOLUTIONS` (9↔9)
5. `roadmap_steps` ← `ROADMAP_STEPS` (10↔10) — after resolving the 3-way roadmap ambiguity
6. `products` ← `ECOSYSTEM_PRODUCTS` (12↔12) + `product_categories` join
7. `hm_signature_fragrances` ← `HM_COLLECTION_PREVIEW` (4↔4)
8. `company` / `founder` ← `FOUNDER`, `GLOBAL_PRESENCE`, `CONTACT_INFO_CARDS` — **gated on item 5 of §4 (legal-entity verification)**
9. `navigation_items` / `footer_links` ← `NAV_LINKS` / `FOOTER_*` (seed empty tables from constants)
10. Decide `content_items`' role only after M01/M08 detail is available.

**Deletion policy:** constants are removed per-domain only after the Supabase-driven render is diffed against the constant-driven render. Until then both remain in the tree, with constants clearly marked as fallback.

---

## 6. Part 02 completion — resolutions proven from evidence (no DB writes)

### 6.1 Products — exact CONTENT parity (upgraded from count parity)

All 12 `products` rows were read live (§14b of the foundation doc): names **HospitalOS, LogisticsOS, RestaurantOS, Finance, BusinessOS, RetailOS, EducationOS, Future AI Products, Inventory, HRMS, ManufacturingOS, CRM**. A set comparison against `ECOSYSTEM_PRODUCTS` returns **zero difference in either direction**. So this domain is not merely the same size — it is the same content, duplicated. Consequence: it is the safest first migration target, and the correct end state is "render from `products`, delete the constant".

### 6.2 `content_items` — remains a documented blocker (not guessed)

Verified: **14 columns, 32 rows, 72 kB** (largest table by captured size). Constants hold roughly 150 discrete records across ~35 arrays. The 32 rows cannot mirror that surface, and without a column/row read there is no evidence for what `content_items` *is* (generic key-value? typed blocks? per-page JSON?). **Decision: leave as a blocker.** It is the highest-value single read in Part 03 (`M01` + `select * from content_items limit 32`), and the answer determines whether the CMS needs one table, two (`pages`/`sections`), or a per-domain table set. No merge was attempted.

### 6.3 Roadmap — three lists, one table, quantified overlap

`ROADMAP_STEPS` (10, status ∈ {current, next, future}) matches `roadmap_steps` (10 rows / 8 columns) on count. `COMPANY_ROADMAP_STEPS` (7) and `BUSINESSOS_ROADMAP_STEPS` (7) do not. Measured overlap: the BusinessOS list shares **6 of 7** labels with the site list but renames one (`Enterprise Platform` vs `Enterprise Marketplace`); the company list shares **3 of 7** and carries 4 narrative milestones found nowhere else (AI Automation Agency, HM Signature, Future SaaS Products, Worldwide Technology Company). **A scope/product discriminator is required before any of these can share a table, and the differing labels must not be reconciled by inventing or deleting milestones.** Merge not performed.

### 6.4 Legal — placeholder divergence proven

`components/legal/LegalDocument.tsx` prints the literal word **PLACEHOLDER** plus "This page is a placeholder, not a binding legal document." on all four legal routes, and renders only `summary` + `topics[]` from `LEGAL_PAGES` (4 entries: `privacy-policy`, `terms-of-service`, `cookie-policy`, `disclaimer`). No full legal text exists anywhere in the frontend. Whether `legal_pages` (4 rows / 8 columns) holds bodies is BLOCKED. **Compliance flag: switching legal routes to DB content could silently convert a self-declared non-binding placeholder into text that presents as a real policy — owner content review required, and no agent may author filler legal text.**

### 6.5 Navigation and footer — shape gap documented (no migration performed)

- `NAV_LINKS`: 9 top-level entries with nested `children` (12 label strings in total, incl. dropdown items: Home, About, Services, Products, BusinessOS, All Products, Industries, HamiaWorks AI, Founder, HM Signature, Careers, Contact).
- `navigation_items`: **0 rows / 9 columns** — column names unknown (BLOCKED), so parent/child representation cannot be confirmed to support nesting.
- Footer: 6 arrays totalling **23 links** grouped Company/Products/Solutions/Industries/Resources/Legal (3 + 4×5). `footer_links`: **0 rows / 8 columns**.
- Safe later, once M01 shows the columns: seed rows from constants, render from DB, keep constants as fallback. Nesting and grouping are the two features the target schema must prove it can express.

### 6.6 Data-quality finding on the constants side (must not be seeded forward)

`SOLUTIONS` stores the prose **"Coming in a future ecosystem release"** inside its structured `product` field for one industry (Real Estate), and two of the nine rows resolve to `product=BusinessOS`. If that exact string was carried into `solutions` during `015_seed_solutions`, then the canonical table contains placeholder prose where a nullable `product` reference belongs. This is a **V04 finding about the constants**, not a claim about the DB — confirming it needs the `solutions` column read. It must not be "fixed" by inventing a product name.

### 6.7 `contact_messages` provenance — unresolved, bounded honestly

The table has **12 columns** and 1 row. The deployed frontend cannot have inserted it (submission is a `setTimeout`), and no other writer exists in the project. Whether the row came from a manual dashboard insert, a pre-launch test, or an older build cannot be determined from metadata alone without reading the row and its timestamps/source columns (BLOCKED: needs M01 + one content read). **Do not treat it as production CRM data until provenance is established; do not delete it.**

Standing token: **`OWNER VERIFICATION REQUIRED`** — the row was not read, classified as real or test, modified, or deleted in any pass.

### 6.8 Slug convention — a real divergence to decide, not to auto-normalize

`products` slugs are space-stripped (`hospitalos`, `manufacturingos`) except `future-ai-products`; the constants-side `INDUSTRIES` slugs are hyphenated (`real-estate`). Two conventions coexist. Normalizing either side is a URL-visible change, so Step 9's slug standard needs an owner decision (recommended: hyphenated lowercase, applied only to *new* rows, with existing slugs preserved).

### 6.9 Product→category mapping — procedure defined, deliberately NOT applied

**Proven state:** `products` = 12 rows, `product_categories` = 3 rows, and `products.category_id` is **NULL on all 12 rows**. So the relationship exists structurally but carries no information today: category grouping cannot render from the database, and "no orphans" is true only by vacuity.

**Why no mapping was applied:** the names of the 3 existing categories appear in **no available evidence** — Part 01 captured the table's row count and column count only. Assigning products to categories without knowing which categories exist would mean inventing the taxonomy, which is prohibited.

**The deterministic procedure, to run once the category list is known and owner-confirmed:**
1. Read `select id, name, slug from product_categories order by name;` (one SELECT, no change).
2. For each of the 12 product names, test membership against a category by **exact name correspondence only** — e.g. a category named `Vertical OS` / `Enterprise` / `Horizontal` must map by an unambiguous label match, not by inference about what the product does.
3. Classify each product: `unambiguous` (exactly one category matches on evidence) · `ambiguous` (zero or multiple plausible categories) · `no category` (leave NULL).
4. Update **only** the `unambiguous` set, in one small migration with an explicit rollback statement, after a database export exists (foundation doc §21).
5. Leave `ambiguous` and `no category` rows NULL and list them for owner decision.

**Product names available for that mapping (VERIFIED, 12):** HospitalOS, LogisticsOS, RestaurantOS, Finance, BusinessOS, RetailOS, EducationOS, Future AI Products, Inventory, HRMS, ManufacturingOS, CRM.

**Owner decision required before any write:** confirm/adjust the 3 category names and approve the resulting mapping table.

**Final pass status:** the browser session had expired to the dashboard login screen, so the category names could not be retrieved and **no product was modified**. Standing blocker token:

> **`OWNER DECISION REQUIRED — PRODUCT CATEGORY TAXONOMY`**

Closing it needs one read (`select id, name, slug from product_categories;`) plus the owner's approval of the §6.9 mapping. Frontend evidence offers no substitute: `ECOSYSTEM_PRODUCTS` carries only `{name, description, badge}` with badge values {`Coming Soon` ×10, `First Vertical`, `In Development`, `Roadmap` ×2} — status labels, not categories — and `INDUSTRIES` is a 9-entry vertical list that does not correspond 1:1 to 3 product categories. Deriving a taxonomy from those would be invention.

---

**Prepared without modifying any production file or database object.**

*Amendment (fix pass, same day): frontend wording and unused-import changes were subsequently authorized and applied — see `docs/xeltrio-database-foundation.md`, "Part 02 corrections register". No database object or row was changed by that pass; in particular the category mapping in §6.9 was **not** applied.*
