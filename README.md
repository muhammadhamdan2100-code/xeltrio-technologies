# Xeltrio Technologies — Corporate Website (Phase 1 + Phase 2)

The public-facing corporate site for **Xeltrio Technologies Private Limited** — an AI product
company building intelligent operating systems for global enterprise (BusinessOS, EducationOS,
and the wider ecosystem), plus its AI services division, HamiaWorks AI.

**Phase 1** shipped the single-page corporate homepage. **Phase 2** expands it into a full
product-ecosystem site — dedicated pages for Products, BusinessOS, HamiaWorks AI, Solutions,
Industries, Technology, and an interactive Roadmap — without touching Phase 1's design language,
motion system, or homepage content.

Per the brief, this remains pre-application: no auth, dashboard, BusinessOS app, backend,
database, payments, or contact form. Those are later phases.

> **Naming note:** the company was renamed from an earlier "Xetrio" spelling to **Xeltrio**
> throughout every page, component, constant, and asset filename in this pass. The one thing
> that could *not* be changed here is the wordmark baked into the pixels of the uploaded brand
> sheet, which still reads "XETRIO" — the site only ever uses the icon-only crop (no text) plus
> a live "XELTRIO" text label next to it, so nothing on the live site is mismatched, but the
> source logo file itself will need a redesign pass whenever that's convenient.

## Premium cursor system

A custom two-layer cursor (`components/cursor/`) replaces the native pointer on desktop:

- **Dot + ring**, lerped every frame via `requestAnimationFrame` (never snaps)
- **Magnetic pull** on buttons, cards, and nav/CTA links via GSAP `quickTo`
- **Zone-aware ring**: capsule shape on nav/footer links, expand + glow on buttons, pulse on
  `.glass-panel` cards
- **Hero-zone behavior**: slow ring rotation, drifting particles, and a floating "Explore" label
  (Framer Motion) while the pointer is inside the 3D hero
- **Click ripple** (350ms), **loading pulse**, and **scroll stretch**, all computed in the same
  rAF loop so there's a single source of truth for the cursor's transform
- **Fully disabled** on touch devices (`hover: hover` / `pointer: fine` check) and whenever
  `prefers-reduced-motion` is set — native cursor and touch interaction take over automatically
- Mounted via `CursorLoader.tsx`, which dynamically imports the engine with `ssr:false` so
  browser-only feature detection never causes a hydration mismatch

## Recent fixes

- **R3F console error** ("CoreMaterial is not part of the THREE namespace") — the hero's shader
  material previously used `@react-three/fiber`'s `extend()` to register a custom `<coreMaterial>`
  JSX tag, which is fragile across dynamic imports and Fast Refresh. It's now a plain
  `THREE.ShaderMaterial` attached imperatively via a ref inside a `useLayoutEffect` (flash-free,
  before paint) — a strictly more robust pattern that isn't exposed to that error class at all.

## Creative concept

The brand mark's circuit-traced "X" — bent lines terminating in small round nodes — is the seed
for the whole visual language. The hero's 3D centerpiece is a "digital core": a fresnel-lit,
noise-displaced energy nucleus orbited by circuit-style rings whose nodes echo the logo's icon
grammar directly. Motion throughout is slow, weighted, and settles rather than loops, matching a
confident-but-quiet "precision intelligence" register rather than a loud, gimmicky AI-startup look.

## Brand system (extracted from the supplied logo)

| Token | Value |
|---|---|
| Background (primary) | `#050816` |
| Accent (primary) | `#4F8CFF` |
| Accent (bright) | `#8AB4FF` |
| Silver / secondary text | `#C3CADB` |
| Display typeface | Space Grotesk |
| Body typeface | Inter |
| Technical/mono accents | JetBrains Mono |

Fonts are self-hosted via `@fontsource` (no external Google Fonts request at build or runtime).

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4
- Three.js + React Three Fiber + Drei — procedural 3D hero (custom GLSL shader core, no external
  model/texture assets)
- Framer Motion — scroll reveals and the roadmap's scroll-scrubbed progress line
- GSAP + ScrollTrigger — the Company Roadmap and Founder timelines
- Supabase (PostgreSQL + Auth + Storage + RLS) — see "Phase 6 — Backend foundation" below
- lucide-react — icon set

