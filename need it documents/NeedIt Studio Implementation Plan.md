# NeedIt Studio — Implementation Plan

**Version:** 1.0
**Status:** Ready for engineering execution
**Inputs:** "NeedIt Studio PRD (Buildable Spec).md" (§ references below)
**Market:** Nigeria (MVP) · **Primary experience:** "Tell us what you need."

This plan defines the build sequence: **design system → platform → architecture → services → feature phases → launch**, with exit criteria per phase. It resolves the "Open Decisions" from the buildable PRD (§15) with recommended defaults (marked **R**), so engineers can start without blocking questions.

---

# 0. Decision Summary (recommended defaults)

| Decision | Recommendation | Alternative |
|---|---|---|
| Platform | **PWA (React + TypeScript + Next.js)**, installable on Android/iOS | Native (Expo) |
| Backend | **NestJS (TypeScript)** API | Fastify/Express |
| Monorepo | **Turborepo (pnpm)** | Separate repos |
| Database | **PostgreSQL 16 + PostGIS** | Supabase (managed PG) |
| ORM | **Prisma** (+ raw SQL for geo queries) | Drizzle |
| Auth | **JWT access + refresh**, phone-OTP primary, email fallback | Supabase Auth |
| OTP provider | **Termii** (Nigeria focus); Twilio fallback | Auth signal |
| Intent parsing | **LLM structured-output** (OpenAI gpt-4o-mini **R**) + rule-based fallback | Claude, local model |
| Search | **Postgres (pg_trgm + FTS)** for MVP | Meilisearch/Typesense (Phase 2 if needed) |
| Geo | **City + LGA + radius**, optional GPS; circular distance scoring | Full PostGIS routing |
| Realtime/messaging | **REST + short polling** in MVP; **Socket.io** (optional late) | SSE |
| Payments | **Not in MVP**; Paystack **R** primary in Phase 1 | Flutterwave |
| Notifications | In-app table; **FCM** push in Phase 1 | OneSignal |
| Files/images | **Cloudinary** (easy resize/delivery) or S3+CDN | Local disk dev-only |
| Jobs/cache | **Redis + BullMQ** | In-process |
| CI/CD | **GitHub Actions** + container deploy | — |
| Hosting | API: **Railway/Render** **R**; DB: **Neon (Serverless PG)** **R** | Fly.io, Hetzner |
| Observability | **Sentry** (errors) + structured logs + health endpoints | Grafana stack |

Choices favor a **single TypeScript language across the stack** (small team → one mental model), **Postgres for both relational + search + geo**, and **managed services** to minimize ops in MVP.

---

# 1. Design System (Phase 0)

## 1.1 Tokens (foundation)

Define tokens in three tiers: **primitives → semantic → component**. Deliver via CSS variables + a TypeScript theme object.

**Color (primitives)**
- Neutral scale 0–1000 (grays) for text/backgrounds/borders.
- Brand: single primary (e.g., deep green `#1A7F4B`-family **R**) + supporting accent.
- Semantics: success / warning / danger / info.
- Purpose-tinted tokens: `--color-primary`, `--color-surface`, `--color-on-surface`, `--color-border`, `--color-rating` (trust), `--color-budget` etc.

**Typography**
- Scale: `display / title-lg / title-md / title-sm / body-lg / body / body-sm / caption / overline`.
- Font stack with fallbacks; Naira symbol rendering test (`₦` in headings and products).
- Numbers tabular where prices shown (avoid jitter in comparisons).

**Spacing & radii**
- 4px spacing grid (`space-1 … space-12`).
- Radius scale: `sm 6 / md 10 / lg 16 / pill`.
- Elevation: 3 shadow levels; focus rings (WCAG 2.2 AA contrast + visible focus).

**Iconography + imagery**
- One icon set (e.g., Lucide); category icon mapping (plumbing, appliances, design, tutoring, beauty, transport…).
- Avatar/placeholder system; verified badge asset (gold check).

## 1.2 Component library

Ship as an internal package (`packages/ui`) using **Radix primitives + Tailwind** (or styled-system). **R:** shadcn/ui-style composition.

Required components (grouped):
- **Layout:** AppShell (bottom nav for mobile-first), TopBar, PageHeader, Section, Card, ListRow, Skeleton, EmptyState.
- **Search:** NeedInput (hero), ExamplePills, SuggestChips (auto-options), RefinementBar.
- **Results:** ResultCard (variant: person | product | service | multiple), RatingStars, PriceTag (`₦` formatting util), AvailabilityChip, TrustBadge (verified/response-rate), SortMenu, FilterSheet.
- **Detail:** ListingGallery, ProviderHeader (avatar, stats, verified), PortfolioGrid, ReviewList(+input), SchedulePicker, BookingModal, ActionBar (Contact/Book/Save).
- **Provider:** ProfileWizard, ListingForm (multi-part), AvailabilityEditor, RequestQueueItem, BookingStatusStepper.
- **Global:** Button, Input/Textarea, Select, Toggle, Chip, Modal/Sheet, Toast, Tabs, Stepper, Avatar, Badge, Tooltip, EmptyState, Skeleton, FormField+validation, PhoneInput (+234), OTPInput.

