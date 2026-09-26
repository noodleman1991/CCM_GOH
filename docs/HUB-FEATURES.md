# Connecting Climate Minds Hub — Feature Inventory & Spec

A grounded reference of everything the Hub does, what was requested per area, the stack, and the design language. Generated from the codebase (routes, Prisma models, Sanity schemas, server actions, lib services), not memory.

---

## 0. What the Hub is

A multilingual community platform for the **climate × mental-health** research community. It brings together research outputs, lived-experience testimony, regional communities, people-discovery, and (in progress) collaboration workspaces + comments + messaging — across **4 locales (en/es/fr/ar, with Arabic RTL)**, mobile-first, accessible.

---

## 1. The Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16.1.1** (App Router, Turbopack, React 19.1.1) |
| i18n | **next-intl** (en/es/fr/ar; Arabic RTL); 1,061 keys at parity |
| Auth | **Clerk** (`User.id` IS the Clerk id) |
| Database | **Neon/Postgres** + **Prisma** (client → `@/generated/prisma`, pinned 6.19.1), `safeQuery` wrapper |
| CMS | **Sanity** (styled-block-content, document-internationalization, Presentation tool) |
| Search | **Algolia** (users, case studies, news, agendas; field-level redaction at index time) |
| File storage | **Cloudflare R2** (S3-compatible via `@aws-sdk/client-s3`; `ccm-collab` bucket, `members/`+`public/` prefixes) |
| Email | **Resend** (localized/RTL templates; unsubscribe tokens) |
| Rate limiting | **Upstash** (Redis sliding-window) with **Postgres fallback** |
| Anti-bot | **Cloudflare Turnstile** |
| PDF | **EmbedPDF 2.x** (native annotation plugin; DocumentManager loader) |
| Analytics | **Plausible** (cookieless) |
| Monitoring | **Sentry** (prod only; no-op in dev) |
| Maps | hand-rolled **SVG choropleth** (`d3-geo`, `region-geometry.json`) |
| UI | **shadcn** + Radix + Tailwind v4 + **vaul** (drawers) + framer-motion |
| Hosting | **Vercel** (assumed; Fluid Compute) |

---

## 2. Design language (the "style of the Hub")

**Palette** (CSS vars in `globals.css`): `ccm-sky #9BC6DA` · `ccm-water #4186C3` · `ccm-sea #205596` · `ccm-midnight #0B3160` (the deep navy sidebar). A calm blue water/sea/sky range; gold/sand used sparingly as accents.

**Type:** Latin → **Poppins** (headings) / **Lato** (body); Arabic/RTL → **Lalezar** (headings) / **Tajawal** (body). Switched via `--font-heading`/`--font-body` CSS vars with an `[dir=rtl]` override block. Use `font-heading` on every title so Arabic gets Lalezar automatically.

**Tokens** (`lib/design-tokens.ts`): `heading()` (sm/md/lg/xl scale), `spacingY()`, `gridGap()`, `containerWidth()`, `cardAspect()` — reuse these instead of ad-hoc values. Shared `SectionContainer` for backgrounds/light-text.

**Layout rules:** **mobile-first** (author at 375 first, enhance at md/lg); **drawers over shrunk desktop** on mobile; **logical CSS props only** (`ms/me/ps/pe`, `-start/-end`) so RTL is correct by construction; reduced-motion honored; `<bdi>`/`dir="auto"` on names + locations.

**Design VOICE (standing rule):** *simple but not basic; smooth and calm; playful but professional; research-oriented.* **Never write copy that performs warmth.** Section labels are quiet nouns ("Story", "About", "Discussion"), not narration. Restraint over decoration. The content is the warmth, not the chrome.

**Principle:** polish = **consistency with the existing CCM design language**, not a redesign. Reuse tokens/components; finish what's half-built rather than reinvent.

---

## 3. Features (by area)

Legend: ✅ shipped · 🔶 built-but-not-fully-integrated · 🧱 infra/planning.

