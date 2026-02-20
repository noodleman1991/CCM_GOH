# Comprehensive Code Review & Improvement Plan

**Date:** 2026-02-20
**Project:** Connecting Climate Minds Hub
**Scope:** Full-stack code review — security, performance, code quality, feature correctness, i18n, GDPR

---

## 1. Executive Summary

A comprehensive code review of the Connecting Climate Minds Hub revealed **10 critical security issues**, **42 high-priority findings**, and **numerous code quality gaps** across all feature areas. Several features are partially broken or behave differently from their intended design. This document captures the full improvement plan organized into 7 phases.

Key themes:
- **Security:** SQL/GROQ injection, exposed secrets in git history, unauthenticated endpoints, missing security headers
- **Privacy:** Field-level privacy settings not enforced in search/collaborate contexts; Clerk publicMetadata leaks profile data
- **Dead code:** 3 unused onboarding containers, 2 unused case study forms, unused R2 service, hundreds of lines of commented-out code
- **Duplication:** Transform functions, GROQ projections, Zod schemas, utility functions all duplicated 2-4x
- **Feature gaps:** No cookie consent, broken download tracking, broken newsletter endpoint, no content locale fallback chain
- **Performance:** N+1 queries, disabled CDN, index downtime on sync, client-side data waterfalls

---

## 2. Context & Requirements

### Deployment
- Vercel deployment
- Owner has access to rotate all service credentials (Clerk, Sanity, DB, Algolia, Resend)

### Active Components (confirmed via import tracing)
- **Onboarding:** `ModernOnboardingContainer` (imported in `app/[locale]/onboarding/onboarding-client.tsx`)
- **Case Study Form:** `case-study-form.tsx` via `case-study-submission-layout.tsx` (the 1165-line manual state version)
- **Dead code:** `onboarding-container.tsx`, `unified-onboarding-container.tsx`, `case-study-submission.tsx`, `enhanced-case-study-form.tsx`

### Feature Requirements (from owner)

| Feature | Expected Behavior |
|---|---|
| **Onboarding** | Prompted but optional. 6 steps. Progress saved mid-flow. Redirect dialog on login, then persistently on dashboard/collaborate. Dashboard announcement until completed. Full i18n + RTL. Content from Sanity + translation files (mix). |
| **Privacy** | Users set their own privacy settings. System MUST respect them everywhere — search, collaborate, profiles, API responses. |
| **Search** | Case studies, news, agendas searchable. User search to be re-enabled with proper privacy enforcement. Near real-time sync. |
| **Case Studies** | Submit → Admin requests revisions → User edits & resubmits → Admin approves. |
| **Collaborate** | Grid with filters works. Can improve UX but don't break delicate filter logic. |
| **Content Locale** | Show content in user's language first → English fallback → any available language. Serve all content regardless of language. |
| **Community Pages** | Single scrollable page. Should be more engaging. |
| **Download Tracking** | Actively used. Must work correctly. |
| **Newsletter** | Collects subscribers via Resend (no newsletter sending). |
| **Cookie Consent** | New feature needed. GDPR-compliant. YouTube embeds + Plausible + Clerk all set cookies. Full i18n + RTL + matches site design. |

---

## 3. Phase 1: Critical Security Fixes

**Priority:** Immediate. These are exploitable vulnerabilities.

### Task 1.1: Rotate All Compromised Secrets
- Rotate: Sanity tokens, DATABASE_URL credentials, Clerk `sk_live_` key, CLERK_WEBHOOK_SECRET, RESEND_API_KEY, ALGOLIA_API_KEY
- Purge `.env` from git history using BFG Repo-Cleaner
- Update all secrets in Vercel environment variables
- Verify app still works after rotation

### Task 1.2: Fix SQL Injection in Fuzzy Search
- **File:** `lib/services/user.service.ts:454-496`
- Replace string interpolation with parameterized `$queryRaw` using tagged template literals
- Replace `$queryRawUnsafe` with `$queryRaw`
- Test with special characters in search input

