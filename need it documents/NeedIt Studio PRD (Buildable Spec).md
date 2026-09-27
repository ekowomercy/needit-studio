# **NeedIt Studio — Buildable PRD**

**Version:** 1.0 (redefined)
**Status:** Draft for engineering planning
**Source:** "NeedIt Studio PRD" (original concept doc)
**Market:** Nigeria (MVP), global-ready data model
**Primary experience:** "Tell us what you need."

> This document is written to be **buildable**: it defines scopes, entities, states, flows, API surface, matching behavior, and acceptance criteria — so engineers can plan without further product Q&A on MVP scope.

---

# 1. Product Definition

## 1.1 What it is

NeedIt Studio is a need-to-solution marketplace. Users describe a need in natural language, and NeedIt:

1. Understands the need (intent parse).
2. Determines the solution type(s): **person**, **product**, **service**, or **multiple**.
3. Fetches and ranks relevant results.
4. Handles follow-up refinement in the same conversation.
5. Lets users contact, book, save, and review.

## 1.2 Positioning

Traditional marketplace flow:
`Category → Subcategory → Filters → Search → Results`

NeedIt flow:
`Need → Understanding → Matching → Solution`

Category browsing exists but is **secondary**; natural-language request is the **primary** path.

## 1.3 Success metrics (MVP)

| Metric | Definition |
|---|---|
| Need-submission rate | % of active users who submit at least one need |
| Time-to-relevant-results | Median time between submit and displayed results |
| Contact rate | % of requests that produce a contact message |
| Completion rate | % of contacts that become completed jobs/purchases |
| Provider match rate | % of providers receiving at least one genuine lead in first 30 days |
| Retention | % of users returning within 7 days |
| Satisfaction | Post-completion review score (target ≥ 4.0 / 5.0) |

The ultimate measure: **Did NeedIt successfully solve the user's need?**

---

# 2. Roles

| Role | Description | MVP? |
|---|---|---|
| **Seeker** | Submits needs, views results, contacts, books, reviews. A single user account may act as seeker and provider. | Yes |
| **Provider** | Creates a profile, adds listings, receives requests, responds, manages bookings. | Yes |
| **Guest** | Can see home screen and examples; must sign up to submit a need or contact. | Partial (read-only browse) |
| **Admin** | Reviews reports, verifies providers, moderates content. | Back-office only (out of MVP or minimal) |

**Account model:** one `User` record with optional seeker and provider facets. A user can be both.

---

# 3. Information Architecture (Screens)

## 3.1 Core screens

1. **Home** — hero "What do you need?" input, example prompts, popular needs chips, secondary category browse.
2. **Results** — solution cards ranked by match; type-aware (person/product/service); refinement bar + conversational follow-up input.
3. **Listing / Profile detail** — full provider profile or product/service listing with portfolio, prices, availability, reviews, action button.
4. **My Needs** — request list w/ statuses, saved items, bookings, purchases, conversations (tabs).
5. **Conversation** — request-scoped chat between seeker and provider.
6. **Provider workspace** — profile editor, listings manager, incoming requests, bookings/orders, reviews.
7. **Auth** — signup/login (phone + OTP primary for Nigeria; email fallback).
8. **Onboarding (provider)** — collect offer, services, prices, area, availability, photos.

Supporting: **Notifications** (in-app list), **Settings/Account**.

## 3.2 Home screen layout (MVP)

```
┌────────────────────────────────────────┐
│  NeedIt Studio                          │
│  "What do you need?"  [input + send]    │
│  e.g. "I need a plumber tomorrow."      │
│  Tap an example instead →               │
│  ┌ Popular needs ────────────────      │
│  │ Home Services | Used Items | Tutors  │
│  │ Designers | Cleaning | Repairs ...   │
│  └───────────────────────────────────── │
│  Browse categories (secondary link)     │
└────────────────────────────────────────┘
```

---

# 4. User Flows (MVP happy paths)

## 4.1 Flow A — Seeker submits a need

```
Home → type "I need a used washing machine under ₦150k"
     → POST /needs (raw text)
     → intent parse (sync, <2s)
     → GET /needs/:id/results
     → Results screen: product cards (used, ≤ ₦150k, nearby first)
     → refine conversationally "only ones in Lagos"  → re-rank
     → open listing → Contact seller / Save
```

## 4.2 Flow B — Seeker books a service

```
Home → "I need a plumber tomorrow"
     → Results: plumber cards (availability, rating, price)
     → open profile → "Contact / Book"
     → booking modal (date/time) → POST /bookings
     → status = requested → provider confirms → confirmed
     → conversation thread attached to request
     → complete → review prompt
```