### 3.1 Content & Research outputs ✅
- **Case studies** — list + `[slug]` detail + multi-stage submission form (`/research-and-action/case-studies`). Lane-B 4-lang title/excerpt; single-lang body. Geocoded location (Nominatim). Review workflow in Studio. Sanity `caseStudy` + `caseStudyDraft`.
- **News** — site `newsPost` + `externalSource` in one feed; `[slug]` detail. (Redesigned: dropped the "CCM" badge; external = source+favicon+↗.)
- **Lived experiences** — list + `[slug]` detail + `/submit` form + Studio review. Person-centered modal (redesigned). Sanity `livedExperience` with `issue`/`personContext`/`author`/`tags`.
- **Agendas / Reports / Toolkits** — Global/Regional/Community agendas, impact reports, toolkits (`/research-and-action/*`). Download tracking (IP-stripped). Sanity `agenda`/`report`.
- **The Reader** 🔶 — Global Agenda as an in-app docs reader (`/reader/[[...slug]]`), Sanity `docsChapter`. *See §5.*

### 3.2 People & Discovery ✅
- **Collaborate** (`/collaborate`) — discover people by region/work-type/expertise, searchable, carousels per regional community.
- **Profiles** (`/profiles`, `/profiles/[username]`) — public profiles; region badges, prompts, recent work, contributions. Profile import from LinkedIn (Clerk)/ORCID/OpenAlex.
- **Search** (`/search`) — Algolia InstantSearch across users + content (gated behind client mount to avoid SSR hang).
- **Regional communities** (`/communities/[slug]`) — per-region landing pages (template or custom block mode), team grids, scoped content, optional interactive map.

### 3.3 Engagement (the big in-progress program) 🔶🧱
- **Comments** — polymorphic engine (Postgres), targets caseStudy/newsPost/livedExperience/collab threads; one-level nesting; lazy ISR-safe island; keyset pagination.
- **Moderation** (`/moderation`) — two-tier wordlist (block→removed; review/anon→pending) + in-app queue, role-gated; Arabic-aware normalization; Turnstile on anon; notify-on-approve. Broadcast tool (`/moderation/broadcast`).
- **Reactions / @mentions / Notifications** — `Reaction`, `Mention`, `Notification` + `NotificationPreference` (email gating + unsubscribe). Notification bell (→ moving into avatar).
- **Collaboration workspaces** (`/collaborations`, `/collaborations/[id]`) — Notion-style shell (Overview·Threads·Files·Media·Members); roles OWNER/EDITOR/COMMENTER/VIEWER; R2 files (presigned); YouTube media; **EmbedPDF native annotation** (export/import persistence).
- **Direct messages** (`/messages`) — `Conversation`/`Message`, inbox with SWR poll, privacy (`allowMessagesFrom`) + `UserBlock` enforced, rate-limited, report/delete. *Redesign in progress — see §4.*

### 3.4 Account, Dashboard, Settings ✅
- **Dashboard** (`/dashboard`) — your community, quick actions, submissions. Profile edit (tabbed), account, settings (notification prefs + DM privacy + block list).
- **Onboarding** (`/onboarding`) — multi-step, writes `preferredLanguage`, communities, work types, prompts.
- **GDPR** — `/api/account/export` (DSAR), account deletion sweeps Prisma + Sanity + (planned) R2/Algolia; cookieless analytics; cookie consent.

### 3.5 Platform / Infra 🧱
- **Maps** — faceted SVG choropleth (`/api/maps/region-data`); region-facets (caseStudy/livedExp/member/news counts).
- **Legal** (`/legal/[doc]`) — Terms + Privacy (4-lang, user-favorable, GDPR-aligned).
- **Auth/authz** — `lib/authz.ts` (Prisma-role globally, membership-role per workspace).
- **Rate limit / R2 / health / webhooks** — `/api/health`, Clerk + Sanity webhooks, search sync/webhooks per content type.

---

## 4. The Messaging + Workspaces redesign (requested this session)

