# PostHog product-analytics integration — implementation design

Repo: `/Users/amitlockshinski/WebstormProjects/turbo2`, branch `feat/payload-migration`. Design only; nothing was edited.

## 0. What the codebase actually has today (verified)

| Fact | Evidence |
|---|---|
| Neither `posthog-js` nor `posthog-node` is installed, and nothing references PostHog | `grep -nE '"(posthog\|@posthog…)' package.json` → no match; `ls node_modules \| grep -i posthog` → empty; repo-wide `grep -rniI posthog` (excl. node_modules/.next/.git) → empty |
| Consent is a three-category client provider persisted in `localStorage` (`ccm-cookie-consent`) and mirrored to a cookie `ccm-consent` | `components/cookie-consent/cookie-consent-provider.tsx:23` `const STORAGE_KEY = 'ccm-cookie-consent'`, `:27` `const COOKIE_NAME = 'ccm-consent'`, `:30-38` `setConsentCookie` |
| Consent has a tri-state on first paint: `consent=null && hasConsented=true` = still loading; `consent=null && hasConsented=false` = no choice yet; `consent` set = decided | provider `:41-62` (initial `hasConsented=true`, effect flips it); documented at `components/cookie-consent/analytics-scripts.tsx:13-19` |
| Plausible loads even before a choice ("cookieless, so loading before a choice is lawful") and cannot be un-injected once rendered | `analytics-scripts.tsx:6-10` and `:14-15` "a next/script tag can't be un-injected" |
| Provider stack order: `ClerkProvider dynamic` → `NextIntlClientProvider` → `ThemeProvider` → … → `CookieConsentProvider` → `{children}`, `<CookieConsentBanner/>`, `<AnalyticsScripts/>` | `app/[locale]/layout.tsx:162-175` |
| There is no root `app/layout.tsx`; the only root layout is `app/[locale]/layout.tsx` | `ls app/` → `(payload) [locale] api … studio`; `cat app/layout.tsx` → No such file |
| CSP is one function used for two header rules; `script-src` and `connect-src` already whitelist `https://plausible.io`; no `rewrites()` and no `skipTrailingSlashRedirect` exist | `next.config.mjs:33-51`, `:36` (script-src), `:40` (connect-src); `grep -n "rewrites\|skipTrailingSlashRedirect" next.config.mjs` → empty |
| The proxy runs next-intl on every non-`/api` path its matcher catches, and the matcher catches everything except `studio`, `guide-to-editors`, `_next`, `_vercel`, and static extensions | `proxy.ts:96-100` `if (!req.nextUrl.pathname.startsWith('/api/')) { const intlResponse = intlMiddleware(req) …}`; matcher `proxy.ts:151` |
| Sentry precedent: client SDK is production-only and explicitly disables replay "privacy-first for a vulnerable audience" | `instrumentation-client.ts:3-10` |
| `lib/env.ts` has an `OPTIONAL_FEATURES` registry for degrade-gracefully keys | `lib/env.ts:14-21` |
| `.env.example` ends with a Plausible note and says `NEXT_PUBLIC_FEATURE_ENGAGEMENT` "is the ONLY live feature flag" | `.env.example:129-136` |
| `FEATURES.engagement` is read in 27 places, including **server** components that `redirect("/")` | `app/[locale]/(main)/messages/page.tsx:21`, `collaborations/page.tsx:27`, `collaborations/[id]/page.tsx:38`, `collaborate/events/page.tsx:26` |
| Clerk user id **is** the Prisma `User.id` (webhook creates `prisma.user.create({ data: { id, … } })`) | `app/api/webhooks/clerk/route.ts:134-137`; `prisma/schema.prisma:39` `id String @id` |
| Sign-out happens via `useClerk().signOut()` in two components | `components/auth-nav-user.tsx:24,65`; `components/user-menu-card.tsx:33,116,180` |
| Existing download "analytics" is a Prisma `DownloadEvent` table with IP/UA deliberately removed; the client-called track routes have `auth()` commented out | `app/api/analytics/download/route.ts:12-14`; `prisma/schema.prisma:231-245`; `app/api/reports/download/track/route.ts:15` `// const { userId } = await auth();` (same at `agendas/download/track/route.ts:15`) |
| Payload hooks run inside the write transaction; side effects go through `runAfterCommit` (uses `after()` when in a request, detaches otherwise) | `payload/hooks/after-commit.ts:1-27`, `:83-110` |
| Moderation hook already computes `transitioned/from/to` after commit — the natural server-event seam | `payload/hooks/moderation.ts:618-646`, `:791-800` |
| Privacy policy promises Plausible, "cookie-free", "only essential cookies", "no IP addresses or device fingerprints for analytics" — in all four locales | `lib/legal/content.ts:33,39,40` (en), `:92-93` (es), `:145-146` (fr), `:198` (ar); rendered by `app/[locale]/(main)/legal/[doc]/page.tsx:3` |
| Cookie-banner copy says analytics needs "No consent needed here!" in all four locales | `messages/en.json` `cookieConsent.categories.analytics.description`; es/fr/ar equivalents printed above |
| `jsdom` + `@testing-library/react` are installed but **no test uses a jsdom environment yet** (vitest default is `node`) | `package.json:124,161-162`; `vitest.config.ts` `environment: "node"`; repo-wide grep for `@vitest-environment jsdom` → none |
| Algolia InstantSearch mounts with `insights={false}` everywhere | `components/search/search-interface.tsx:150,194,238`; `grouped-search.tsx:346` |