## Getting started

`.env.local` is included (gitignored, but shipped in this export) with a live Supabase
project's public URL and publishable key — safe to expose to the browser, since it's scoped
entirely by the RLS policies described below, not by secrecy. No setup needed to run this as-is.

```bash
npm install
npm run dev       # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

Type-check and lint (both pass clean):

```bash
npx tsc --noEmit
npx eslint .
```

## Pages

| Route | Purpose |
|---|---|
| `/` | Corporate homepage — hero, about, **Our Ecosystem hub**, **Company Roadmap**, vision/mission, values, why Xeltrio, technology preview, ecosystem preview, HamiaWorks AI preview, roadmap preview |
| `/products` | Full ecosystem showcase — all 12 products with badges and Learn More CTAs |
| `/businessos` | Flagship product hub — 3D "Enterprise Network" hero, overview, why BusinessOS, architecture teaser, module teaser |
| `/businessos/features` | The full 19-item BusinessOS feature grid |
| `/businessos/architecture` | Interactive, click-to-expand request-flow diagram (Users → BusinessOS → AI Engine → … → Future AI Agents) |
| `/businessos/modules` | The full 18-module interactive grid |
| `/businessos/ai-platform` | The 10 AI capabilities running underneath BusinessOS |
| `/businessos/security` | BusinessOS's security posture — auth, encryption, backups, future compliance |
| `/businessos/technology` | BusinessOS's actual tech stack — Next.js, Supabase, PostgreSQL, n8n, and more |
| `/businessos/enterprise` | Enterprise-grade operational guarantees — multi-tenancy, RBAC, approvals, audit-readiness |
| `/businessos/roadmap` | BusinessOS-specific roadmap (same interactive timeline pattern, BusinessOS-flavored steps) |
| `/hamiaworks-ai` | AI services division — 11 services as icon cards |
| `/solutions` | Industry problem → solution narratives (9 sectors, incl. Restaurant) |
| `/industries` | Industry cards with Overview / Challenge / AI Solution / Future Product, id-anchored for deep-links |
| `/technology` | Deep dive on the 12 technology pillars the whole ecosystem is built on |
| `/roadmap` | Interactive, click-to-expand roadmap — Corporate Website → … → Enterprise Marketplace → Global Expansion |
| `/research` | Research & Development — the 6 areas Xeltrio is actively researching |
| `/ai-future` | Cinematic scroll-storytelling journey through Xeltrio's long-term AI vision |
| `/global-expansion` | The phased plan from Pakistan → South Asia → Middle East → Global |
| `/resources` | Documentation / Case Studies / Whitepapers / etc. — clearly-labeled "coming soon" hub |
| `/careers` | Culture and growth pillars — explicitly no job listings |
| `/press` | News / Press Releases / Media Kit / Announcements — clearly-labeled placeholders |
| `/legal`, `/legal/privacy-policy`, `/legal/terms-of-service`, `/legal/cookie-policy`, `/legal/disclaimer` | Honest, clearly-labeled legal placeholders (see note below) |
| `/hm-signature` | Full 12-section luxury brand experience for HM Signature, Xeltrio's fragrance brand |
| `/investor-relations` | Coming Soon status page — Company Overview, Growth Roadmap, Future Products, Funding Vision |
| `/founder` | Dedicated executive Founder page — hero, story, philosophy, timeline, mission, vision, roadmap, CTA |
| `/contact` | Honest placeholder — no functional form, routes inquiries to Careers/Press/general |

All nine `/businessos/*` pages share a nested layout (`app/businessos/layout.tsx`) that adds a
sticky sub-nav tab bar beneath the main Nav — the only structural change to the existing
`/businessos` page was removing its own `<PageShell>` wrapper in favor of the shared layout;
its visual content is untouched.

**Phase 4 also enriched several existing pages in place rather than forking duplicate routes:**
`/solutions` and `/industries` gained a Restaurant entry (9 sectors now, matching the brief's
"Enterprise Solutions" list); `/industries` cards also gained `Challenge` / `AI Solution` fields
and per-industry `id` anchors (`/industries#education`, etc.) for footer deep-links; `/technology`
grew from 8 to 12 pillars (added Machine Learning, AI Agents, Workflow Automation, Microservices);
and the global roadmap (`/roadmap` + the homepage roadmap preview) grew from 7 to 10 stages. None
of this touched their visual design — same cards, same grid, same reveal timing, just more (real,
non-fabricated) content in the same shape. The Nav also gained a second "Company" dropdown
(Research, AI Future, Global Expansion, Careers, Press) alongside the existing "Products" one,
and the Footer expanded from 4 to 6 columns (Company, Products, Solutions, Industries, Resources,
Legal) per the brief's footer-upgrade spec.

**On the legal pages specifically:** these are honest placeholders, not filled-in boilerplate.
Each page states plainly that it isn't a binding legal document yet and lists the topics the real
policy will cover once written and reviewed — generating convincing-looking fake privacy/terms
text felt like the wrong call for a page real visitors might mistake for the genuine policy.

**On the "cinematic 3D journey":** the brief's full concept (Universe → Particles → Logo
Formation → AI Core → Ecosystem → Industries → Global Network → Earth → Future Vision) is a
genuinely large, multi-scene production effort. `/ai-future` implements a scoped version of that
idea instead — a real scroll-pinned storytelling journey (6 stages, an SVG network visual that
densifies with scroll progress, a scroll-linked progress bar) built with Framer Motion rather than
a second full Three.js production. It's honest premium scrollytelling, not the full 9-stage
cinematic scale described — flagging that trade-off explicitly rather than quietly shipping less
than what was asked for.

## Structure

```
app/                  layout, home page, global styles
app/products/          Products page
app/businessos/         Nested layout (sub-nav) + 9 BusinessOS platform pages:
                        overview, features, architecture, modules, ai-platform,
                        security, technology, enterprise, roadmap
app/hamiaworks-ai/      HamiaWorks AI page
app/solutions/          Solutions page
app/industries/         Industries page
app/technology/         Technology page
app/roadmap/            Roadmap page (global, 10-stage)
app/research/           Research & Development page
app/ai-future/          AI Future cinematic scroll page
app/global-expansion/   Global Expansion page
app/resources/          Resources hub page
app/careers/            Careers page
app/press/              Press page
app/legal/              Nested layout + index + 4 placeholder legal routes
app/hm-signature/       HM Signature luxury brand showcase page (12 sections)
app/investor-relations/ Investor Relations Coming Soon page
app/founder/             Dedicated executive Founder page (reuses Founder section)
app/contact/             Contact page (no functional form)
components/
  layout/              Nav, Footer, PageShell (Nav+Footer wrapper),
                        PageHeader (inner-page hero, with a `compact` variant
                        for pages that sit below an extra sub-nav bar)
  businessos/          BusinessOSSubNav (sticky tab bar for /businessos/*)
  sections/            Hero, About, VisionMission, CoreValues, WhyXeltrio,
                        Technology, ProductPreview, HamiaWorksAI, Roadmap (homepage),
                        BusinessOSHero (3D-backed hub hero), ArchitectureDiagram
                        (5-layer teaser), FlowDiagram (interactive 8-stage request
                        flow), RoadmapTimeline (parametrized: powers both /roadmap
                        and /businessos/roadmap), AIFutureJourney (scroll-pinned
                        storytelling section for /ai-future)
  legal/               LegalDocument (shared template for the 4 placeholder
                        legal routes)
  ecosystem/           NodeCard, ConnectionLines, EcosystemDetailPanel
                        (Our Ecosystem hub), PerfumeBottleVisual + PackagingVisual
                        (HM Signature — stylized SVG illustrations, not photoreal)
  founder/             FounderPortrait (photo-or-placeholder), FounderTimeline
                        (GSAP ScrollTrigger)
  canvas/              HeroScene (homepage 3D core, R3F), coreMaterial (shared
                        shader factory), HeroCanvas / HeroFallback / CanvasErrorBoundary,
                        EnterpriseNetworkScene + EnterpriseNetworkCanvas (BusinessOS
                        hub's "connected modules" 3D visualization, same eligibility
                        and fallback pattern as the homepage hero)
  cursor/              CustomCursor (engine), CursorLoader (ssr:false mount)
  motion/              Reveal / RevealGroup / RevealItem (scroll-reveal wrappers)
  ui/                  ProductGlyph (shared procedural product illustration)
hooks/                 useReducedMotion
lib/                   constants (all copy for every page), utils
public/                xeltrio-icon.png, xeltrio-horizontal.png (cropped from the
                       supplied brand sheet, alpha-matted to transparent)
```

## Notable decisions

- **3D hero degrades gracefully.** `HeroCanvas` checks for WebGL support and
  `prefers-reduced-motion` before mounting the Three.js scene; both cases (and any runtime
  WebGL error, caught by `CanvasErrorBoundary`) fall back to a static radial-gradient visual in
  `HeroFallback.tsx` so the hero never breaks or forces motion on anyone who's opted out.
- **No external 3D assets.** The core, orbital rings, and particle field are all procedural
  (icosahedron + custom GLSL + instanced primitives), per the "no placeholder / no external asset
  dependency" rule — there's no GLB to swap in later because nothing here needs one.
- **Fonts are self-hosted**, not fetched from `fonts.googleapis.com` at build time, so the build
  has zero external network dependency.
- **Logo usage.** The uploaded brand sheet was cropped (not redesigned) down to the icon-only and
  horizontal lockup panels and alpha-matted to transparent PNGs in `public/`. The full 12-panel
  brand sheet itself was not shipped as a page asset — only the two lockups the site actually
  uses in the nav and footer.
- **Real, finished copy everywhere** — every headline, card, and microcopy string is final, not a
  placeholder, per the brief's ecosystem list, values, and service descriptions.
- **Phase 2 reuses Phase 1's design system exactly** — same color tokens, type scale, glass-panel
  and grid-lines treatments, reveal timing, and card patterns. No new colors, fonts, or motion
  language were introduced; `PageHeader` and `PageShell` exist purely to keep every new page
  visually identical to the homepage's established language without duplicating markup.
- **Nav evolved, not replaced.** Anchor links (`#about`, `#ecosystem`) became real routes once
  those sections graduated into their own pages; the homepage sections that remain (Vision,
  Core Values) kept their anchors (`/#vision`, `/#values`) so footer and nav links still resolve
  correctly from any page.
- **Phase 3 is still marketing storytelling, not the application.** Every `/businessos/*` page —
  including Security and Technology — is descriptive copy about the platform's posture and stack.
  Nothing here implements authentication, a database, or backend functionality; "Authentication"
  and "Authorization" on the Security page are prose describing what BusinessOS will guarantee,
  not a login system.
- **A second, distinct 3D scene, not a reused one.** The BusinessOS hub's "Enterprise Network"
  visualization (`EnterpriseNetworkScene.tsx`) shares the homepage hero's shader factory and
  eligibility/fallback pattern, but is a different composition (a core node with orbiting,
  connected module nodes and traveling data-flow pulses) — the homepage hero itself was not
  touched.
- **One `RoadmapTimeline`, two roadmaps.** Rather than duplicate the interactive timeline
  component, it now accepts `steps`/`year` props; `/roadmap` and `/businessos/roadmap` both
  render it with their own content.

## Phase 6 — Backend foundation (Supabase)

Backend-only, as scoped: no existing UI, animation, layout, or component was touched, with one
explicit exception the brief itself called for — the Contact form's submit handler now calls a
real repository instead of a fake `setTimeout`. Everything else in this section is new files.

**This is connected to a real, live Supabase project** (`muhammadhamdan2100-code's Project`,
`ap-south-1`) — not a mock or a local-only schema. Every claim below was verified against the
actual database, not just written and assumed correct.

### Schema

22 tables, all with RLS enabled, covering all 24 requested collections. Rather than one table per
bullet point, ~20 structurally-identical "card grid" collections (core values, why-Xeltrio,
HamiaWorks services, HM Signature philosophy, security pillars, etc.) share a single polymorphic
`content_items` table distinguished by a `collection` key — a real normalization decision, not a
shortcut, and documented as such directly in that table's migration comment. Genuinely distinct
entities (products, industries, solutions, roadmap steps, news, press releases, announcements,
careers, testimonials, FAQs, contact messages, newsletter subscribers, navigation, footer links,
legal pages, resources, brand pages, HM Signature's fragrance list, company, founder, profiles)
each got their own table.

Migrations live in Supabase's own migration history (applied via the Supabase MCP connector, not
committed as local `.sql` files in this repo — see below for why). Current content is seeded with
the site's real existing copy for the highest-value collections (company, founder, all 12
ecosystem products across 3 categories, all 9 industries, all 9 solutions — now correctly linked
to their industries by foreign key, all 10 global roadmap steps, HM Signature's 4-fragrance
collection, all 4 legal pages, the Contact page's 5 FAQs, and 4 representative `content_items`
collections: core values, why-Xeltrio, company trust, and HamiaWorks services). The remaining
`content_items` collections (BusinessOS features/pillars, AI Platform, HM Signature's philosophy/
ingredients/craftsmanship, Research areas, Careers/Press/Resources sections, etc.) follow the
exact same insert pattern and are a straightforward follow-up seeding pass, not a schema change —
seeding all ~24 collections' full current copy in one pass would have been a lot of repetitive
data entry without adding architectural value.

### Row Level Security

Every table follows one of two shapes:
- **Content tables** (company, founder, products, industries, news, etc.): public can `SELECT`
  published rows; a `profiles.role` of `editor`/`content_manager`/`admin`/`super_admin` can read
  drafts and do full CRUD. `INSERT`/`UPDATE`/`DELETE` are deliberately three separate policies
  per table rather than one `FOR ALL` — a `FOR ALL` policy's implicit `SELECT` clause means every
  read evaluates two permissive policies instead of one; split, reads only ever check one.
- **Public-write tables** (`contact_messages`, `newsletter_subscribers`): the opposite shape —
  anonymous `INSERT` is allowed (that's the whole point), but `SELECT`/`UPDATE`/`DELETE` require
  staff. `newsletter_subscribers` also has a unique index on `lower(email)`, enforced by Postgres
  itself, not application code — verified live: inserting `Duplicate@Example.com` then
  `duplicate@example.com` correctly throws `23505`.

All of this was checked against Supabase's own security and performance advisors, not just
written and assumed correct — the advisor flagged a missing `search_path` pin and two functions
with a wider grant than they needed (fixed), and a systemic "two permissive policies per read"
pattern across ~20 tables from the `FOR ALL` shape above (fixed by splitting every one of them).
The four warnings still showing are intentional and documented inline in the migration that
causes them: the two public-insert policies, and `is_admin()`/`is_staff_editor()` needing to
stay callable by `anon`/`authenticated` specifically because RLS policies evaluate them in the
querying role's own context — revoking that would break every "published OR staff" read policy
that calls them.

**Live-verified, not just assumed** (run as the actual `anon` role, inside rolled-back
transactions so nothing persisted from testing): `anon` can insert a contact message but cannot
read it back; `anon` can read published `content_items` but cannot write to the table at all.

### Authentication & roles

`profiles` (one row per `auth.users` row, auto-created via trigger on signup) carries a
`user_role` enum: `super_admin`, `admin`, `editor`, `content_manager`, `staff`. New signups
default to `staff` (no write access anywhere) — promoting someone to `admin`/`editor` is a manual
SQL update against `profiles.role` until an admin dashboard exists to do it visually. This is the
auth foundation the brief asked to "prepare for future admin dashboard," not the dashboard itself.

### Storage

7 public-read buckets, exactly as named in the brief: `company-assets`, `hm-signature`,
`products`, `news`, `founder`, `logos`, `media`. Same RLS shape as the content tables — public
read, staff-only write.

### API layer — repository pattern

`lib/repositories/` — a generic `createRepository<T>(table)` factory providing typed
`getAll`/`getById`/`create`/`update`/`remove` for any table, plus a handful of purpose-built
repositories on top of it (`contentRepository` for collection-scoped queries,
`formsRepository` for the two public-write tables, `careersRepository`, `newsRepository`,
`companyRepository` for the two singletons, and `catalogRepository` grouping the rest). Every
specific repository is built on the generic factory rather than hand-rolling its own Supabase
calls — genuinely no duplicated query logic. `lib/supabase/database.types.ts` is generated
directly from the live schema (via Supabase's own type generator, not hand-written), so every
repository call is fully typed against the real database, not a guess at its shape.

### What actually got wired into the frontend (the one explicit exception)

`ContactForm.tsx`'s submit handler now calls `formsRepository.submitContactMessage(...)` for
real, with a proper error state if the request fails — nothing about its layout, fields,
animations, or styling changed. This was the one frontend touch the brief explicitly asked for
("Connect the existing contact form. Store submissions inside Supabase.") No other page was
wired to fetch from Supabase yet — every page still reads from `lib/constants.ts`, exactly as
before. Wiring a page to real data is now a matter of calling the matching repository in a
Server Component and passing the result down; the repository layer is what makes that a small,
mechanical change whenever it happens next, not a rewrite.

### Newsletter

The `newsletter_subscribers` table and `formsRepository.subscribeToNewsletter()` exist and are
tested, but there's no newsletter signup form anywhere on the current site to connect them to —
building one wasn't asked for here, and this phase was explicit about not touching the frontend
UI. The backend is ready the moment that form exists.

### Environment

`.env.local` (gitignored) holds `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. That key is safe to expose to the browser by design —
it's scoped entirely by the RLS policies above, not by being secret.

## HM Signature — official asset integration

The three uploaded images (bottle, packaging, logo) are now the **only** HM Signature visual
assets anywhere on the site — the procedural SVG bottle and packaging illustrations described in
the note below are gone, not just hidden behind a conditional. This supersedes that note; the
photorealism gap it described no longer applies now that real asset files exist.

- **`public/hm-signature-bottle.jpg`** and **`public/hm-signature-packaging.jpg`** — the uploaded
  photos, each cropped to the aspect ratio their component actually displays at (portrait for the
  bottle, a wider crop for the packaging) so nothing is squeezed or letterboxed.
- **`public/hm-signature-logo.png`** — the uploaded logo, background alpha-matted to transparent
  (same technique used for the main Xeltrio icon back in Phase 1) and downscaled from a 760px,
  860KB source to a 360px, ~240KB file — it's only ever displayed at 110–200px, so the original
  was needlessly heavy for what's actually a Core Web Vitals-sensitive asset used in three places
  on one page.
- **`PerfumeBottleVisual.tsx`** and **`PackagingVisual.tsx`** were rewritten around the real photos
  with layered (non-conflicting) Framer Motion transforms: mouse parallax, a settle-once scroll
  reveal, and continuous float/rotation/hover each live on their own nested layer so they don't
  fight over the same transform property. Both also get a masked "glass shine" sweep and (for the
  packaging) a genuine mouse-tilt effect.
- **`HMSignatureLogo.tsx`** is new — the shimmer sweep is a gradient masked to the logo's own
  alpha shape via CSS `mask-image`, so the gold highlight only ever plays across the lettering,
  never as a flashy full-box effect. It's used in the Hero (replacing the old text-only heading,
  which is now an `sr-only` `<h1>` for SEO), Brand Story, and the Premium CTA.
- The Bottle Showcase caption and the Collection preview's founding scent name were updated to
  match what's actually printed on the real bottle label ("Mystic Oud"), and the CTA copy no
  longer says the bottle doesn't exist yet, since it now visibly does.

## Contact page premium upgrade & HM Signature visual refresh

Two scoped, single-page-only requests. Neither touched any other page's design.

**`/contact` rebuilt in full** (only file changed for this: `app/contact/page.tsx`, plus new
`components/contact/*` and `lib/constants.ts` additions) — all 7 requested sections: a hero with
floating particles, a real controlled contact form (`ContactForm.tsx`) with every requested field
including Service/Budget/Timeline dropdowns, company info cards, a "Global Presence" visualization,
Why Contact Xeltrio cards, an FAQ accordion, and a final CTA. The form is genuinely interactive
(validates, shows a proper success state) but **isn't wired to a real backend** — it says so
plainly on submit rather than pretending to send anywhere. Every field name matches what a future
`contact_submissions` Supabase table would look like, so wiring it up later is additive.

The brief asked for an "interactive world map" — a geographically-accurate world map isn't
something to hand-author accurately from scratch, so `GlobalPresenceMap.tsx` is a labeled,
interactive node-network (Pakistan + 5 future cities, clickable) in the same visual language as
the homepage's Ecosystem hub, explicitly captioned as illustrative rather than literal cartography.

**HM Signature's bottle and packaging visuals were substantially reworked** (this is the third
time this exact "ultra-realistic, indistinguishable from real photography" request has come up).
Being direct about it again, briefly: that's still not achievable with SVG/CSS, and there's no
image-generation or 3D-rendering tool available in this environment to produce it any other way.
What *did* happen — real, verifiable improvements: richer layered gradients, an SVG turbulence
filter giving the highlight streak a genuinely refracted (not flat) quality, an animated light
sweep across the glass, slow rotation added to the existing float, a soft-touch noise texture on
the packaging faces, animated gold foil shimmer, and hover micro-interactions on both — all of
which the brief explicitly asked for under "Animation" and are now real, not aspirational.

More importantly: both components now check `HM_SIGNATURE_ASSETS.bottleImageUrl` /
`packagingImageUrl` first and render a real photo in the exact same frame when one is set — the
same swap-ready pattern as `FounderPortrait`. The actual path to what the brief is describing is
real product photography (or a real 3D render from outside this environment); when that exists,
it drops in as a two-line constant change, not a rebuild.

## Navigation restructure, dedicated Founder page & Contact

This pass explicitly asked to change Nav content (previous phases had asked to leave Nav alone —
this one directly requested a new nav order, so it took priority). `NAV_LINKS` is now: Home,
About, Services, Products (dropdown), HamiaWorks AI, Founder, HM Signature, Careers, News,
Contact — matching the requested order exactly. Two of those didn't have an obvious existing
destination, so rather than invent unbriefed pages, they're mapped to the closest real fit:
**Services → `/solutions`**, **News → `/press`** (which already covers news, releases, and
announcements). Everything else in `Nav.tsx` — the dropdown mechanism, styling, mobile menu — is
unchanged.

**The full `Founder` section moved off the homepage** into a proper dedicated `/founder` page,
replaced on the homepage by `FounderPreview.tsx` — a compact card ("Meet Our Founder" + a line +
a button), exactly as specified. The `/founder` page reuses the original `Founder` component
in full (introduction, story, leadership-philosophy cards, GSAP timeline, achievements, quote —
nothing about that content changed) and wraps it with a new premium hero plus five new sections:
Mission, Vision, Company Vision, Future Roadmap, and a closing CTA.

**A new `/contact` page** exists so the "Contact" nav item doesn't dead-end, but — consistent with
every prior phase's explicit "no contact forms" instruction — it isn't a functional form. It
states plainly that direct contact details are coming and routes each kind of inquiry (careers,
press, general) to where that actually lives today.

**HM Signature already satisfied this request's spec before this pass started** — the 11 sections
asked for here match what Phase 5's HM Signature expansion already built, and the homepage's HM
Signature presence was already just the Ecosystem hub's compact node + "Discover HM Signature"
link, not a full inline experience. Nothing needed to change there.

## Founder, Company Trust, Investor Relations, Media Center & HM Signature expansion

Another strictly-additive pass — nothing existing was modified, per the brief's repeated
"extend, don't replace" instruction.

**New homepage sections** (inserted between `CompanyRoadmap` and `VisionMission`, nothing else
in `app/page.tsx` touched):

- **`Founder`** — portrait, story, 8 vision cards, quote, a GSAP ScrollTrigger-animated timeline
  (`FounderTimeline`), and 5 highlight badges. The portrait uses `FounderPortrait.tsx`, which
  renders a real photo when `FOUNDER.photoUrl` is set and an elegant placeholder when it isn't —
  swapping in a new (or future CMS-hosted) photo later is a one-line constant change, never a
  design change. The uploaded portrait was cropped to a clean 4:5 frame and given a CSS-only
  "studio" treatment (blue rim light, vignette) rather than being edited destructively.
- **`CompanyTrust`** — an 8-pillar trust grid (Mission, Vision, Security, Compliance, etc.).

**New pages:** `/investor-relations` (Coming Soon, per the brief) and `/hm-signature` (12-section
expansion — Brand Story, Luxury Philosophy, Why HM Signature, Bottle Showcase, Packaging
Showcase, Perfume Collection, Signature Ingredients, Craftsmanship Process, Luxury Experience,
Future Vision, Premium CTA — all appended after the existing hero and craft sections, which
weren't touched).

**Existing `/press` page extended, not replaced:** a new Media Center section (Brand Assets,
Press Downloads, Company Profile, Press Contact) was appended below the existing press grid.

**On the perfume bottle specifically:** the brief asked for an "ultra-realistic" bottle
indistinguishable from real product photography. That's genuinely outside what's achievable with
procedural SVG/CSS (or anything in this toolchain — there's no image-generation or 3D-rendering
pipeline available here). `PerfumeBottleVisual` and the new `PackagingVisual` are refined further
than Phase 5's version, but they're still stylized illustrations, and the Bottle Showcase section
says so plainly rather than overclaiming. Real product photography is the actual path to what the
brief is describing.

**On the CMS request:** the brief asked for 17 normalized Supabase collections with full CRUD and
an admin dashboard. That's a genuinely large, separate backend project — designing schemas, RLS
policies, an auth-gated admin UI with forms for every collection, image upload, etc. — not
something to superficially fake-wire in this pass. Nothing was connected to a real database
without checking first: `Supabase:list_projects` was called to see what's available and returned
`No approval received`, meaning connecting to a real Supabase account needs explicit sign-off
first. What's actually true right now is that every editable value across the site already lives
in one place (`lib/constants.ts`), typed and shaped close to how database rows would look — that's
the real head start for a future migration. If you want to move forward with an actual Supabase
backend, the next step is telling me which collections matter most first (Careers and Company
News are the most naturally "dynamic list" content types already on the site) and confirming you
want me connecting to a real project.

## Phase 5 — Our Ecosystem

The brief was explicit that this phase must only *extend* the site, never modify or replace
existing sections, components, or Navigation. Two new sections were inserted into the homepage
between `About` and `VisionMission` — nothing else on `app/page.tsx` or any existing component
file was touched:

- **`EcosystemHub`** (`components/sections/EcosystemHub.tsx`) — the hub-and-spoke visualization
  revealing Xeltrio as a parent company. A glowing central "XELTRIO TECHNOLOGIES" card connects
  via animated SVG lines (with traveling particles, disabled under `prefers-reduced-motion`) to
  five floating glass nodes — AI Automation Agency, BusinessOS, Future SaaS Products, HM
  Signature, and Future Ventures. Selecting a node crossfades a detail panel below. Desktop uses
  a true radial layout; mobile/tablet falls back to a stacked grid, both driven by the same
  `ECOSYSTEM_NODES` data.
- **`CompanyRoadmap`** (`components/sections/CompanyRoadmap.tsx`) — a distinct, brand-level
  timeline (AI Automation Agency → BusinessOS → HM Signature → Future SaaS Products → Enterprise
  Marketplace → Global Expansion → Worldwide Technology Company), animated with real GSAP +
  ScrollTrigger (registered inside `gsap.context` for clean teardown) rather than Framer Motion,
  per the brief's explicit "Use GSAP timeline animations" instruction. This is intentionally
  separate from the existing product roadmap (`ROADMAP_STEPS` / `RoadmapTimeline`) — different
  narrative, different data, neither touches the other.
- **`/hm-signature`** — a new, dedicated page for Xeltrio's first consumer brand: a luxury
  fragrance house. It intentionally breaks from the site's dark-navy palette into black with gold
  lighting (per the brief's explicit ask), while keeping the same fonts, glass-panel patterns,
  and motion system. The bottle "mockup" is a procedural SVG (`PerfumeBottleVisual.tsx`) rather
  than a placeholder image, since no product photography exists yet. "Coming Soon" is a static,
  non-interactive label; "Learn More" scrolls to the on-page craft section — neither pretends to
  do more than the brand currently can.

`lib/constants.ts` gained `ECOSYSTEM_NODES`, `HM_SIGNATURE`, and `COMPANY_ROADMAP_STEPS` — all
additive; nothing existing in that file was renamed or restructured for this phase.

## Upgrade path

If real photography, a branded 3D product asset, or additional pages (contact, login, dashboard)
are added in a later phase, they slot into the existing structure without any rework: new
sections follow the same `components/sections/*` + `lib/constants.ts` pattern used throughout.