## 1.3 Design-system acceptance criteria

1. No hardcoded color/spacing/radius in app code — only semantic tokens.
2. All interactive elements keyboard-navigable + visible focus.
3. `₦` renders consistently; prices use `Intl.NumberFormat('en-NG', {style:'currency', currency:'NGN'})`.
4. Storybook + one reference page (Home) implemented from tokens only.
5. Light + dark modes via token swap (dark optional in MVP).

## 1.4 Test/reference pages (built with DS only)

Home (hero + popular needs), Results, Provider Profile, Listing detail, My Needs, Provider workspace shell.

---

# 2. Repository & Tooling (Phase 0)

## 2.1 Monorepo layout

```
needit/
├─ apps/
│  ├─ web/                  # Next.js PWA (seeker + provider UI)
│  └─ api/                  # NestJS backend
├─ packages/
│  ├─ ui/                   # design-system components
│  ├─ engine/               # intent parser client + matching scorer (pure TS)
│  ├─ shared/               # shared TS types (entities, DTOs, enums)
│  ├─ config/               # eslint / tsconfig / tailwind presets
│  └─ db/                   # Prisma schema + migrations + seed
├─ docs/                    # PRDs + this plan
├─ .github/workflows/       # CI/CD
├─ turbo.json · pnpm-workspace.yaml · docker-compose.yml (dev db) 
└─ README.md
```

## 2.2 Tooling & quality gates

- **pnpm** workspaces + **Turborepo**.
- **TypeScript strict** across all packages.
- **ESLint + Prettier** presets in `packages/config`; `turbo lint`, `turbo typecheck`.
- **Vitest** (unit) + **Playwright** (E2E) + **MSW** (API mocking in tests).
- **GitHub Actions CI:** lint → typecheck → unit → build → docker image. PR required checks.
- Conventional commits; `husky` pre-commit (format + typecheck on changed scope).

### CI acceptance
1. Green pipeline on every PR (lint, typecheck, unit, build).
2. E2E smoke run on merge to `main`.

---

# 3. Architecture Decisions (Phase 1 context)

## 3.1 Backend architecture

**NestJS modular monolith (first) → split later only if forced.** Rationale: MVP scale; modules align to bounded contexts; keeps deployment simple; each module gets a clear seam (queue/HTTP) for future extraction.

Modules:
```
auth · users · needs · intent · catalog (listings) · providers ·
matching · bookings · messaging · reviews · saved · reports ·
notifications · discovery (popular/categories) · files
```

Cross-cutting: **PrismaService**, **AppConfig** (env-driven, validated), **Errors** (typed exception map), **Guards** (JWT/roles), **Pipes** (DTO validation via class-validator), **Observability** (Sentry + request logging), **QueueModule** (BullMQ).

## 3.2 Data architecture

- Single **PostgreSQL** DB with PostGIS. Prisma schema mirrors PRD §5.1.
- **Soft-delete** where useful (listings, users); `created_at/updated_at` everywhere; audit on money/status transitions (simple `booking_events` log).
- **Seed data:** 5 categories, sub-tags, 30–50 realistic providers/listings (Lagos IKEJA/VI/LEKKI + Abuja), example need-intent fixtures for tests.

## 3.3 Concurrency & consistency

- Status transitions via guarded updates (e.g., booking `requested→confirmed` accepts only current status — use `WHERE status = :expected` update).
- **Optimistic** for reviews; **idempotency keys** on booking creation.
- Queue (BullMQ/Redis) for: notification fan-out, request→provider match broadcast, review→rating recompute.

## 3.4 API conventions

- `/api/v1`, JSON, JWT bearer (access 15m / refresh 7d cookie or header).
- Pagination: `limit/offset` (default 20, cap 100). Rate-limit public + auth routes.
- All money as **integer minor units (kobo)**, currency column `NGN`.
- Error shape: `{ error: { code, message, details? } }`; typed codes for client handling.
- OpenAPI generated from NestJS decorators (`@nestjs/swagger`) — drives typed client + doc.

## 3.5 Security baseline

- Argon2id password hashing; OTP single-use w/ TTL + rate limit (5 attempts).
- JWT stored httpOnly (refresh) — no secrets in client bundle.
- File upload: type/extension/mime allowlist + size caps (images ≤ 5MB), served via Cloudinary URLs.
- No secrets in repo (`.env.example` only); CI secrets in GitHub encrypted secrets.
- CORS allowlist; helmet; strict CSP on web.