Registry versions as of today (`pnpm view … version`, network read): **posthog-js 1.433.6**, **posthog-node 5.52.4**.

---

## 1. Packages, host, reverse proxy, CSP

**Packages**
```
pnpm add posthog-js@^1.433 posthog-node@^5.52
```
Both ship ESM + types; `posthog-node` 5.x targets Node ≥ 20 (repo engine: `package.json:8` `"node": ">=20"`).

**Host: EU cloud.** The audience is a European-led health-adjacent community with GDPR-drafted legal text (`lib/legal/content.ts:1-3`). Use `https://eu.i.posthog.com` (ingest) and `https://eu-assets.i.posthog.com` (lazy-loaded SDK extensions). Data stays in Frankfurt; the privacy policy's processor list gains one EU processor rather than a US transfer.

**Same-origin reverse proxy** — three changes, all in files that exist:

`next.config.mjs` (add inside `nextConfig`, next to `headers()`):
```js
// PostHog reverse proxy: same-origin so CSP stays 'self' and ad-block lists
// that key on *.posthog.com don't drop the events. The prefix is one
// constant; change it if a blocklist ever learns "/ingest".
const POSTHOG_PROXY_PREFIX = '/ingest';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';
const POSTHOG_ASSETS_HOST = POSTHOG_HOST.replace('://eu.i.', '://eu-assets.i.').replace('://us.i.', '://us-assets.i.');

// PostHog's own Next guidance: its endpoints end in a trailing slash
// (/decide/, /e/) and Next's slash-normalising redirect would 308 them.
skipTrailingSlashRedirect: true,

async rewrites() {
  return [
    { source: `${POSTHOG_PROXY_PREFIX}/static/:path*`, destination: `${POSTHOG_ASSETS_HOST}/static/:path*` },
    { source: `${POSTHOG_PROXY_PREFIX}/:path*`,        destination: `${POSTHOG_HOST}/:path*` },
  ];
},
```
Rewrites survive the `withNextIntl` → `withPayload` → `withSentryConfig` wrapping (`next.config.mjs:190-210`) because all three merge rather than replace the base config. Note `skipTrailingSlashRedirect: true` is app-wide; the app already has no trailing-slash routes and next-intl handles its own redirects, so the only observable effect is that `/foo/` no longer 308s to `/foo` — call this out in the PR.

`proxy.ts` — **required, not optional.** Rewrites run *after* middleware, so today `/ingest/e/` would hit the proxy, fail the `/api/` test at `proxy.ts:97`, and next-intl would 307 it to `/en/ingest/e/` (defaultLocale `en`, `i18n/routing.ts:3-6`). Either exclude it from the matcher or early-return:
```ts
// proxy.ts, first thing inside clerkMiddleware, before the /admin check at :50
if (req.nextUrl.pathname.startsWith('/ingest/')) return NextResponse.next()
```
Prefer the early return over editing the matcher regex at `:151` (that regex is already load-bearing for sitemap/robots and is easy to break). The early return also skips Clerk's `auth()` cost on every beacon.

`next.config.mjs` CSP (`contentSecurityPolicy`, `:33-51`) — because of the proxy, **no new hosts** are needed:
- `script-src 'self' …` (`:36`) already covers the npm-bundled SDK and its lazy `/ingest/static/*.js` extension loads.
- `connect-src 'self' …` (`:40`) already covers `POST /ingest/e/`, `/ingest/decide/`, `/ingest/flags/`.
- `img-src` / `frame-src` unchanged (no surveys, no toolbar; see §3).
Do **not** add `https://eu.i.posthog.com` to `connect-src` "just in case" — if it is there, a mis-set `api_host` silently falls back to the direct host and the proxy stops being verified by the CSP. The one exception: if you later enable the PostHog toolbar you need `script-src https://eu.posthog.com` and `ui_host`; leave that out of production.

`vercel.json` needs nothing; rewrites are Next-level. Confirm after deploy with `curl -sI https://<host>/ingest/decide/` (expect a PostHog response, not a 307 to `/en/…`).

---

## 2. Consent gating

### Recommendation: do not load at all until `analytics === true`

Reject the "cookieless/memory persistence before consent" option, for four reasons grounded in this repo:

1. **The legal copy promises nothing runs.** `lib/legal/content.ts:40` "We set only essential cookies" and the banner says the analytics category is cookieless (`messages/en.json cookieConsent.categories.analytics.description`). A memory-mode SDK still POSTs the visitor's IP, user agent and URL to PostHog on every pageview — that is processing of personal data before consent, cookies or not. Plausible got away with pre-consent loading precisely because it discards identifiers server-side; PostHog in memory mode does not.
2. **Bundle cost for the majority.** posthog-js is roughly 50–70 KB gzipped (unverified precise figure; it is materially larger than the Plausible tag). Loading it for decliners buys nothing.
3. **Sentry precedent.** The repo already decided "privacy-first for a vulnerable audience" (`instrumentation-client.ts:5-6`). Loading a behavioural SDK speculatively contradicts that.
4. **Simplicity of the gate.** "Loaded ⇔ consented" is a single boolean that can be unit-tested; "loaded but opted-out with memory persistence, then switched to cookie persistence, then …" is three states and PostHog's `set_config` transitions have edge cases.