## 4.3 Flow C — Provider receives a request

```
Provider is matched to a need (matching or NeedIt Request)
→ notification + incoming request in workspace
→ response: "I can do this" + quote → seeker notified
→ booking confirmed → job → complete → review
```

## 4.4 Flow D — Submit-and-wait (demand marketplace)

```
Seeker: "I need a used fridge under ₦150k in my area"
→ no current match → request stays ACTIVE
→ new provider listing/seller matches later → match notification
→ provider may proactively respond to the request
```

---

# 5. Data Model

## 5.1 Core entities (MVP)

### User
```
id, phone, email, password_hash, display_name, avatar_url,
location_city, location_coords (lat/lng), created_at,
is_provider (bool), rating_avg, review_count
```

### UserRole / Profile facets
```
user_id, role: {seeker, provider}, profile_complete: bool
```

### NeedRequest  (the submitted natural-language need)
```
id, user_id, raw_text, intent_id,
status: {pending, matched, active, booked, completed, closed, expired},
categories[] (tags), result_type,
created_at, updated_at, expires_at
```

### Intent  (struct output of the parser)
```
id, need_request_id,
need: string            // "washing machine", "plumbing repair"
result_type: {person, product, service, multiple}
category_tag: string    // canonical category id
condition: {new, used, any} | null
budget: {amount, currency: "NGN", operator: {<=, >=, ~}} | null
location: {text, coords} | null
timing: {date, time, flexibility} | null
audience: {type, detail} | null    // e.g. child, age 10
subject: string | null             // e.g. mathematics
attributes: map<string,string>     // extra extracted facets
extras: []                         // secondary needs for multi-need parse
confidence: 0..1
```

### ProviderProfile
```
id, user_id, headline, bio, area (city + km radius),
availability: [{day, start, end}] | "monday-saturday" text,
starting_price, verification_status: {unverified, pending, verified},
response_rate, response_time_avg, completed_jobs, portfolio[]
```

### Listing  (type discriminated)
```
id, provider_id, listing_type: {product, service},
title, description, price, price_type: {fixed, starting, quote},
currency, condition (product only), images[], category_tag,
location, delivery: {local_pickup, delivery_available, delivery_cost},
status: {draft, active, paused, sold, hidden},
created_at, updated_at
```

### PortfolioItem
```
id, provider_id, title, media_urls[], description, category_tag
```

### Booking / Order
```
id, user_id, provider_id, listing_id?, need_request_id?,
type: {booking, order, request_fill},
status: {requested, confirmed, in_progress, completed, cancelled, refunded},
scheduled_at, quote_amount, currency, notes,
created_at, updated_at
```

### Conversation
```
id, user_id, provider_id, need_request_id,
```
### Message
```
id, conversation_id, sender_id, body, media_urls[], sent_at, read_at
```

### Review
```
id, author_id, listing_id?, provider_id?, booking_id,
rating (1..5), aspects: {quality, communication, reliability, value},
comment, created_at
```

### SavedItem
```
id, user_id, ref_type: {listing, provider, service, tutor, designer, seller}, ref_id
```

### Report
```
id, reporter_id, target_type, target_id, reason_code, detail, status: {open, resolved, dismissed}
```

### Notification
```
id, user_id, type, title, body, ref_id, read_at, created_at
```

## 5.2 Key enums

**Category tags (MVP):** home_services, used_products, professional_services, education, personal_services (+ sub-tags like plumbing, electronics, design, tutoring, hair, etc.)

**NeedRequest statuses:**
`pending → matched → active ⇄ booked → completed → closed`
`active` = open for provider responses (demand). `expired` for time/flexibility.

**Listing statuses:** `draft → active → paused | sold/hidden`

**Booking statuses:** `requested → confirmed → in_progress → completed → cancelled`

---

# 6. Core Logic Specs

## 6.1 Intent parsing ("Need Understanding")

**Goal:** from raw text → structured `Intent` in <2s.

**Approach (MVP):** LLM-based extraction into a strict JSON schema, with a deterministic keyword/rule fallback when the model is unavailable (offline resilience).

**Required output fields:** see `Intent` above. The parser must handle Nigerian context cues (₦/naira, city names, ₦ shorthand like "150k" = 150,000).

**Multiple needs (multi-intent):** MVP v1 parses a single primary need; if multiple needs are detected (e.g. "I need a cleaner and a fridge"), store them in `extras` and match the primary. Full multi-need organization = Post-MVP.

