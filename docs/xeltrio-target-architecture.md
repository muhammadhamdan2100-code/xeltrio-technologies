# Xeltrio Technologies — Target Architecture (Part 01, Step 10)

- **Date:** 2026-10-05
- **Status:** Architecture proposal only. Nothing in this document is implemented. Phase 01 is read-only.
- **Companion document:** `docs/xeltrio-technical-audit.md` (findings, evidence, gap analysis)
- **Governing constraint:** the existing visual identity, layout, colors, typography, spacing, animations, and responsive behavior are frozen. Backend integration must slot underneath the current frontend, not redesign it.

---

## System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                              │
│  Next.js 16 App Router · React 19 · Tailwind v4 · 33 static routes │
│  (visual identity frozen — backend integration changes data only)  │
└───────────────┬────────────────────────────────────────────────────┘
                │  reads: server components (static/ISR)
                │  writes: server actions (validated, rate-limited)
┌───────────────▼────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                            │
│  lib/db/* typed data access · server actions · route handlers     │
│  (only layer that talks to Supabase)                               │
└───────┬───────────────────────┬───────────────────────┬────────────┘
        │                       │                       │
┌───────▼───────┐     ┌─────────▼─────────┐   ┌─────────▼─────────┐
│ DATA LAYER    │     │ AUTH LAYER        │   │ STORAGE LAYER     │
│ Supabase PG   │     │ Supabase Auth     │   │ Supabase Storage  │
│ 23 tables ·   │     │ sessions, cookies │   │ 7 buckets         │
│ RLS 23/23     │     │ RBAC+RLS below →  │   │ next/image        │
└───────────────┘     └─────────┬─────────┘   └───────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │ AUTHORIZATION         │
                    │ RBAC (profiles.role)  │
                    │ + RLS helper functions│
                    │ is_admin/is_staff_edit│
                    └───────────┬───────────┘
                                │
┌───────────────────────────────▼────────────────────────────────────┐
│                      BUSINESS LAYER                                │
│  CMS · CRM · Projects · Billing · AI Employees (future phases)     │
└───────┬───────────────────────┬───────────────────────┬────────────┘
        │                       │                       │
┌───────▼───────┐     ┌─────────▼─────────┐   ┌─────────▼─────────┐
│ INTEGRATION   │     │ AI LAYER          │   │ LOCALIZATION      │
│ email, webhook│     │ providers behind  │   │ next-intl, DB     │
│ external APIs │     │ server boundary   │   │ content, RTL prep │
└───────────────┘     └───────────────────┘   └───────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │ OBSERVABILITY         │
                    │ analytics · errors ·  │
                    │ audit logs · uptime   │
                    └───────────────────────┘
```

**Golden rule:** data flows upward through the Application Layer only. Components never import the Supabase client directly; the client never sees service-role credentials; RLS remains the final enforcement boundary at the Data Layer.

---

## 1. Frontend Layer

**Purpose:** render the public website (existing) and future authenticated surfaces (`/admin`) without visual change to the public site.

| Aspect | Current | Target |
|---|---|---|
| Framework | Next.js 16.2.12 App Router, React 19, Tailwind v4 | unchanged |
| Rendering | 33/33 routes static (○) | public read pages: static/ISR revalidation; admin pages: dynamic |
| Data today | `lib/constants.ts` (65 KB, 59 exports) | components receive data via props from the Application Layer; constants become fallback/seed-reference only |
| Client JS | three.js (897 KB) lazy on 2 routes only | unchanged — backend integration must not add client-side fetch waterfalls |
| Motion/3D/cursor | framer-motion, GSAP, lazy canvases, error-boundary fallbacks | unchanged |

**Constraints:**
- Visual identity, layout, animation, and responsive behavior are frozen (Phase 01 rule; still binding through Phase 02 unless a minimal change is unavoidable and approved).
- New interactive surfaces (forms, `/admin`) follow the existing design language using existing components/primitives.
- Keep the all-static public build as long as possible: prefer build/ISR reads over request-time SSR for content pages.

---

## 2. Application Layer

**Purpose:** the single seam between the frontend and everything below. All Supabase access, validation, and orchestration lives here.

Planned shape (Phase 02):

```
lib/
├── supabase/
│   ├── client.ts        # browser client (anon key) — only for future client-side needs
│   ├── server.ts        # server client (anon key + cookies) for RSC reads
│   └── admin.ts         # service-role client — server-only, never imported by components
├── db/
│   ├── content.ts       # typed reads: company, solutions, industries, products, ...
│   ├── legal.ts
│   └── faqs.ts
└── actions/
    ├── contact.ts       # validated contact submission → contact_messages
    └── newsletter.ts    # validated subscribe → newsletter_subscribers
```

| Concern | Decision |
|---|---|
| Reads | server components → `lib/db/*` → Supabase (anon key, RLS SELECT). Static/ISR with per-domain `revalidate`. |
| Writes | server actions with schema validation (e.g. zod), honeypot + rate limiting, typed `{ ok, data } \| { ok, error }` results |
| Secrets | service-role key only inside `lib/supabase/admin.ts`, marked server-only; never reaches client bundles |
| Errors | mapped server-side to user-safe messages; no raw Supabase errors surfaced |
| Boundary rule | components import from `lib/db`/`lib/actions` — **never** from `lib/supabase/*` directly |

**Transition strategy (critical):** introduce a typed function per content domain whose return shape matches the existing constants' shape. Swap the import source in section components one domain at a time (`solutions` first — 9 rows), diff the rendered HTML against the constant-driven build, and only then delete the duplicate constants. This preserves pixel-parity while moving the source of truth.

---

## 3. Data Layer (Supabase PostgreSQL)

**Purpose:** canonical content and business data store.

**Current state (verified):** 23 tables, RLS 23/23, 92 policies, 44 indexes, 15 migrations (001→015), 101 seeded rows, 2 auth users, 7 storage buckets — project `yparzhgzhpwewyrjhqud`, FREE plan (ap-south-1).

**Domains (existing tables):**

| Domain | Tables |
|---|---|
| Identity & RBAC | `profiles` (+ `auth.users`) |
| Company & Founder | `company`, `founder` |
| CMS | `content_items` (32), `brand_pages`, `announcements`, `navigation_items`, `footer_links` |
| Products & Solutions | `products` (12), `product_categories` (3), `solutions` (9), `industries` (9) |
| Roadmap | `roadmap_steps` (10) |
| News & Press | `news_articles`, `press_releases` |
| Careers | `careers_jobs` |
| CRM inbound | `contact_messages`, `newsletter_subscribers` |
| Social proof & support | `testimonials`, `faqs` (5) |
| Legal | `legal_pages` (4) |
| Brand: HM Signature | `hm_signature_fragrances` (4) |
| Resources | `resources` |

**Rules going forward:**
- Schema changes only via numbered migrations (next: `016_*`); no ad-hoc DDL.
- No new tables until a phase consumes them (`leads`, `deals`, `projects`, `invoices`, `ai_agents`, `translations` are candidates, not commitments).
- Free-plan backup gap: manual `pg_dump`/dashboard export before the first production write path goes live; revisit plan tier before CRM volume arrives.
- Content canonicality decision (constants vs DB) must be made in Phase 02 before wiring reads — the DB is the recommended canonical source.

---

## 4. Authentication (Supabase Auth)

**Purpose:** identify users for `/admin` and future portals.

| Aspect | Target design |
|---|---|
| Library | `@supabase/ssr` (cookie-based sessions in App Router) — **not** the unused plain `@supabase/supabase-js` as-is |
| Methods (initial) | email + password; magic link optional |
| Session flow | middleware refreshes tokens; `/admin/*` redirects unauthenticated users to a sign-in route |
| Provisioning | `handle_new_user` trigger (already exists) creates `profiles` rows |
| Users today | 2 seeded (`admin`, `staff` roles) — real credential rotation/management is a Phase 03 operational task |
| Client surfaces | public site: **no auth UI at all** (status quo preserved) |

Security posture: auth is not a UI concern in Phase 02; it activates in Phase 03 with the `/admin` shell. Until then no session code ships.

---

## 5. Authorization (RBAC + RLS)

**Purpose:** every write is gated server-side, independent of UI state.

**Existing foundation (verified live):**
- `profiles.role` ∈ {`admin`, `staff`} — 2 rows seeded.
- Helper functions: `is_admin()`, `is_staff_editor()` — used in RLS policy quals (verified: `products` UPDATE gated by `is_staff_editor()`).
- 92 policies across 23 tables; anon surface limited to exactly 2 INSERT policies (`contact_messages`, `newsletter_subscribers`); all other writes resolve through `auth.uid()` + role helpers.

**Target layering:**

```
UI gating (cosmetic)        — hide admin actions from non-admins
        │
Server actions              — re-check role server-side before mutation
        │
RLS policies (enforcement)  — final gate; anonymous passes nothing on staff tables
```

- New roles only by migration + helper update together (policy drift avoided).
- Role changes via admin-gated action/SQL only; no self-service escalation.
- Audit of sensitive mutations via `set_updated_at` triggers (exist) + future audit table when CRM arrives.

No policy changes are required for Phase 02 (existing policies already cover the read paths and the two public insert paths).

---

## 6. Storage (Supabase Storage)

**Purpose:** brand/media asset hosting with controlled access, replacing `public/` static hosting progressively.

| Aspect | Current | Target |
|---|---|---|
| Buckets | 7 exist, **empty**: `company-assets`, `founder`, `hm-signature`, `logos`, `media`, `news`, `products` | populate; public-read for marketing assets, staff-write via RLS/storage policies |
| Consumers | `next/image` over `/public` files (5 components; largest 243 KB) | `next/image` with Supabase URLs + `remotePatterns` in `next.config.ts` |
| Migration | — | Phase 05: upload → verify parity → switch component sources → keep `public/` fallback → remove dead assets (6 unreferenced files today) |

Constraints: keep asset URLs stable (SEO/perf); set long cache headers; never store secrets/PII in public buckets; image optimization stays with `next/image`.

---

## 7. AI Layer

**Purpose:** future AI capabilities (BusinessOS AI platform, HAMIA Works features, AI Employees) — content-only surfaces exist today (`/ai-future`, `/businessos/ai-platform`).

Design principles (all future; nothing implemented):
- **Server-only egress:** provider calls only from server actions / route handlers / Supabase Edge Functions; provider keys are server env vars, never `NEXT_PUBLIC_*`.
- **Grounded on owned data:** retrieval over CMS/documents (Supabase pgvector candidate) so answers cite Xeltrio content, not open-web hallucination.
- **Rate limiting + cost caps** per user/session from day one.
- **No streaming secrets:** stream tokens via server, not direct browser→provider.
- Phase ordering: strictly after auth + stable data access + storage exist.

---

## 8. Integration Layer

**Purpose:** everything crossing the system boundary beyond Supabase.

| Integration | Design | Phase |
|---|---|---|
| Transactional email (contact notifications, future auth emails) | provider behind a small server module (e.g. Resend); API key server-only; templates versioned in repo | 02–03 |
| Webhooks (future: Stripe etc.) | route handlers with signature verification; secret in env; idempotent handlers; never trust client callbacks for entitlement | 07 |
| Payments | Stripe-class provider; checkout via provider-hosted page; **prohibited until explicitly approved**; keys currently NOT_CONFIGURED | 07 |
| Social/outbound links | static (already correct, `rel="noopener noreferrer"`) | — |
| Analytics | see Observability | 02–03 |

Rules: every integration has (1) server-only credentials, (2) a single module owning its calls, (3) failure behavior defined (degrade, never crash page render), (4) no client-side secret exposure.

---

## 9. Business Layer (CMS + CRM + Projects + Billing + AI Employees)

**Purpose:** the admin/operator experience on top of Auth + RLS + Data. Everything here is a future phase; tables for several already exist but are empty.

| Subsystem | Backing tables (exist ✓ / future +) | Surface |
|---|---|---|
| CMS | ✓ `content_items`, `brand_pages`, `navigation_items`, `footer_links`, `announcements`, `legal_pages`, `faqs` | `/admin` CRUD, draft/publish |
| CRM | ✓ `contact_messages`, `newsletter_subscribers` (inbound); + `leads`, `activities` later | triage inbox, statuses, notes |
| Projects | + `projects`, `project_updates` | client/portal later |
| Billing | + `customers`, `invoices` (provider-mirrored) | future; payments gated |
| AI Employees | + `ai_agents`, `agent_runs` | future; depends on AI layer |
| HR/Careers | ✓ `careers_jobs` | job posting + applications (`career_applications` later) |

All business-layer mutations go through the same Application Layer patterns (validated server actions, RBAC-rechecked, RLS-enforced). No admin bypasses.

---

## 10. Localization Layer

**Purpose:** multi-market rollout (targets: Dubai, London, New York, Riyadh, Singapore per site content).

Current: English-only, single `lib/constants.ts` copy; Supabase seed rows single-language.

Recommended sequence (deferred until after CMS):
1. `next-intl` with locale-prefixed routes; UI chrome strings in `messages/{locale}.json`.
2. DB content localization: start with a `translations` table (entity_type, entity_id, field, locale, value) — decide row-vs-column when real translation volume is known.
3. SEO: hreflang pairs, per-locale sitemap entries, localized metadata via the existing metadata API.
4. RTL readiness (Arabic): logical CSS properties audit (Tailwind logical utilities), `dir` plumbing — visual identity unchanged, mirroring only where required.

No localization work starts before content is DB-managed (otherwise every string moves twice).

---

## 11. Observability

**Purpose:** know when the public site or admin fails, and what changed.

| Concern | Design | Phase |
|---|---|---|
| Error monitoring | Sentry-class SDK, server + client, source maps | 02–03 |
| Analytics | privacy-respecting product analytics; no PII in events | 02–03 |
| Uptime | external synthetic check on `/` + `/contact` | 02–03 |
| Audit trail | `set_updated_at` triggers (exist) + audit table for staff mutations | 03 |
| Cost guardrails | Supabase usage on FREE tier; alert before limits; provider spend caps (AI/billing) | ongoing |
| Logging | structured server logs in Application Layer; never log secrets or full message payloads | 02 |

Success criteria for Phase 02 observability: a failed contact submission and a failing deploy are both visible without user reports.

---

## Cross-Layer Principles

1. **Frozen frontend:** integration changes data sources, never the design.
2. **One seam:** Application Layer is the only door to Supabase; components stay client of `lib/db`/`lib/actions`.
3. **RLS is law:** UI gating is cosmetic; enforcement lives in Postgres policies + role helpers that already exist.
4. **Server-only secrets:** service-role and provider keys never touch the client bundle.
5. **Static-first:** preserve the statically rendered public site; dynamic only where genuinely required (`/admin`).
6. **Migrate by migration:** all schema evolution via numbered migrations; dump before first production write.
7. **Visual parity gate:** each data-source swap is diffed against the constant-driven render before constants are deleted.

---

**END OF TARGET ARCHITECTURE — architecture only; no Phase 02 work has begun.**