Consequence to accept: **no anonymous-visitor product analytics for people who never click the banner**; Plausible keeps covering that traffic (§8). The banner defaults the analytics toggle to on (`cookie-consent-banner.tsx:25`), so accept-rate will be high.

### The gate, extracted so it can be tested

`lib/analytics/consent.ts` (pure, no React, node-env testable):
```ts
export type ConsentSnapshot = { consent: { analytics: boolean } | null; hasConsented: boolean }

/** PostHog loads ONLY on an explicit, stored "analytics: true". */
export function posthogAllowed({ consent }: ConsentSnapshot): boolean {
  return consent?.analytics === true
}

/** Plausible keeps its existing pre-choice rule (analytics-scripts.tsx:19). */
export function plausibleAllowed({ consent, hasConsented }: ConsentSnapshot): boolean {
  return consent ? consent.analytics : !hasConsented
}
```
Then `analytics-scripts.tsx:19` becomes `const allowed = plausibleAllowed({ consent, hasConsented })` — behaviour-preserving, and the two rules live side by side so the asymmetry is explicit.

### First paint and the stored decision

Because `posthogAllowed` is false while `consent === null`, the "still loading" frame (`hasConsented=true, consent=null`) renders nothing — the same trick `analytics-scripts.tsx:13-16` relies on. The stored decision is read in the provider's mount effect (`cookie-consent-provider.tsx:48-62`) and PostHog loads one render later. No flash, no early beacon.

### Decline after accept (unload / opt-out)

posthog-js cannot be truly removed from the page, so "unload" means: stop capturing, persist an opt-out flag, and wipe identity + its storage. In `lib/analytics/client.ts`:
```ts
let ph: import('posthog-js').PostHog | null = null

export async function loadPostHog(opts: { locale: string; dir: 'ltr' | 'rtl' }) {
  if (ph) { ph.opt_in_capturing(); return ph }
  const { default: posthog } = await import('posthog-js')   // zero bytes for decliners
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, { /* §3 */ })
  posthog.register({ locale: opts.locale, dir: opts.dir, app_env: process.env.NEXT_PUBLIC_SITE_ENV ?? 'development' })
  ph = posthog
  return ph
}

export function unloadPostHog() {
  if (!ph) return
  ph.opt_out_capturing()   // future capture() calls are dropped
  ph.reset()               // drops distinct_id, super props, ph_* storage for this key
  // opt_out_capturing persists its own flag in localStorage; that flag is a
  // record of a refusal and belongs to the essential category.
}

export function getPostHog() { return ph && !ph.has_opted_out_capturing() ? ph : null }
```
The consent provider does not need a new API: the PostHog provider (§3) subscribes to `useCookieConsent()` and reacts to `consent.analytics` transitions — `false→true` loads, `true→false` unloads. Re-accept calls `opt_in_capturing()` on the already-initialised instance.

---

## 3. Client provider

New file `components/analytics/posthog-provider.tsx` mounted **inside** `CookieConsentProvider`, next to `<AnalyticsScripts />` at `app/[locale]/layout.tsx:174` — that position is already inside `ClerkProvider` (for `useAuth`), `NextIntlClientProvider` (for `useLocale`) and the consent provider. No context of its own is needed; components call a module-level `track()` (§6), so nothing has to be wrapped.

```tsx
'use client'
import { useEffect, useRef, Suspense } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useLocale } from 'next-intl'
import { useCookieConsent } from '@/components/cookie-consent/cookie-consent-provider'
import { rtlLocales } from '@/i18n/routing'
import { posthogAllowed } from '@/lib/analytics/consent'
import { loadPostHog, unloadPostHog, getPostHog } from '@/lib/analytics/client'
import { PostHogPageview } from './posthog-pageview'

export function PostHogProvider() {
  const { consent, hasConsented } = useCookieConsent()
  const { userId, isLoaded } = useAuth()
  const locale = useLocale()
  const allowed = posthogAllowed({ consent, hasConsented })
  const enabled = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)

  // 1. consent → load / unload
  useEffect(() => {
    if (!enabled) return
    if (allowed) void loadPostHog({ locale, dir: rtlLocales.includes(locale) ? 'rtl' : 'ltr' })
    else unloadPostHog()
  }, [enabled, allowed, locale])

  // 2. locale as a super property (re-register on locale switch; the page
  //    does a full navigation to /<locale>/… so this mostly re-runs on mount)
  useEffect(() => { getPostHog()?.register({ locale, dir: rtlLocales.includes(locale) ? 'rtl' : 'ltr' }) }, [locale])

  // 3. identity — §4
  const prevUser = useRef<string | null>(null)
  useEffect(() => {
    if (!isLoaded) return
    const ph = getPostHog()
    if (!ph) { prevUser.current = userId ?? null; return }
    if (userId && prevUser.current !== userId) ph.identify(userId)
    if (!userId && prevUser.current) ph.reset()
    prevUser.current = userId ?? null
  }, [isLoaded, userId, allowed])

  if (!enabled || !allowed) return null
  return <Suspense fallback={null}><PostHogPageview /></Suspense>
}
```