### Task 1.3: Fix GROQ Injection in Search Functions
- **Files:** `sanity/lib/fetch.ts:1345-1373`, `sanity/queries/grid/grid-case-study.ts:288-296`, `sanity/queries/news-queries.ts:116-200, 358-385`
- Replace all string interpolation with GROQ parameterized queries (`$param` syntax)
- Pass user values via `params` object to `client.fetch()` / `sanityFetch()`
- Audit all GROQ queries for interpolation patterns

### Task 1.4: Secure/Remove Debug Endpoint
- **File:** `app/api/debug/db-info/route.ts`
- Delete this endpoint entirely (DB info belongs in infrastructure monitoring, not an API)

### Task 1.5: Add Authentication to Webhook Endpoints
- **Files:** `app/api/search/users/webhook/route.ts`, `app/api/search/agendas/webhook/route.ts`, `app/api/search/case-studies/webhook/route.ts`
- Add shared secret verification (match the pattern in `app/api/search/news/webhook/route.ts` which uses `@sanity/webhook`)
- Alternative: convert these to direct function calls instead of HTTP endpoints (since they're called internally via `fetch()`)

### Task 1.6: Fix Algolia Admin Key Exposure
- **File:** `lib/algolia.ts:10`
- Remove `|| process.env.NEXT_PUBLIC_ALGOLIA_API_KEY` fallback
- Ensure `ALGOLIA_API_KEY` is server-only

### Task 1.7: Remove Sanity Browser Token Exposure
- **File:** `sanity/lib/live.ts:5-9`
- Remove `browserToken: token` or replace with a separate, limited viewer token
- Use Sanity anonymous/public read access for client-side queries

### Task 1.8: Add Security Headers
- **File:** `next.config.mjs`
- Add `headers()` function with: Content-Security-Policy, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Strict-Transport-Security, Permissions-Policy
- CSP must allow: Sanity CDN, YouTube embeds, Clerk, Algolia, Plausible

### Task 1.9: Fix Destructive Auto-Delete on Email Conflict
- **File:** `app/api/webhooks/clerk/route.ts:183-217`
- Replace `prisma.user.delete()` with soft-delete (add `deletedAt` field) or merge strategy
- Log conflict for admin review rather than auto-resolving

### Task 1.10: Wrap Onboarding DB Operations in Transaction
- **File:** `app/api/onboarding/complete/route.ts:329-389`
- Wrap user upsert + recent work delete/create + community delete/create in `prisma.$transaction()`

### Task 1.11: Add Runtime Env Var Check for Webhook Secret
- **File:** `app/api/webhooks/clerk/route.ts:385`
- Replace `process.env.CLERK_WEBHOOK_SECRET!` with explicit guard that returns 500 if undefined

---

## 4. Phase 2: Privacy & Auth Hardening

### Task 2.1: Enforce Field-Level Privacy in All User Queries
- **File:** `lib/services/user.service.ts`
- Create shared `redactUser(user, viewerId)` utility function
- Apply to: `searchUsers` (line 108), `getUsersForCollaborate` (line 555), `fuzzySearchUsers` (line 394), `getUsersByRegionalCommunity` (line 730)
- Redact: email, phone, location, work details, social links based on per-field privacy flags
- Always allow users to see their own unredacted data

### Task 2.2: Fix Own-Profile Detection
- **File:** `lib/services/user.service.ts:319`
- Change from `identifier === viewerId` to: fetch user first, then compare `user.id === viewerId`

### Task 2.3: Stop Syncing Profile Data to Clerk publicMetadata
- **Files:** `lib/clerk-sync.ts:29-56`, `app/api/profile/route.ts:239-283`
- Only store minimal data in `publicMetadata`: `onboardingCompleted`, `preferredLanguage`
- Remove all profile fields (bio, organization, work details, privacy flags) from publicMetadata sync
- Delete the dead inline `syncToClerk` in profile route

### Task 2.4: Add Email Validation + Rate Limiting to Newsletter
- **File:** `app/api/newsletter/route.ts`
- Add `await` to `resend.contacts.create()`
- Add Zod schema for email validation
- Add basic rate limiting (IP-based, using `@upstash/ratelimit` or simple in-memory)

### Task 2.5: Add Password/Re-auth Verification for Account Changes
- **File:** `app/api/account/route.ts:74-99`
- Require `currentPassword` for password change
- Require re-authentication (password or MFA) for account deletion

### Task 2.6: Secure Remaining Unauthenticated Endpoints
- `app/api/sync/user-management/route.ts` — add admin role check
- `app/api/agendas/download/track/route.ts` — restore auth or add rate limiting
- `app/api/reports/download/track/route.ts` — same
- `app/api/sync/clerk/route.ts` — add check that `targetUserId` matches the caller or caller is admin

### Task 2.7: Add File Upload Validation
- **File:** `app/api/case-studies/submit/route.ts:161-175`
- Validate file size (max 5MB)
- Validate Content-Type (image/jpeg, image/png, image/webp only)
- Sanitize filename

### Task 2.8: Fix Sanity Webhook to Require Verification
- **File:** `app/api/webhooks/sanity/route.ts:23-28`
- Change `return true` to `return false` when secret is not configured
- Log warning when SANITY_WEBHOOK_SECRET is missing

### Task 2.9: Add VideoModal Domain Allowlist
- **File:** `components/blocks/video-modal.tsx:67-93`
- Maintain allowlist of permitted embed domains (youtube.com, vimeo.com)
- Reject any URL not matching allowlist

### Task 2.10: Create .env.example + Env Validation
- Create `.env.example` documenting all 20+ env vars with descriptions
- Add `@t3-oss/env-nextjs` or Zod-based env validation at startup
- Mark each variable as required/optional, server/client

---

## 5. Phase 3: Dead Code Cleanup & Consolidation

### Task 3.1: Delete Unused Onboarding Containers
- Delete `components/onboarding/onboarding-container.tsx`
- Delete `components/onboarding/unified-onboarding-container.tsx`
- Delete `components/onboarding/steps/` directory (imports types from dead container)
- Keep `components/onboarding/panels/` (used by ModernOnboardingContainer)
- Move `OnboardingData` type to a shared types file if needed

### Task 3.2: Delete Unused Case Study Forms
- Delete `components/forms/case-study-submission.tsx`
- Delete `components/forms/enhanced-case-study-form.tsx`

### Task 3.3: Delete Dead R2 Service
- Delete `lib/cloudflare-r2.ts` (253 lines, zero imports)
- Consider removing `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` from dependencies if no other usage

### Task 3.4: Remove All Commented-Out Code
- `app/api/profile/route.ts:1-139` — 139 lines of dead code
- `app/api/analytics/download/route.ts:5-88` — entire POST handler
- `sanity/lib/fetch.ts:27-38, 90-99, 115-127, 1418-1457` — multiple blocks
- `sanity/structure.ts:116-129` — commented agenda structure
- `components/search/search-interface.tsx:84-193` — user search tab
- `lib/utils.ts:54-65` — commented formatDate
- `components/header/language-switcher.tsx` — entirely commented out, delete file

### Task 3.5: Delete Dead Files
- `components/latest-content-section.tsx` — 0-byte empty file
- `messages/*.json.backup` files — add `*.backup` to `.gitignore`

### Task 3.6: Consolidate Sanity Clients
- Merge `sanity/client.ts` and `sanity/lib/client.ts` into one module
- Export clearly named clients: `readClient` (with CDN), `writeClient` (with token), `previewClient`
- Update all imports

### Task 3.7: Consolidate Fetch Functions
- Remove duplicates from `sanity/lib/fetch.ts` where canonical versions exist in `sanity/queries/`
- Remove `fetchHomepageBySlug` / `fetchSanityHomepageBySlug` duplication
- Extract shared GROQ projection fragments (agenda, news, case study, lived experience) as template literals
- Reduce ~600 lines of duplicated projections to shared constants

### Task 3.8: Extract Shared Algolia Transform Functions
- Create `lib/search/transforms.ts`
- Move `transformAgendaForIndex`, `transformCaseStudyForIndex`, `transformNewsForIndex`, `transformUserForIndex` there
- Unify GROQ queries between sync and webhook routes to ensure consistent index records
- Delete duplicates from individual route files

### Task 3.9: Consolidate Zod Schemas
- Create single shared onboarding schema in `lib/schemas/onboarding-schema.ts`
- Server validates with same schema (can be slightly more permissive with `.optional()` where needed)
- Delete duplicate schemas from `lib/actions/onboarding.ts` and `app/api/onboarding/complete/route.ts`
- Fix `VALID_EXPERTISE_AREAS` to include all 5 enum values

### Task 3.10: Extract Shared Utility Functions
- Create `lib/user-display-utils.ts` with `generateDisplayName`, `generateFullName`, `generateInitials`
- Consolidate `isRTL` to single implementation in `i18n/i18n-helpers.ts` (using `rtlLocales` array)
- Consolidate `getLocalizedText` / `getLocalizedValue` to single canonical import
- Delete duplicates from `user.service.ts`, `use-user-profile.ts`, `page-client.tsx`, `case-study-utils.ts`, `types/prisma.ts`, `video-modal.tsx`

### Task 3.11: Remove Unused Dependencies
- `styled-components` — zero usage found, adds ~12KB gzipped
- Verify `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` have no other usage before removing

---

## 6. Phase 4: Fix Broken Features

### Task 4.1: Fix Download Tracking
- **File:** `app/api/analytics/download/route.ts`
- Uncomment and fix the POST handler, or rewrite it cleanly
- Add authentication (at minimum, track the authenticated user)
- Add rate limiting
- For the GET analytics endpoint: replace `findMany` + JS grouping with database-level `groupBy` or `$queryRaw` aggregation

### Task 4.2: Fix Newsletter Endpoint
- **File:** `app/api/newsletter/route.ts`
- Add `await` to `resend.contacts.create()`
- Add Zod email validation
- Return proper error on failure

### Task 4.3: Fix Profile Update Bug
- **File:** `app/api/user/me/route.ts:161-166`
- Change `req.name` to `req.firstName` and `req.lastName` respectively

### Task 4.4: Fix Case Study Studio Actions
- **File:** `sanity/actions/case-study-actions.ts`
- Replace static `client` import with `useClient()` from Sanity SDK for Studio context
- Or use `writeClient` with editor token for server-side mutations

### Task 4.5: Fix Onboarding Progress Saving
- Add localStorage persistence to `ModernOnboardingContainer`
- Save form state on each step change
- Restore saved state on component mount
- Clear saved state on successful completion

### Task 4.6: Fix Onboarding i18n Gaps
- **File:** `components/onboarding/modern-progress-sidebar.tsx:49-69`
- Replace hardcoded English step descriptions with `useTranslations()` calls
- Add corresponding keys to all 4 message files

### Task 4.7: Fix Content Locale Fallback Chain
- Implement in all Sanity fetch functions: User language → English → any available
- Pattern: `*[_type == "newsPost"] | order(language == $userLang desc, language == "en" desc, publishDate desc)`
- Apply to: news, case studies, agendas, lived experiences
- Ensure filters still work across languages

### Task 4.8: Fix 404 and Error Pages Locale Navigation
- `components/404.tsx:4` — change `import Link from "next/link"` to `import { Link } from "@/i18n/navigation"`
- `app/[locale]/(main)/error.tsx:33` — change `<a href="/">` to locale-aware `Link`
- `app/[locale]/(main)/not-found.tsx:5-7` — localize the metadata title using `getTranslations`

---

## 7. Phase 5: Performance Improvements

### Task 5.1: Fix N+1 Query in Fuzzy Search
- **File:** `lib/services/user.service.ts:511-535`
- Replace N individual `findUnique` calls with single `findMany({ where: { id: { in: userIds } } })`
- Maintain original sort order from fuzzy query results

### Task 5.2: Fix Dashboard Layout Blocking setTimeout
- **File:** `app/[locale]/(main)/dashboard/layout.tsx:36`
- Replace 3-second blocking `setTimeout` with polling/retry (200ms, 400ms, 800ms exponential backoff)
- Or ensure user exists before navigating to dashboard (fix at onboarding level)

### Task 5.3: Switch Algolia Sync to replaceAllObjects
- **Files:** All 4 sync routes
- Replace `clearObjects` + `saveObjects` with `replaceAllObjects` (atomic, zero-downtime)
- Wait for all batch tasks (not just first one)

### Task 5.4: Enable Sanity CDN for Read Client
- **File:** `sanity/env.ts:14`
- Set `useCdn: true` for the primary read client
- Only disable CDN for preview/draft contexts

### Task 5.5: Add Missing Database Indexes
- **File:** `prisma/schema.prisma`
- Add index on `User`: `lastLoginAt`, `profileVisibility`, `isSearchable`, `profileCompleteness`, `country`
- Add index on `RecentWork`: `userId`
- Add index on `Content`: `communityId`, `authorId`
- Add reverse index on `UserCommunity`: `communityId`

### Task 5.6: Fix Image Quality Settings
- Replace `quality={100}` with default (75) in all 7 instances:
  - `portable-text-renderer.tsx:53`
  - `ui/post-card.tsx:39`
  - `blocks/grid/grid-card.tsx:54`
  - `blocks/hero/hero-1.tsx:114`
  - `blocks/split/split-image.tsx:24`
  - `blocks/post-hero.tsx:28`
  - `blocks/carousel/carousel-1.tsx:111`

### Task 5.7: Fix CarouselDots/Counter Memory Leak
- **File:** `components/ui/carousel.tsx:250-317`
- Store the callback reference and pass it to `api?.off("select", callback)` in cleanup

### Task 5.8: Remove Custom Algolia Debounce Wrapper
- **File:** `lib/algolia.ts:84-116`
- Delete the custom debounced search client
- Use InstantSearch's built-in `searchAsYouType` or `queryHook` mechanisms

### Task 5.9: Optimize Community Page Fetching
- Consolidate sequential Sanity queries into single queries where possible
- Convert `content-flow.tsx` from client-side `useEffect` fetch to Server Component with `Suspense`
- Reduce ~600 lines of duplicated GROQ projections (covered in Phase 3)

### Task 5.10: Remove Wasted Query in getUsersByRegionalCommunity
- **File:** `lib/services/user.service.ts:730-794`
- Remove the initial eager query at line 737 (results are discarded)
- Only use the privacy-filtered query at line 764

---

## 8. Phase 6: Re-enable User Search with Privacy

### Task 6.1: Design Privacy-Safe User Search Index
- Define which fields are indexed in Algolia for user search:
  - Always indexed: first name, last name, organization (if `showWorkDetails: true`), expertise areas, community names
  - Never indexed: email, phone, social links, bio (too personal)
  - Conditionally indexed: location (if `showLocation: true`)
- Add `privacyVersion` timestamp to each record for cache invalidation

### Task 6.2: Implement Privacy-Respecting User Transform
- Update `transformUserForIndex` in `lib/search/transforms.ts`
- Only include fields the user has made public
- Add privacy flag fields to the index for Algolia-side filtering

### Task 6.3: Update User Sync to Respect Privacy
- When user updates privacy settings → trigger Algolia re-index for that user
- When `isSearchable: false` → remove user from index entirely

### Task 6.4: Uncomment and Fix User Search Tab
- **File:** `components/search/search-interface.tsx:84-193`
- Restore the user search tab
- Ensure search results only show public fields
- Link results to profile pages

---

## 9. Phase 7: New Features & Polish

### Task 7.1: GDPR Cookie Consent
- Audit all cookies: YouTube embeds, Plausible analytics, Clerk auth
- Build cookie consent banner component:
  - Full i18n (all 4 languages)
  - RTL support for Arabic
  - Match site design (CCM colors, fonts)
  - Categories: Necessary (Clerk auth), Analytics (Plausible), Media (YouTube)
  - Persist preference in localStorage + cookie
  - Block YouTube embeds until consent given (show placeholder with consent prompt)
  - Block Plausible until analytics consent given
  - Necessary cookies (Clerk) always allowed
- Add cookie policy page
- Add translation keys to all message files

### Task 7.2: Fix i18n Translation Gaps
- Fix duplicate `caseStudy` key in `en.json` (merge the two blocks)
- Fix Arabic file size mismatch (5MB → 2MB to match English)
- Translate `app.name` and `app.tagline` in es/fr/ar (use actual brand name)
- Localize date format strings per locale
- Add i18n to nav items in header/footer
- Localize `not-found.tsx` metadata
- Localize `openGraph.locale` in root layout per locale

### Task 7.3: Reduce Manual RTL Overrides
- Replace ~30 manual `flex-row-reverse` / `space-x-reverse` / `rotate-180` overrides in onboarding with CSS logical properties
- Use `gap-*` instead of `space-x-*` (Tailwind v4 handles RTL automatically with gap)
- Consolidate RTL/LTR button duplication in `modern-content-area.tsx`

### Task 7.4: Frontend Cleanup
- Move domain-specific cards out of `ui/` directory to `components/cards/`
- Fix inconsistent ref forwarding (standardize on React 19 ref-as-prop)
- Remove 63 console statements from components (or gate behind `NODE_ENV`)
- Fix `DesktopNav` missing `<nav>` landmark element
- Derive language switcher options from `routing.ts` instead of hardcoded array
- Fix `news-card.tsx` to use `next/image` instead of raw `<img>`

### Task 7.5: Content UX Improvements
- News/blog filters: prioritize tags by frequency, show "more" for overflow
- Community pages: make content sections more engaging (better visual hierarchy, loading states)
- Agenda search results: add proper detail page links instead of direct downloads

---

## 10. Dependency Graph

```
Phase 1 (Critical Security) ──┐
                               ├── Phase 2 (Security Hardening)
                               │
Phase 3 (Dead Code Cleanup) ───┤
                               ├── Phase 4 (Fix Broken Features)
                               │
                               ├── Phase 5 (Performance)
                               │
                               ├── Phase 6 (User Search)
                               │
                               └── Phase 7 (New Features & Polish)
```

- Phase 1 is a hard prerequisite for everything else (compromised secrets)
- Phases 2-7 can be worked on in parallel after Phase 1
- Phase 3 (cleanup) reduces cognitive load for all other phases
- Phase 6 (user search) depends on Phase 2 (privacy enforcement) being complete
- Phase 7 (cookie consent) is independent and can start anytime after Phase 1

---

## 11. Estimated Scope

| Phase | Tasks | Complexity |
|---|---|---|
| Phase 1: Critical Security | 11 tasks | High urgency, moderate complexity |
| Phase 2: Security Hardening | 10 tasks | Medium urgency, moderate complexity |
| Phase 3: Dead Code Cleanup | 11 tasks | Low risk, high impact on maintainability |
| Phase 4: Fix Broken Features | 8 tasks | Medium complexity, high user impact |
| Phase 5: Performance | 10 tasks | Variable complexity |
| Phase 6: User Search | 4 tasks | Medium complexity, requires careful privacy design |
| Phase 7: New Features & Polish | 5 tasks | Cookie consent is the largest new feature |
| **Total** | **59 tasks** | |

---

## 12. Notes

- **Collaborate page:** Filters work, logic is delicate. Improve UX but do not refactor the filter logic itself.
- **Onboarding content:** Mix of Sanity CMS (work types, expertise options) and translation files (UI labels). Preserve this pattern.
- **Content locale:** All content should be served regardless of language. Sort order: user's language → English → any.
- **Search sync:** Near real-time is acceptable (few minutes delay OK). Prefer webhook-based over polling.
- **Lived Experiences:** Not fully implemented. Make CMS-managed version work well for now.
- **`user/me` god endpoint:** Defer splitting into separate routes — it works, and splitting is a large refactor with high regression risk. Address in a future phase.