---

# 4. Intent Engine (Phase 2) — design

## 4.1 Pipeline

```
raw text → normalize (Naira variants, abbreviations) → LLM extraction (strict JSON schema)
        → validate/fallback (rule engine) → Intent (PRD §6.1)
```

- LLM: `gpt-4o-mini` **R** with function/tool-forced JSON output, prompt tuned for Nigerian phrasing (`₦150k`, `under 150k`, city/LGA names, "for my child" audiences).
- **Fallback rule engine** (pure TS in `packages/engine`, offline, unit-tested): keyword→category map, budget regex `(₦?)(\d[\d,.]*)\s?k?`, result-type heuristics per PRD §6.2, timing keyword parser (`tomorrow`, `next week`, `monday`).
- **Latency budget:** intent returned ≤ 2s p95; caching of stable parses by normalized text hash (hot cache TTL 24h).
- Each parse stored (request_id, model_label, confidence) for eval + tuning.

## 4.2 Eval harness

- Fixture suite from buildable PRD §6.1 acceptance cases + 50 real-style Nigerian need sentences.
- CI job: run suite nightly, report precision/recall against expected Intents; block merges on regression below threshold.

---

# 5. Matching & Ranking Service (Phase 2)

- Pure TS in `packages/engine`, unit-tested; invoked by API.
- **Hard filters** (PRD §6.3): category/tag intersect · budget · service area · availability · status=active.
- **Score** = weighted sum (relevance .30 · distance_fit .20 · price_fit .15 · rating .15 · trust .10 · freshness .10); weights in config table for tuning.
- Geo: distance via PostGIS (or haversine util) between seeker coords and provider `area` center; `distance_fit` falls off with km.
- **Refinement** applies as filter/re-rank deltas on existing candidate set (no re-parse).
- Caching: per-request candidate result cache (Redis, invalidated on listing/provider change).

### Matching acceptance (from PRD §6.3)
1. No result violates budget/area/availability.
2. Verified > unverified at equal score.
3. Refinements re-rank w/o re-parsing, conversation state preserved.

---

# 6. Feature Phases & Deliverables

## Phase 1 — Core backend (auth, users, catalog)

**Deliverables**
- Monorepo foundation; NestJS API; Prisma schema for all MVP entities; migrations.
- Auth: signup/login (phone+OTP **Termii**; email+password fallback), refresh, profile, device token stub.
- Catalog: listing CRUD (product/service), portfolio upload, categories/tags seed, provider profile editor API.
- Files: Cloudinary upload endpoint.

**Exit criteria**
- E2E: signup → verify OTP → create listing → list by category.
- 100% of schema under migrations; CI green.

## Phase 2 — Need understanding + results

**Deliverables**
- Intent module + `packages/engine` (parser client, fallback, scorer).
- `POST /needs` (submit→parse→match→results), `GET /needs/:id/results`, `PATCH /needs/:id` refinement, `GET /needs/mine`.
- Result card backing data (person/product/service/multiple) serialized.
- Popular needs endpoint; discovery placeholder.

**Exit criteria**
- All parse acceptance cases pass in CI suite.
- Submit→results page ≤2s parse + ≤3s aggregate p95 against seeded data.
- PRD §6.3 matching acceptance met.

## Phase 3 — Seeker app (web PWA)