`components/analytics/posthog-pageview.tsx` — separate file because `useSearchParams()` must sit under a `Suspense` boundary or Next will bail the whole route out of static rendering:
```tsx
'use client'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { getPostHog } from '@/lib/analytics/client'

export function PostHogPageview() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  useEffect(() => {
    const ph = getPostHog(); if (!ph || !pathname) return
    // strip the locale prefix so /en/news and /ar/news roll up together;
    // `locale` is already a super property
    const path_unlocalized = pathname.replace(/^\/(en|es|fr|ar)(?=\/|$)/, '') || '/'
    ph.capture('$pageview', { $current_url: window.location.href, path_unlocalized,
      // never forward query strings wholesale — /search?q= carries user text
      has_query: searchParams.size > 0 })
  }, [pathname, searchParams])
  return null
}
```

**Init options** (`lib/analytics/client.ts`), with the reasoning each one needs:
```ts
posthog.init(key, {
  api_host: '/ingest',                     // §1 proxy; NOT the eu host directly
  ui_host: 'https://eu.posthog.com',       // only affects toolbar/links; harmless
  person_profiles: 'identified_only',      // anonymous events stay anonymous & cheap; profiles only after identify()
  capture_pageview: false,                 // App Router: manual, see PostHogPageview
  capture_pageleave: true,                 // cheap; gives time-on-page without recording
  autocapture: false,                      // see below
  rageclick: false,
  capture_dead_clicks: false,
  disable_session_recording: true,         // OFF by default; matches Sentry no-replay stance
  session_recording: { maskAllInputs: true, maskTextSelector: '*' }, // belt+braces if ever flipped on
  mask_all_text: true,                     // applies to autocapture/heatmaps/rageclick if any is enabled later
  mask_all_element_attributes: true,
  capture_performance: { web_vitals: true, network_timing: false }, // vitals yes; resource URLs no
  persistence: 'localStorage+cookie',      // fine: we are past consent when this runs
  cross_subdomain_cookie: false,
  secure_cookie: true,
  disable_surveys: true,
  advanced_disable_decide: false,          // keep /decide for flags later; set true if §7 stays "env only"
  loaded: (ph) => { if (process.env.NEXT_PUBLIC_SITE_ENV !== 'production') ph.debug(false) },
})
```

**Autocapture OFF — rationale.** Autocapture ships `$el_text` and element attributes for every click. On this site that text is comment bodies, lived-experience excerpts, workspace message previews and profile headlines (`prisma/schema.prisma:87-88` `livedExperienceStatement // sensitive — opt-in only`). Masking helps but is heuristic; the safe design is *explicit* events with a closed property schema (§6) and a test that rejects free-text keys. The cost is ~15 explicit `track()` call sites; that is the right trade for a health-adjacent community.

**Session recording OFF** — same reasoning as `instrumentation-client.ts:5-6`. If a future UX study needs it, enable per-flag on `/onboarding` only, with `maskAllInputs` + `maskTextSelector: '*'` (already in config above) and an explicit privacy-policy addendum.

**Dev/preview behaviour.** Mirror Sentry (`instrumentation-client.ts:9-10`): do not load when `NEXT_PUBLIC_SITE_ENV !== 'production'` unless `NEXT_PUBLIC_POSTHOG_DEBUG=1`. Previews that do load carry `app_env` as a super property so they can be filtered.

---

## 4. Identity

- `identify(userId)` with the **Clerk id** (`user_…`). It is already the Prisma primary key (`webhooks/clerk/route.ts:134-137`), so PostHog persons join to your own tables with no mapping. Never pass `email`, `firstName`, `username`, `image` — `identify()`'s second argument is left empty on the client.
- **Reset on sign-out.** Rather than patching both `signOut()` call sites (`auth-nav-user.tsx:65`, `user-menu-card.tsx:116,180`), the provider watches `useAuth().userId` (`id → null` ⇒ `reset()`), which also covers session expiry and Clerk's own sign-out from `<UserButton>`. `useAuth()` is the right hook under `ClerkProvider dynamic` — the repo already documents that `useUser()` is the wrong one for shell components (`components/sidebar-quick-actions.tsx:20`).
- **Person properties** are set **server-side only**, via `$set` on server events (§5), from the Prisma row: `role` (`community_member|community_editor|team_editor|admin`, `schema.prisma` `enum Role`), `onboarding_completed`, `community_kinds` (array of `regionalName`/`specialName`), `open_to_collaboration`. Never: email, name, bio, headline, city/country, phone, ORCID, `livedExperienceStatement`, `motivation`, `lookingFor`, `preferredLanguage` (locale is already an event property).
- **Groups.** Use one group type, `community`, keyed by `Community.id` with `$group_set: { name: regionalName ?? specialName, type }` (`schema.prisma:148-160`). Cardinality is tiny and the questions ("do Latin America members search differently?") are real. **Do not** create a `collaboration` group type now: workspaces are private (`visibility MEMBERS`, `schema.prisma:481`), the whole surface is behind `FEATURES.engagement` (hidden), and group counts feed billing. Revisit if the engagement release ships.
- **What never leaves the browser or server:** message/comment/thread text, file names of collaboration uploads, search query text (§6), lived-experience content, any `email` field (newsletter — §5), reviewer `reviewNotes`, IPs (see §8 on "Discard client IP data").