**Acceptance criteria (parse):**
- GIVEN "I need a used washing machine under ₦150k" THEN result_type=product, condition=used, budget={150000, NGN, <=}, category=used_products/appliances.
- GIVEN "I need a plumber tomorrow" THEN result_type=person, category=home_services/plumbing, timing=tomorrow.
- GIVEN "I need someone to design a flyer" THEN result_type=service, category=professional_services/design.
- GIVEN "I need a birthday cake tomorrow" THEN result_type=multiple (bakers + cakes + shops).
- Budget "₦150k" parsed to 150000 NGN. "150,000" and "150k" both handled.

## 6.2 Result type inference

| Rule | Result type |
|---|---|
| Request contains a skill/profession ("plumber", "tutor", "designer") | person (+ possibly service) |
| Request names a noun product w/ condition/price ("used fridge", "laptop under ₦300k") | product |
| Request describes an activity/job ("clean my apartment", "fix my tap") | service |
| Request implies multiple interchangeable options (event needs: "cake for birthday") | multiple |
| Ambiguous (service + deliverable) | service + product mix |

## 6.3 Matching & ranking

**Hard filters (must pass):**
- Category tag intersect (or related tag).
- Budget: listing quote/price within budget when budget present (or provider matches).
- Service area: provider `area` covers user location (or user location within provider radius).
- Availability: provider availability intersects requested timing.
- Listing status = active; provider verified-or-unverified both allowed (verified shown first).

**Ranking score (weighted, normalized 0–100):**

```
score = w1·relevance       (0.30)
      + w2·distance_fit    (0.20)   // within area, closer = better
      + w3·price_fit       (0.15)   // lower than budget = better
      + w4·rating          (0.15)   // avg rating, review_count smoothed
      + w5·trust           (0.10)   // verification, response rate, completed jobs
      + w6·freshness       (0.10)   // recently updated/replied
```

Weights above are the initial config; store as constants so they can be tuned without code changes.

**Re-ranking on refinement:** refinement filters/re-weights the existing candidate set — do not re-run parse. E.g. "show me cheaper ones" → sort by price; "only people available tomorrow" → add hard filter availability=tomorrow.

**Acceptance criteria (matching):**
- Results never show items above a stated budget.
- Results show verified providers before unverified at equal score.
- "Show me women tutors" filters by attribute and re-ranks, keeping same conversation.

## 6.4 Refinement / conversational follow-up

Kept as conversation state on the request. Refinements apply server-side as **filter + re-rank deltas** on the existing `Intent` + candidate set. Sample refinement intents: cheaper/closer/available-tomorrow/gender/fixed-budget/portfolio-quality.

---

# 7. API Surface (MVP, REST)

All endpoints `/api/v1`, JSON, JWT auth except public ones.
Assume `client` = app; pagination via `limit/offset`.

| Area | Endpoint | Notes |
|---|---|---|
| Auth | `POST /auth/signup`, `POST /auth/login` | phone+OTP primary, email fallback |
| Auth | `POST /auth/verify-otp`, `POST /auth/refresh` | |
| Needs | `POST /needs` | body: `{text}` → optionally `{location}`; returns request + results |
| Needs | `POST /needs/parse` | explicit parse (client preview), returns `Intent` |
| Needs | `GET /needs/:id` | request + status + intent |
| Needs | `GET /needs/:id/results` | ranked candidates |
| Needs | `PATCH /needs/:id` | refinement delta |
| Needs | `GET /needs/mine` | My Needs list |
| Catalog | `GET /listings?category=&q=&filters=` | product/service search |
| Catalog | `GET /listings/:id` | detail |
| Providers | `GET /providers`, `GET /providers/:id` | profile + listings + reviews |
| Providers | `GET /providers/:id/reviews` | |
| Contact | `POST /needs/:id/contact` | opens/creates conversation, notifies provider |
| Bookings | `POST /bookings`, `GET /bookings/mine` | seeker booking |
| Workspace | `GET /bookings/for-provider`, `PATCH /bookings/:id` | confirm/complete/cancel |
| Workspace | `GET/POST/PATCH /provider/profile` | |
| Workspace | `POST/PATCH/DELETE /listings` (provider-owned) | |
| Workspace | `GET /provider/incoming-requests` | matched demand + direct requests |
| Messaging | `POST /conversations/:id/messages`, `GET /conversations`, `GET /conversations/:id` | request-scoped |
| Reviews | `POST /reviews` (after completed booking) | |
| Saved | `GET/POST/DELETE /saved` | |
| Safety | `POST /reports` | report provider/listing/user |
| Notifications | `GET /notifications`, `POST /notifications/read` | |
| Discovery | `GET /popular-needs`, `GET /categories` | secondary browse |

---

# 8. Provider Workspace (MVP)