**Deliverables**
- Design-system pages: Home (#1.4), Results, Listing/Provider detail, My Needs, Saved.
- Contact actions, Save, example chips, refinement interactions (cheaper/closer/budget/gender/portfolio).
- Responsive mobile-first, installable PWA (manifest, offline shell, basic cache).

**Exit criteria**
- Flow A (PRD §4.1) and Flow B end-to-end vs seeded data.
- Lighthouse mobile ≥ 90 (perf/a11y/PWA).

## Phase 4 — Messaging + bookings

**Deliverables**
- Conversations (request-scoped), messages REST + polling (5s) MVP.
- Booking lifecycle API (requested→confirmed→in_progress→completed→cancelled) + provider confirm UI + status stepper.
- Contact action creates conversation + notification.

**Exit criteria**
- Flow B complete: book → confirm → complete.
- Seekers cannot message provider before a contact action; conversations scoped to request (PRD §20).

## Phase 5 — Provider workspace

**Deliverables**
- Profile wizard (offer → listings → prices → area → availability → portfolio).
- Incoming requests (matched demand + direct), respond w/ quote + availability.
- Bookings/orders management; rating/review view; provider reliability fields visible.

**Exit criteria**
- Flow C (PRD §4.3) complete; onboarding gate: profile complete before discoverable (PRD §8).

## Phase 6 — Trust, notifications, My Needs completeness

**Deliverables**
- Reviews (post-completed booking, aspects per PRD §21), rating recompute.
- Reports API + admin list view.
- Verified badge display (enum/display only; verification flow = later).
- In-app notifications (trigger list PRD §11); My Needs tabs (requests/saved/bookings/purchases/conversations).

**Exit criteria**
- Post-completion review visible on profile; report reaches admin queue.
- All PRD §11 triggers produce in-app notifications.

## Phase 7 — Polish, test coverage, release readiness

**Deliverables**
- Playwright E2E for PRD §14 acceptance criteria (1–10).
- A11y pass; performance budget; empty/error/offline states.
- Seed data refresh for market realism; docs (README, env setup).

**Exit criteria**
- PRD §14 checklist all green.
- Demo data deploys to staging; upgrade path planned.

## Phase 8 — Launch (MVP release)

**Deliverables**
- Staging → production pipeline (GitHub Actions → build image → Railway/Render; Neon prod DB).
- Monitoring: Sentry + health + uptime; basic dashboards (submissions, contact rate, completion).
- Rollback runbook; support channel; incident logging.
- Launch: initial five categories live, invite ~20 real providers (Lagos) to seed supply.

**Exit criteria (product)** — PRD §1.3 target metrics visible on dashboard at 2 weeks.

---

# 7. Post-MVP Roadmap (for planning only)

- **Phase 1+ (trust/payments):** provider verification flow + docs, Paystack payments (deposit/full/after-completion; escrow for high-risk), push (FCM) + email.
- **Phase 2+ (scale/engagement):** multi-need orchestration ("Your Moving Needs", PRD §29), provider subscriptions, promoted listings, lead fees, business accounts.
- **Phase 3+ (scope):** global-ready (i18n, multi-currency), Typesense search if needed, admin console v2, mobile web → native if warranted.

---

# 8. Cross-cutting workstreams

| Workstream | Where | Min effort to start |
|---|---|---|
| Design system | Phase 0 | tokens + Home reference page |
| Testing | all | unit on engine; E2E on flows A–D |
| DevOps/CI | Phase 0 | lint/typecheck/build; deploys at Phase 8 |
| Observability | Phase 1 | Sentry + request logging; dashboards Phase 8 |
| Accessibility | Phase 3/7 | DS-native focus/keyboard; audit at Phase 7 |
| Security | Phase 1/7 | OTP limits, JWT, upload rules; review at Phase 7 |
| Performance | Phase 3/7 | budgets, code-split, PWA cache |

---

# 9. Sequencing order (critical path)

```
Design system (0) → Backend core (1) → Intent+Matching (2) → Seeker app (3)
→ Messaging/Bookings (4) → Provider workspace (5) → Trust/Notify (6)
→ Polish/Release readiness (7) → Launch (8)
```

Parallel tracks: **DS/web UI** (can build screens against mocked API early) and **API+engine** (can integrate once Phase 2 lands). Flows A–D (PRD §4) are the continuous integration spine.

---

# 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| LLM intent parse quality | fallback rules + eval harness + confidence threshold → ask-for-clarification UX |
| Cold-start supply (few providers) | seed data + invite real providers at launch; demand flow (PRD §18) makes empty states productive |
| Geo accuracy in Nigeria (no postcodes) | city + LGA model; manual area picker; GPS optional |
| OTP/delivery cost + reliability | Termii w/ Twilio fallback; OTP on request only; allow email fallback |
| Matching bikeshedding | weights in config; A/B + metrics before tuning; never break hard filters |
| Mobile-data cost (NG market) | lightweight PWA, image CDN sizing, offline shell |
| Vendor lock-in | env-driven providers; intent + matching in pure TS engine |

---

# 11. Recommended first sprint (Week 1)

1. Establish monorepo + packages (`ui`, `shared`, `db`, `engine`, `api`, `web`).
2. Design tokens + Tailwind preset + Home reference page.
3. Prisma schema v1 + migrations + seed script.
4. Auth (OTP via Termii test key) + listing CRUD API.
5. Engines: begin intent fixture suite; write fallback rule parser.
6. CI: lint/typecheck/unit/build green.

Exit: developer can run `docker compose up` (Postgres+Redis), register via OTP, create a listing, and see it in a seeded category — with CI passing on `main`.

---

# 12. Appendix — tech-owner notes

- **Money:** store kobo; format ₦ via `Intl`; budget comparisons on integers only.
- **Prisma + PostGIS:** geo columns via raw SQL migrations; keep `engine` float math pure/tested.
- **Real-time decision:** polling (5s) is cheapest and sufficient for MVP messaging; revisit only if engagement shows need.
- **Multi-need:** `extras[]` captured in Intent schema now; orchestration UI later.
- **i18n:** store UI strings as en-NG; keep plural/currency rules in one util from day one.