---

## 5. Server-side events (`posthog-node`)

`lib/analytics/server.ts`:
```ts
import 'server-only'
import { PostHog } from 'posthog-node'

let client: PostHog | null | undefined
export function posthogServer(): PostHog | null {
  if (client !== undefined) return client
  const key = process.env.POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return (client = null)                       // feature degrades to no-op
  return (client = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    flushAt: 1, flushInterval: 0,                        // serverless: send immediately, never rely on a timer
    disableGeoip: true,                                  // matches "no IP … for analytics" (lib/legal/content.ts:33)
  }))
}

type ServerEvent = { event: string; distinctId?: string | null; properties?: Record<string, unknown>;
                     set?: Record<string, unknown>; groups?: Record<string, string> }

/** Fire-and-forget capture. Anonymous when no distinctId: random id + no person profile. */
export function captureServer(e: ServerEvent): Promise<void> {
  const ph = posthogServer(); if (!ph) return Promise.resolve()
  const anonymous = !e.distinctId
  ph.capture({
    distinctId: e.distinctId ?? crypto.randomUUID(),
    event: e.event,
    properties: { ...e.properties, source: 'server', ...(anonymous ? { $process_person_profile: false } : {}), ...(e.set ? { $set: e.set } : {}) },
    groups: e.groups,
  })
  return ph.flush()   // caller decides whether to await, after(), or runAfterCommit it
}
```

**Flushing on Vercel.** Two seams already exist:
- In route handlers and server actions: `after(() => captureServer(...))` from `next/server`. It keeps the invocation alive after the response is sent and never adds latency to the user. Note the repo does not yet use `after()` directly anywhere except the dynamic import in `after-commit.ts:97` — this would be its first direct use; the helper's comment at `:14-19` already documents the semantics.
- In Payload hooks: `runAfterCommit(() => withTimeout(captureServer(...), 3_000, 'the analytics capture'))` — never `await` inside the hook body, because the hook runs inside the write transaction (`after-commit.ts:4-10`).
- Do **not** call `shutdown()` per request; the singleton is reused across warm invocations. `flushAt: 1` + awaited `flush()` inside `after()` is the whole story.

**Where each event fires**

| Event | Seam | Notes |
|---|---|---|
| `submission_submitted` | `app/api/case-studies/submit/route.ts` after the `submitCaseStudy` result at `:140-144` (also `events/submit`, `lived-experiences/submit`, `research-outputs/submit`) | `distinctId: userId` (`:16`), props `kind`, `is_resubmission: result.status…`, `has_image`. Title/body never. |
| `submission_moderated` | `payload/hooks/moderation.ts` — add `analytics?: (e) => Promise<void>` to `ModerationSideEffectDeps` (`:531-556`) and call it in `runModerationSideEffects` right after `result.transitioned` is known (`:640-646`), inside the existing `runAfterCommit` (`:791`) | props `kind: change.collection`, `from`, `to`, `action` (derive from `to`), `doc_id`. `distinctId`: the moderator (`req.user?.id`) — it is *their* action; put the submitter in `properties.submitter_id` only if `doc.submittedBy` is confirmed to be a Clerk id (it is what the notifier emails, `:678`, but I did not verify its shape). Reviewer `reviewNotes` never. |
| `report_downloaded` | `app/api/reports/download/track/route.ts` + `agendas/download/track/route.ts` after `trackReportDownload` (`:31`) | `auth()` is commented out at `:15`, so this is anonymous unless you re-enable it. Recommend: keep the Prisma count as source of truth, and **also** fire the client `track('report_downloaded')` from `lib/report-utils.ts:176`'s caller, where identity and consent are both known. Server capture stays anonymous (`$process_person_profile: false`). |
| `newsletter_subscribed` | `app/api/newsletter/route.ts:28-34` after `resend.contacts.create` succeeds | Route has no `auth()`; event is anonymous with `source: 'footer'`. The email address is **never** a property. |
| `rsvp_set` | `lib/actions/rsvp.ts:41-47` after `prisma.rsvp.upsert` | `distinctId: actor.id` (Clerk id via `getActor`, `lib/authz.ts:22-42`), props `event_id`, `status`, `previous_status`. Use `after()` — it is a server action. |
| `sign_up_completed` | `app/api/webhooks/clerk/route.ts` `handleUserCreated` after `prisma.user.create` (`:134`) | `distinctId: id`, `$set: { role: 'community_member', onboarding_completed: false }`. Webhooks skip the proxy (`proxy.ts:68-70`) — irrelevant for capture. |
| `onboarding_completed` | `app/api/onboarding/complete/route.ts` where `onboardingCompleted: true` is written (`:399-400`) and `/api/onboarding/waive` | `$set: { onboarding_completed: true, role, community_kinds }`, `groups: { community: <id> }` per membership. |
| `weekly_digest_sent` (optional) | `app/api/cron/weekly-digest/route.ts` | one anonymous event per run with `recipients` count; useful for correlating traffic spikes. |

