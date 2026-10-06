# Xeltrio Technologies — Database ↔ Frontend Map (Part 02, Step 26)

- **Date:** 2026-10-05
- **Purpose:** the integration contract for later phases — page → component → current constant → target table → target query → required fields → future service-layer module.
- **Derivation:** chains extracted mechanically from source (`tmp-audit/route-map.mjs` scanning `app/**/page.tsx` and `components/**` imports of `@/lib/constants`). Not from memory.
- **Table/row facts:** live read-only counts (`docs/_audit_supabase_counts_final.txt`, re-confirmed in Part 02 for 12/23 tables).
- **Column-level facts:** marked **UNVERIFIED** where catalog access was unavailable in this session. Only `products.id/name/slug/category_id` were directly observed (Table Editor, Part 01).
- **No frontend file was changed. The frontend is still 100% constant-driven (Step 30).**

Legend for the target query: `R` = read (public content), `W` = write (anonymous insert), `—` = no DB surface yet.

---

## Public content pages

| Route | Rendering component(s) | Current constants (count) | Target table (rows) | Q | Future service module | Required fields |
|---|---|---|---|---|---|---|
| `/` (home) | `Hero`, `About`, `EcosystemHub`, `CompanyRoadmap`, `FounderPreview`, `CompanyTrust`, `VisionMission`, `CoreValues`, `WhyXeltrio`, `Technology`, `ProductPreview`, `HamiaWorksAI`, `Roadmap` | `ECOSYSTEM_NODES` (5), `COMPANY_ROADMAP_STEPS` (7), `FOUNDER_PREVIEW` (obj), `COMPANY_TRUST_PILLARS` (8), `CORE_VALUES` (7), `WHY_XELTRIO` (6), `TECHNOLOGY_PILLARS` (5), `ROADMAP_STEPS` (10), `ECOSYSTEM_PRODUCTS` (12), `HAMIAWORKS_SERVICES` (11) | `content_items` (32) · `products` (12) · `roadmap_steps` (10) · `company` (1) · `founder` (1) | R | `lib/db/content.ts`, `lib/db/products.ts` | `content_items`: type/category/slug? **UNVERIFIED** — this is the single most important unknown for the home page |
| `/products` | page + `ProductGlyph` | `ECOSYSTEM_PRODUCTS` (12: `name, description, badge`) — **content-identical to the DB rows**, `PRODUCT_LEARN_MORE_HREF` (map, currently unused import) | `products` (12 rows / **12 cols**, 64 kB) + `product_categories` (3 rows / 6 cols) | R | `lib/db/products.ts` | VERIFIED: `id` uuid, `category_id` uuid (**NULL on all 12 rows**), `name`, `slug` (12 unique, lowercase). Still UNKNOWN: the other 8 columns (badge/description/status/ordering/visibility — M01). **Migration caution:** `category_id` is unpopulated, so category grouping cannot render from the DB until that FK is filled by an owner-reviewed seed. |
| `/solutions` | page + `Reveal*` | `SOLUTIONS` (9: `industry, product, problem, solution`) | `solutions` (9) | R | `lib/db/solutions.ts` | all columns **UNVERIFIED** |
| `/industries` | page + `Reveal*` | `INDUSTRIES` (9: `slug, name, description, challenge, aiSolution, futureProduct`) | `industries` (9) | R | `lib/db/industries.ts` | constants carry `slug`; DB slug/uniqueness **UNVERIFIED** |
| `/roadmap` | `RoadmapTimeline` | `ROADMAP_STEPS` (10: `label, status, detail`), `ROADMAP_YEAR` | `roadmap_steps` (10) | R | `lib/db/roadmap.ts` | `status` exists in constants — DB status/ordering **UNVERIFIED** |
| `/technology` | page + `Reveal*` | `TECHNOLOGY_DEEP_DIVE` (12) | `content_items` (32) or none | R/— | `lib/db/content.ts` | mapping **UNVERIFIED** |
| `/ai-future` | `AIFutureJourney` | `AI_FUTURE_STAGES` (6) | `content_items` or none | — | `lib/db/content.ts` | mapping **UNVERIFIED** |
| `/research` | page + `Reveal*` | `RESEARCH_AREAS` (6) | `content_items` or none | — | `lib/db/content.ts` | mapping **UNVERIFIED** |
| `/resources` | page + `Reveal*` | `RESOURCES_SECTIONS` (7) | `resources` (**0**) | — | `lib/db/resources.ts` | table empty → CMS phase |
| `/careers` | page + `Reveal*` | `CAREERS_PILLARS` (4) | `careers_jobs` (**0**) | — | `lib/db/careers.ts` | table empty → CMS phase |
| `/investor-relations` | page + `Reveal*` | `INVESTOR_RELATIONS_SECTIONS` (4), `MEDIA_CENTER_SECTIONS` (4) | `content_items` / `press_releases` (**0**) | — | `lib/db/content.ts` | tables empty |
| `/global-expansion` | `GlobalPresenceMap` (+ page) | `GLOBAL_EXPANSION_PHASES` (4: `phase, region, detail`), `GLOBAL_PRESENCE` (obj) | `content_items` or none; needs `countries` later | — | `lib/db/content.ts` | no country/region reference table exists (localization readiness item, Step 17) |
| `/hamiaworks-ai` | page + `Reveal*`, `HamiaWorksAI` (section) | `HAMIAWORKS_SERVICES` (11) | `content_items` / `services` (none) | — | `lib/db/content.ts` | DOMAIN 04 decision: `solutions` vs new `services` — see foundation doc §17 |
| `/founder` | `FounderPortrait`, `Founder` (as `FounderCoreSection`) | `FOUNDER` (obj), `FOUNDER_MISSION_STATEMENT`, `FOUNDER_VISION_STATEMENT`, `FOUNDER_COMPANY_VISION`, `FOUNDER_VISION_CARDS` (8), `FOUNDER_HIGHLIGHTS` (5), `FOUNDER_TIMELINE` (6) | `founder` (1) + `company` (1) | R | `lib/db/company.ts` | one row must absorb several exports; cards/highlights/timeline have no table → `content_items` candidates |
| `/hm-signature` | `PerfumeBottleVisual`, `PackagingVisual`, `HMSignatureLogo` | `HM_SIGNATURE` (obj), `HM_BRAND_STORY`, `HM_PHILOSOPHY_PILLARS` (4), `HM_WHY_REASONS` (4), `HM_COLLECTION_PREVIEW` (4), `HM_INGREDIENTS` (6), `HM_CRAFTSMANSHIP_STEPS` (6), `HM_FUTURE_VISION` (3), `HM_SIGNATURE_ASSETS` (obj) | `hm_signature_fragrances` (4) + `brand_pages` (**0**) | R/— | `lib/db/hmSignature.ts` | DOMAIN 11: keep HM Signature rows separate from corporate `products` — do not merge |