**Per-feature request:**
- **IA:** nest Workspaces + Messages under **Collaborate** as the parent hub (People · Workspaces · Messages-in-avatar). Discover → message → work-together as one motion.
- **Messages in the avatar:** move Notifications **and** Messages out of the header into the **avatar button** with unread badges; delete the floating header bell.
- **Inbox surface:** Instagram-style **hovering side panel** on large screens; **full-screen drawer** on mobile. Mobile-first.
- **Conversation search:** one box surfacing **existing conversations + new people** to start with.
- **Reply-to-a-message:** quoted preview + `replyToId`.
- **Link/share workspace files** into messages: a `📎` picker scoped to shared workspaces; inserts a *reference* (not a copy) resolving to a short-TTL presigned GET, permissions stay live.
- **Workspace group chats:** surface in the **unified inbox** as `👥 {workspace}` (a `Conversation` with `collaborationId`), same thread UI + workspace back-link. No separate Chat tab.
- **Contact privacy (the spine):** emails **never** reach the browser; the CTA is "Message," never "Email." Platform relays.
- **Message-as-email + reply-by-email (both, user-confirmed):** a DM optionally also emails the recipient; **reply-by-email** via per-conversation `relayToken` (`conv-{token}@reply.…`), inbound webhook → parse → post; full guards (signature, participant-match, loop suppression, dedupe, rate-limit, quote-strip).
- **Anti-bot (layered):** authed-only, **Turnstile on first contact**, send rate limits, sign-in-gated contact actions, redacted listings.
- **Minimal editor (B/i/link only):** shared by message composer + comment composer.
- **Fonts:** Latin/Arabic title correctness via `font-heading`; `<bdi>` on names.

**Schema deltas (all additive):** `Conversation.relayToken`, `.collaborationId`, `.isGroup`, `.title`; `Message.replyToId` + file-reference; `NotificationPreference` per-type matrix + `messageDelivery` enum.

**Status:** **planned, not built.** Full spec in `docs/design/redesign-wireframes.md` → "Messaging & Workspaces — full redesign spec" + the reply-by-email and notifications-rethink sections.

---

## 5. The Reader (requested + in progress)

**Request:** make the Global Agenda (currently a separate Docusaurus site, `reader.connectingclimateminds.org`, 13 chapters Cover→Appendices) read **chapter-by-chapter inside the Hub**, on par with the rest of the app — neat arrangement of text/chapters/images/links, mobile-first.

**Built:** ISR page `/reader/[[...slug]]`, sticky chapter nav + mobile drawer, PortableTextRenderer, Sanity `docsChapter` type, `styledBodyProjection` (dereferences images + internalLinks). Reading pane capped at readable measure; `heading()` scale; figures via `urlForCropped`; prev/next.

**Status:** ✅ content imported. The ETL (`scripts/import-agenda-reader.mjs --apply`) wrote **12 `docsChapter` documents** (Forward → Appendices, 554 blocks) to `gm67v7rk`/`production_2`, verified by read-back. The Reader is now fully populated.

---

## 6. Overall request (the through-line)

A coherent production push across the whole product: the big **comments + collaboration + engagement + messaging** program, the **Reader**, plus a site-wide quality pass — **i18n/RTL correctness, mobile-first responsiveness, accessibility, SEO, GDPR/legal, performance** — all on-brand (finish the existing design language, don't redesign), built slice-by-slice with green gates (typecheck + 246 tests + build), validated against the **rendered UI** (not just a green build), with **no AI attribution in commits**.

---

## 7. Known open items
- Messaging/workspaces redesign — **planned, not built** (§4).
- Reader content — **✅ imported** (12 chapters live in Sanity).
- Regional-page **image-load layout shift** (avatars pop in, content jumps).
- PortableText-block-in-`blocks[]` content warning (a `page` doc mismodels a PortableText block).
- Multilingual case-study **body** content + language filters.
- **Case-study form validation i18n** — the lived-experience form now localizes its Zod messages (es/fr/ar via a `makeLivedExperienceSchema(messages)` factory + the `livedExperienceSubmission.validation` namespace). The **case-study form** still has ~10 hardcoded-English Zod messages in a module-level `formSchema` (`components/forms/case-study-form.tsx:46`); it surfaces them client-side via a custom `errors` map. Localizing it means importing next-intl into that form, adding a `caseStudySubmission.validation` namespace, and moving `formSchema` to a component-level localized factory — a meaningful refactor of a large working form, deferred pending rendered-UI validation.
- Browser-validation of the full branch; branch merge (unpushed).