Tests for the moderation change reuse the existing dependency-injection shape: `moderationAfterChange(collection, { analytics: fake })` (`moderation.ts:735-737` already takes `overrides`), then `await flushDeferred()` (`after-commit.ts:55`) and assert the fake was called with `{ from, to }` — same pattern as `lib/__tests__/payload-moderation-hook.test.ts`.

---

## 6. Event taxonomy

**Naming:** `object_verb`, snake_case, past tense, no prefixes (`$`-prefixed names are PostHog-reserved). Properties snake_case; ids are your own ids (Payload/Sanity doc id, Prisma cuid, Algolia objectID), never slugs-with-titles. Every event is declared once, in TypeScript, and `track()` refuses anything else:

`lib/analytics/events.ts`:
```ts
export type ContentKind = 'case_study' | 'lived_experience' | 'research_output' | 'event' | 'news' | 'agenda' | 'report' | 'page'

export type AnalyticsEvents = {
  // content engagement
  content_viewed:        { kind: ContentKind; content_id: string; backend: 'sanity' | 'payload' }   // only where $pageview is ambiguous (reader, atlas panels)
  reader_opened:         { kind: 'report' | 'agenda'; content_id: string; file_language: string }
  reader_progress:       { content_id: string; percent_bucket: 25 | 50 | 75 | 100 }
  report_downloaded:     { kind: 'report' | 'agenda'; content_id: string; file_language: string }
  external_link_clicked: { host: string; from_kind: ContentKind }                                     // host only, never full URL
  video_unlocked:        { provider: 'youtube' | 'vimeo' }                                             // functional-consent gate (youtube-consent-gate.tsx)
  // search & discovery
  search_performed:      { scope: 'all' | 'case_studies' | 'users' | 'news' | 'agendas'; query_length: number; results_count: number; zero_results: boolean; filters_count: number }
  search_result_clicked: { scope: string; position: number; object_id: string }
  atlas_filter_applied:  { facet: 'region' | 'type' | 'when' | 'topic'; values_count: number }
  // submissions
  submission_started:    { kind: 'case_study' | 'event' | 'lived_experience' | 'research_output' }
  submission_draft_saved:{ kind: 'case_study'; step: number }
  submission_submitted:  { kind: ContentKind; is_resubmission: boolean; has_image: boolean }           // server
  submission_moderated:  { kind: string; from: string | null; to: string; action: 'approve' | 'revision' | 'reject' } // server
  // community / collaboration
  community_joined:      { community_id: string; community_kind: 'regional' | 'special' }
  rsvp_set:              { event_id: string; status: 'GOING' | 'INTERESTED' | 'NOT_GOING'; previous_status: string | null } // server
  comment_posted:        { target_kind: ContentKind; anonymous: boolean; has_mentions: boolean; is_reply: boolean }         // no text
  reaction_added:        { target_kind: 'comment' | 'content'; reaction: string }
  collaboration_created: { visibility: 'MEMBERS' | 'PUBLIC' }                                          // behind FEATURES.engagement
  // onboarding funnel
  sign_up_completed:     Record<string, never>                                                         // server (Clerk webhook)
  onboarding_step_viewed:{ step_index: number; step_name: 'welcome' | 'basic_info' | 'work_info' | 'recent_work' | 'privacy' | 'review' } // panels in components/onboarding/panels/
  onboarding_completed:  { waived: boolean }                                                           // server
  newsletter_subscribed: { source: 'footer' | 'inline' }                                               // server, anonymous
}

const FORBIDDEN_KEYS = /^(email|name|first_name|last_name|username|phone|query|text|body|content|message|title|bio|notes|review_notes|url)$/i

export function track<E extends keyof AnalyticsEvents>(event: E, props: AnalyticsEvents[E]) {
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV !== 'production' && Object.keys(props).some(k => FORBIDDEN_KEYS.test(k))) {
    throw new Error(`analytics: forbidden property on ${event}`)   // dev-time tripwire; tests assert it
  }
  import('@/lib/analytics/client').then(({ getPostHog }) => getPostHog()?.capture(event, props))
}
```
Funnels this supports out of the box: sign-up → onboarding steps → completed → first `search_performed`/`community_joined`; `submission_started` → `submission_submitted` → `submission_moderated{to:'approved'}`; `search_performed{zero_results:true}` as a content-gap report per locale.

**Search query text is deliberately not sent.** The search box is a free-text field on a site whose members disclose mental-health context; `query_length` + `zero_results` + `scope` answers "is search working" without storing what people typed. If zero-result queries are needed for content planning, log them to Algolia's own analytics (search-only key + `analytics: true`) rather than to a person-linked event stream.

---

## 7. Feature flags — recommendation: keep `lib/features.ts` env flags

Do not move `NEXT_PUBLIC_FEATURE_ENGAGEMENT` onto PostHog flags. Reasons, all from the code:

1. It gates **server components that redirect** (`messages/page.tsx:21`, `collaborations/page.tsx:27`, `collaborate/events/page.tsx:26`). Evaluating a PostHog flag there means a `posthog-node` `getFeatureFlag()` round-trip per request (or local evaluation, which needs a personal API key and a polling background process — poor fit for Vercel functions) and a distinct id for anonymous visitors that the server does not have.
2. PostHog loads **only after analytics consent** (§2). A decliner would never receive a client flag, so any client-side flag gating would have to fall back to a default anyway — i.e. to exactly what the env flag is.
3. The flag is a **release switch**, not an experiment: `.env.example:130-134` "UI is HIDDEN … for the intermediate production release". Release switches want to be identical for every visitor and every render, which is what a build-time `NEXT_PUBLIC_*` gives. Bootstrapping to avoid flicker is solving a problem the env flag does not have.
4. 27 call sites; the migration would be a change-everything PR for no product question it answers.

Where PostHog flags **are** worth it later: client-only A/B tests on consented traffic (e.g. onboarding panel order, homepage hero copy). Pattern for then: read the `ph_<key>_posthog` cookie's `distinct_id` in the server component, call `posthog-node` `getAllFlags(distinctId)`, pass to `posthog.init({ bootstrap: { distinctID, featureFlags } })`. Keep `lib/features.ts` as the single import for release gating either way.

---

## 8. Relationship to Plausible; costs; legal pages

**Recommendation: keep both, with a clear division of labour.**
- **Plausible** = consent-free, cookieless traffic baseline (all visitors, incl. decliners and pre-choice). It is the only number that reflects total reach. Its script is already in the CSP (`next.config.mjs:36,40`) and gated correctly (`analytics-scripts.tsx`).
- **PostHog** = consented product analytics: funnels, retention, per-locale behaviour, server events. It will always report fewer visitors than Plausible; document that on the dashboard so nobody "fixes" it.

Replacing Plausible with PostHog would lose the pre-consent baseline (§2 recommendation) unless you adopt PostHog's cookieless mode, which as of my knowledge is a newer/beta option (hash-based ids, `cookieless_mode`) — I could not verify its current status from this repo, so treat it as a later evaluation, not a plan.

**Cost (from general knowledge, not verifiable here — confirm on posthog.com/pricing).** PostHog cloud bills per event with a free monthly allowance (order of 1M events); anonymous events are cheaper than identified ones, which is why `person_profiles: 'identified_only'` matters. With autocapture and recording off, this hub's volume should sit well inside the free tier. Plausible is a flat subscription already being paid.

**Legal/privacy-policy changes required before the first production event** (`lib/legal/content.ts`, all four locales):
- `:33` "aggregate download counts. We do not store IP addresses or device fingerprints for analytics." → still true only if you enable **Project settings → "Discard client IP data"** in PostHog and keep `disableGeoip: true` server-side; state both.
- `:37-40` "Analytics and tracking": add a second paragraph: with your consent, PostHog (EU, Frankfurt) records which pages and features you use, linked to your account id when signed in; no session recordings, no content of what you write; withdraw at any time via "Cookie preferences" (`components/footer.tsx:52`). Amend "We set only essential cookies" → "…and, if you accept analytics, PostHog's first-party analytics cookie".
- "Who processes your data" (the section after `:44`): add PostHog to the processor list.
- `UPDATED` constant at `:18` bumps.
- `messages/{en,es,fr,ar}.json` `cookieConsent.description` and `cookieConsent.categories.analytics.description` must stop saying "No consent needed here!" — that sentence becomes false the day PostHog ships behind that toggle.
- Also update the `/api/account/export` output if you promise "all your data": PostHog person data is not in it. Either say so in the policy or add a PostHog export step (the API supports person deletion; wire the GDPR-delete path in Phase 2 decisions to call `POST /api/projects/:id/persons/:id/delete` — out of scope here, but note it).

---

## 9. Env vars, tests, rollout

**Env** (`.env.example`, replacing the Plausible comment at `:136`):
```
# --- Product analytics (PostHog, EU cloud; loads only after analytics consent) ---
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
# Server-side events reuse the public key unless this is set.
POSTHOG_KEY=
# Set to 1 to load the SDK outside NEXT_PUBLIC_SITE_ENV=production (local verification).
NEXT_PUBLIC_POSTHOG_DEBUG=
# --- Plausible: cookieless traffic baseline, no key needed (components/cookie-consent/analytics-scripts.tsx) ---
```
`lib/env.ts:14-21`: add `"Product analytics (PostHog)": ["NEXT_PUBLIC_POSTHOG_KEY"]` so `instrumentation.ts:16-22` reports it as a disabled feature when absent. Add to Vercel prod + preview via `vercel env add` (prod only gets the key at rollout step 6).