Provider can:
- Create/edit profile (offer, services, prices, photos/portfolio, area, availability).
- Add/edit listings (product or service) w/ images + price type (fixed/starting/quote).
- See incoming requests (matched demand + direct), respond with availability + quote.
- Manage bookings/orders through status lifecycle.
- Receive review notifications and view rating.

Provider onboarding gating: provider must complete profile (offer + area + at least one listing) before appearing in results.

---

# 9. Trust & Safety (MVP)

- **Verification:** optional identity/BVN-based verification request. `verified` badge shown on profiles. (Implementation level: enum now; verify flow = Phase 2.)
- **Reviews:** seeker can review after a completed booking; rating = 1–5 + aspects.
- **Reporting:** report button on profiles/listings/conversations. Reports land in admin queue (out-of-MVP console can be a simple list view).
- **Transaction history:** users can view their requests/orders in My Needs.
- **Provider reliability signals (displayed):** response rate, avg response time, completed jobs, cancellation/complaint indicators when thresholds exceeded.

---

# 10. Trust-critical limits (MVP constraints)

- No in-app payments in MVP: payments are direct provider-to-customer (record of amount only). Payment rails / escrow = Phase 2. (Aligns with PRD §14.)
- Messaging in-app; do not expose raw contact before a contact action is made.
- Marketplace should never collect nor log secrets/keys.

---

# 11. Notifications (MVP)

Trigger at minimum:
- Seeker: provider responded · booking confirmed/changed · match found · provider messaged · booking approaching.
- Provider: matched demand · seeker contacted · booking received · listing interest · review received.

In-app now; push/email = Phase 2.

---

# 12. MVP Scope Table

## In (must have)

- Auth (phone+OTP, email fallback)
- Home: hero input, examples, popular needs, categories secondary
- Intent parse → structured Intent
- Results w/ type-aware cards + ranked matching
- Conversational refinement (cheaper/closer/availability/budget/gender/portfolio)
- Request statuses + demand ("NeedIt Requests") w/ active-state matching
- Listing/Provider detail + portfolios
- Contact (request-scoped conversation)
- Bookings lifecycle
- Save items
- My Needs (current/past/saved/bookings/purchases/conversations)
- Provider workspace (profile, listings, incoming requests, bookings)
- Reviews (post-completion)
- Reporting
- In-app notifications
- Verified badge display (verification request = Phase 2)

## Out (post-MVP phases)

- Payments / escrow / deposits
- Multi-need orchestration ("Your Moving Needs")
- Push + email notifications
- Provider subscriptions / promoted listings / lead fees / business accounts
- Admin console (advanced)
- Portfolios deep-media (video, documents)
- Global currency/language handling

---

# 13. Recommended Build Phases

- **Phase 0 (MVP):** Flows A–D, entities, parse, matching, results, contact, bookings, workspace, reviews, notifications, reporting. Proposed initial category set: home services, used products, professional services, education, personal services.
- **Phase 1:** Verification flow, payments (deposit/full/after-completion), push+email, admin console.
- **Phase 2:** Multi-need orchestration, provider subscriptions, promoted listings, lead fees, business accounts, global expansion readiness.

---

# 14. Acceptance Criteria (MVP gating)

The MVP ships only when:

1. A seeker can submit a natural-language need and see relevant results in ≤2 parse + ≤3s show.
2. All parse cases in §6.1 return the specified structured intent.
3. No result violates budget/area/availability hard filters.
4. A seeker can contact and book a provider, and the provider can confirm/complete.
5. A request with no current match can stay active and receive a provider response later (demand flow).
6. A user can save items and see them in My Needs.
7. A completed booking enables a review; rating shows on profile.
8. A user can report a provider/listing; report reaches admin queue.
9. Refinements re-rank without re-parsing and preserve conversation state.
10. No secrets in repo/config; phone/OTP and JWT flows follow security best practices.

---

# 15. Open Decisions (needed before build)

1. **Stack / platform:** web (PWA) vs native (Android/iOS)? Determines UI spec depth.
2. **NLP provider:** which LLM/intent service + fallback rules engine.
3. **Maps/geo:** city-level vs exact GPS for area matching (affects distance scoring).
4. **Standards for area/radius:** fixed radius vs zip/postal codes (Nigeria has no formal postcodes — city + LGA likely).
5. **OTP provider** for phone auth.
6. **Payment provider** for Phase 1 (Paystack/Flutterwave) — decision can wait but affects data model.

---

# 16. Open Questions for Product

- Should seekers be allowed to submit a need before login (capture after results)? Recommended: yes, capture at contact time.
- Should providers be able to create profiles with zero listings (browse-only visibility)? Recommended: no (gating per §8).
- What is the min viable category set for launch day (start from the 5 in §13)?