## BusinessOS cluster (10 routes)

| Route | Current constants (count) | Target | Q | Note |
|---|---|---|---|---|
| `/businessos` | `BUSINESSOS_MODULES` (16), `BUSINESSOS_PILLARS` (4), `ECOSYSTEM_PRODUCTS` (12), `ArchitectureDiagram`→`BUSINESSOS_ARCHITECTURE_LAYERS` (5) | `products` (BusinessOS = one of the 12 products) + `content_items` | R | product-level content; needs a product↔content link (**UNVERIFIED** whether one exists) |
| `/businessos/modules` | `BUSINESSOS_MODULES_GRID` (18) | `content_items` or a future `product_modules` | — | 18 records, no table |
| `/businessos/features` | `BUSINESSOS_FEATURES` (19) | `content_items` or future `product_features` | — | 19 records, no table |
| `/businessos/ai-platform` | `AI_PLATFORM_CAPABILITIES` (10) | none | — | — |
| `/businessos/security` | `SECURITY_PILLARS` (7) | none | — | — |
| `/businessos/technology` | `BUSINESSOS_TECH_STACK` (10) | none | — | — |
| `/businessos/enterprise` | `ENTERPRISE_FEATURES` (6) | none | — | — |
| `/businessos/architecture` | `BUSINESSOS_ARCHITECTURE_LAYERS` (5) via `FlowDiagram` | none | — | — |
| `/businessos/roadmap` | `BUSINESSOS_ROADMAP_STEPS` (7) via `RoadmapTimeline` | `roadmap_steps` (10) — **scope conflict** | R? | Roadmap table must distinguish company vs product roadmap (Step 10/§4 canonicality risk #2) |
| shared `BusinessOSSubNav` | `BUSINESSOS_SUBNAV` (9) | `navigation_items` (**0**) | — | nav should become DB-driven |

## Legal cluster (5 routes)

| Route | Component | Current constant | Target | Q | Note |
|---|---|---|---|---|---|
| `/legal` | index + `Reveal*` | `LEGAL_PAGES` (4: `slug, title, summary`, `topics[]` — **no body text**) | `legal_pages` (4 rows / **8 cols**, 48 kB) | R | **VERIFIED SAFE + DIVERGENCE:** all four detail routes render the literal `PLACEHOLDER` / "not a binding legal document" disclaimer, the index says "These pages are placeholders today", and a sweep of **all 32 rendered routes** found **0** consent/binding-style assertions (`tmp-audit/consent-sweep.mjs`). Whether `legal_pages` holds bodies is BLOCKED (M01). **`OWNER LEGAL CONTENT REQUIRED` — do not generate legal text, and do not make this route DB-backed before owner review.** |
| `/legal/privacy-policy`, `/legal/terms-of-service`, `/legal/cookie-policy`, `/legal/disclaimer` | `LegalDocument` | `LEGAL_PAGES` (lookup by slug; slugs verified: `privacy-policy`, `terms-of-service`, `cookie-policy`, `disclaimer`) | `legal_pages` | R | version/effective-date fields required for future legal versioning — BLOCKED (M01) |

## Contact cluster

| Element | Component | Current constants | Target table | Q | Note |
|---|---|---|---|---|---|
| `/contact` cards | `ContactCards`, `GlobalPresenceMap`, `SocialMediaLinks` | `CONTACT_INFO_CARDS` (5), `WHY_CONTACT_XELTRIO` (5), `GLOBAL_PRESENCE`, static URLs | `company` (1) | R | email/phone/address are company records, not per-page constants |
| `/contact` form | `ContactForm` | `CONTACT_SERVICE_OPTIONS`, `CONTACT_BUDGET_OPTIONS` (4), `CONTACT_TIMELINE_OPTIONS` (4) | `contact_messages` (1 row / **12 cols**, 48 kB) | **W** | submission is currently simulated (`ContactForm.tsx:27` `setTimeout`); the anon `INSERT` policy already exists — do not wire it without validation + rate limiting. **Provenance of the single existing row is unresolved** (the site cannot have written it): read its timestamp/source columns before treating it as CRM data, and do not delete it. Which 12 columns exist is BLOCKED (M01) — that list defines the form's field contract. |
| `/contact` FAQ | `ContactFAQ` | `CONTACT_FAQ` (5) | `faqs` (5) | R | count parity |
| newsletter | **no UI exists** | none | `newsletter_subscribers` (0) | W | anon `INSERT` policy exists with no consumer |

## Chrome (global)

| Element | Component | Current constant | Target | Q |
|---|---|---|---|---|
| Header nav | `Nav` | `NAV_LINKS` — 9 top-level entries with nested `children` (12 labels total: Home, About, Services, Products, BusinessOS, All Products, Industries, HamiaWorks AI, Founder, HM Signature, Careers, Contact) | `navigation_items` (**0 rows / 9 cols**) | R (later) | target must prove it can express parent/child nesting — BLOCKED (M01) |
| Footer | `Footer` | 6 × `FOOTER_*_LINKS` = **23 links** (Company 3 + Products/Solutions/Industries/Resources/Legal 4 each) | `footer_links` (**0 rows / 8 cols**) | R (later) | grouping column unknown — BLOCKED (M01) |
| Metadata/SEO | `app/layout.tsx` + per-page `metadata` | hardcoded strings | `legal_pages`/`content_items` for descriptions later | R |
| Realtime note | — | — | `company` is the **only** table with Supabase Realtime **Enabled** | — | worth an explicit owner decision in Part 03; incidental realtime on a single-row company table is rarely intended. Not changed. |

---

## Query contract for the future service layer (pattern, not implemented)

```
lib/db/<domain>.ts          (server-only)
  select: <fields the component actually renders>
  from:   <table>
  where:  published/visible (column UNVERIFIED — see Step 10)
  order by: ordering column (UNVERIFIED — see Step 7)
  limit/range: pagination readiness (Step 23)
```

Rules for whoever implements Phase 03+:
1. The service module's return shape must **match the constant's shape today**, so section components need zero visual changes.
2. One module per domain; components never import the Supabase client.
3. Reads run at build/ISR time to preserve the current all-static output.
4. Writes (contact/newsletter) go through server actions with validation + rate limiting; the anon policy alone is not a safety control.
5. Where a required column is `UNVERIFIED`, resolve it with M01 before writing the query.

**No frontend or database file was modified to produce this map.**