**Tests** (all under `lib/__tests__/`, matching the repo's node-default vitest config):
- `analytics-consent.test.ts` — table test over the three consent states for `posthogAllowed` and `plausibleAllowed`; asserts Plausible's existing rule is unchanged and PostHog is false for `null` consent in **both** `hasConsented` states.
- `analytics-events.test.ts` — `track()` is a no-op without `window`; with a fake `getPostHog` (via `vi.mock('@/lib/analytics/client')`) it forwards name+props; the `FORBIDDEN_KEYS` tripwire throws on `email`, `query`, `text`; a type-level test (`expectTypeOf`) that an unknown event name does not compile.
- `analytics-server.test.ts` — `captureServer` with `vi.mock('posthog-node')`: no key ⇒ no client constructed; no `distinctId` ⇒ random id + `$process_person_profile:false`; `flush()` awaited; `disableGeoip:true` passed.
- `payload-moderation-analytics.test.ts` — extends the existing hook test pattern: `moderationAfterChange('caseStudies', { analytics: fake, notify, markNotified, revalidate })`, `await flushDeferred()`, assert one call with `{ from: 'pending', to: 'approved' }` and **zero** calls when `moderationStatus` is unchanged (Brake 1 at `moderation.ts:653-656`).
- `posthog-provider.test.tsx` with `// @vitest-environment jsdom` (first jsdom test in the repo; `jsdom` and `@testing-library/react` are already in devDeps) — mock `@clerk/nextjs` `useAuth`, `next-intl` `useLocale`, and `@/lib/analytics/client`; render inside a real `CookieConsentProvider`; assert: nothing loads before the mount effect resolves; `acceptAll()` ⇒ `loadPostHog` once; `rejectNonEssential()` ⇒ `unloadPostHog`; `userId` `null→'user_1'` ⇒ `identify('user_1')`; `'user_1'→null` ⇒ `reset()`.
- Config test: `next.config.mjs` exports rewrites containing `/ingest/:path*` → `eu.i.posthog.com`, and `proxy.ts` returns `NextResponse.next()` for `/ingest/e/` (import `proxy` with Clerk mocked — or, cheaper, assert the early-return string exists, as `payload-api-guard.test.ts` does for its matcher).

**Rollout (slice-by-slice with a rendered check after each, per your cadence)**
1. **Plumbing, dark.** Add packages, `proxy.ts` early return, `rewrites` + `skipTrailingSlashRedirect`, env entries, `lib/env.ts` row, the four `lib/analytics/*` files and unit tests. No key set anywhere ⇒ provider returns `null`. Gate: `pnpm tsc --noEmit`, `pnpm vitest run lib/__tests__/analytics-*.test.ts`, `curl -I /ingest/decide/` on a preview (expect no locale redirect).
2. **Consent gate + pageviews** on a preview with `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_DEBUG=1`. Rendered check in the browser network panel: zero `/ingest` requests before clicking the banner; requests after "Accept All"; **none** after switching analytics off in footer → Cookie preferences and reloading; `ph_*` storage gone. Check `/ar/…` shows `locale: ar, dir: rtl`.
3. **Identity.** Sign in/out; confirm `identify`/`reset` in PostHog's live events; confirm no `$set` contains email.
4. **Legal + i18n copy** (§8) — ships **before** any production key. The privacy policy date bump is the visible marker.
5. **Client events**: reader/download, search, onboarding steps, community join. One PR per group; each adds its `track()` call sites and nothing else.
6. **Server events**: moderation hook dep, newsletter, RSVP, onboarding complete, Clerk webhook. Verify with the existing live-check style script pattern (`scripts/payload-moderation-live-check.ts`) against the dev DB, and `flushDeferred()` in tests.
7. **Production key** via `vercel env add NEXT_PUBLIC_POSTHOG_KEY production`, manual `vercel --prod` (repo rule: prod deploys are manual). Build the three dashboards (traffic-vs-Plausible reconciliation, onboarding funnel, submission funnel) and pin the "PostHog < Plausible by design" note on the first.
8. Revisit in 30 days: event volume vs. free tier; whether any `zero_results` signal justifies Algolia analytics; whether a `/onboarding`-only recording flag is wanted.

**Files touched (summary)** — new: `lib/analytics/consent.ts`, `lib/analytics/client.ts`, `lib/analytics/events.ts`, `lib/analytics/server.ts`, `components/analytics/posthog-provider.tsx`, `components/analytics/posthog-pageview.tsx`, five tests under `lib/__tests__/`. Modified: `next.config.mjs`, `proxy.ts`, `app/[locale]/layout.tsx` (one line at `:174`), `components/cookie-consent/analytics-scripts.tsx` (`:19` → `plausibleAllowed`), `lib/env.ts`, `.env.example`, `lib/legal/content.ts`, `messages/{en,es,fr,ar}.json`, `payload/hooks/moderation.ts`, `app/api/newsletter/route.ts`, `lib/actions/rsvp.ts`, `app/api/reports/download/track/route.ts`, `app/api/agendas/download/track/route.ts`, `app/api/onboarding/complete/route.ts`, `app/api/onboarding/waive/route.ts`, `app/api/webhooks/clerk/route.ts`, `app/api/*/submit/route.ts` (4).

**Not verified / flagged as assumptions:** posthog-js bundle size, PostHog pricing tiers, the existence/state of PostHog cookieless mode, the exact shape of `doc.submittedBy` in moderated collections, and that `skipTrailingSlashRedirect` has no other consumer in this app (grep found no trailing-slash handling, but I did not exercise routes).