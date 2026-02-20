# Phase 1: Critical Security Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all critical, exploitable security vulnerabilities in the Connecting Climate Minds Hub.

**Architecture:** Next.js 16.1 App Router with Clerk auth, Prisma/PostgreSQL, Sanity CMS, Algolia search. All changes are incremental security fixes — no architectural rewrites.

**Tech Stack:** Next.js 16.1, React 19, TypeScript 5.9, Prisma 6, Clerk, Sanity v3, Algolia (algoliasearch v5), Zod

---

### Task 1: Delete Debug Endpoint

**Files:**
- Delete: `app/api/debug/db-info/route.ts`

**Step 1: Delete the file**

Delete `app/api/debug/db-info/route.ts` entirely. This endpoint is unauthenticated and exposes database hostname, IP, port, user emails, and environment info to anyone who visits the URL.

**Step 2: Verify no imports reference it**

Run: `grep -r "debug/db-info" --include="*.ts" --include="*.tsx" .`
Expected: No matches (this endpoint is only accessed via URL, not imported).

**Step 3: Commit**

```bash
git rm app/api/debug/db-info/route.ts
git commit -m "fix(security): delete unauthenticated debug endpoint exposing DB info"
```

---

### Task 2: Fix SQL Injection in Fuzzy Search

**Files:**
- Modify: `lib/services/user.service.ts:440-506`

**Step 1: Understand the vulnerability**

The current code at lines 454-478 builds SQL with string interpolation for `allConditions`, `similarityThreshold`, `pageSize`, and `skip`. While `searchQuery` is passed as `$1` parameter, the filter conditions, pagination, and threshold are interpolated directly into the query string and executed via `$queryRawUnsafe`.

**Step 2: Replace with parameterized query using Prisma.$queryRaw**

Replace the fuzzy search method's query construction (lines 448-506) with:

```typescript
// Build privacy conditions as parameterized fragments
// Since Prisma.$queryRaw uses tagged template literals,
// we need to build the query differently.
//
// Strategy: Use Prisma.sql for composable query fragments
import { Prisma } from '@prisma/client'

// Privacy conditions (these are safe - no user input)
const privacyConditions: Prisma.Sql[] = [
  Prisma.sql`u."isSearchable" = true`
]
if (options.isAuthenticated) {
  privacyConditions.push(Prisma.sql`u."profileVisibility" IN ('PUBLIC', 'MEMBERS')`)
} else {
  privacyConditions.push(Prisma.sql`u."profileVisibility" = 'PUBLIC'`)
}

// Filter conditions (from validated enum values - safe, but parameterize anyway)
// ... existing filter building, but use Prisma.sql fragments

// Combine all conditions
const whereClause = Prisma.sql`${Prisma.join(allSqlConditions, ' AND ')}`

// Parameterize threshold, pageSize, skip
const users = await prisma.$queryRaw<(User & { similarity_score: number })[]>`
  SELECT
    u.*,
    GREATEST(
      COALESCE(similarity(u."firstName", ${searchQuery}), 0),
      COALESCE(similarity(u."lastName", ${searchQuery}), 0),
      COALESCE(similarity(u.username, ${searchQuery}), 0),
      COALESCE(similarity(u.bio, ${searchQuery}), 0),
      COALESCE(similarity(u.organization, ${searchQuery}), 0),
      COALESCE(similarity(u.position, ${searchQuery}), 0)
    ) as similarity_score
  FROM "User" u
  WHERE ${whereClause}
  HAVING GREATEST(
    COALESCE(similarity(u."firstName", ${searchQuery}), 0),
    COALESCE(similarity(u."lastName", ${searchQuery}), 0),
    COALESCE(similarity(u.username, ${searchQuery}), 0),
    COALESCE(similarity(u.bio, ${searchQuery}), 0),
    COALESCE(similarity(u.organization, ${searchQuery}), 0),
    COALESCE(similarity(u.position, ${searchQuery}), 0)
  ) >= ${similarityThreshold}
  ORDER BY similarity_score DESC, u."lastLoginAt" DESC NULLS LAST, u."profileCompleteness" DESC
  LIMIT ${pageSize}
  OFFSET ${skip}
`
```

Key changes:
- Replace `$queryRawUnsafe` with `$queryRaw` (tagged template)
- All user-controlled values (`searchQuery`) are auto-parameterized
- `similarityThreshold`, `pageSize`, `skip` are also parameterized (even though they're numbers, defense in depth)
- Filter conditions use `Prisma.sql` fragments instead of string interpolation

**Step 3: Apply the same fix to the count query (lines 481-505)**

Same pattern — replace `$queryRawUnsafe` with `$queryRaw` tagged template.

**Step 4: Test**

Run the app locally and test fuzzy search with:
- Normal search: `"climate"`
- SQL injection attempt: `"'; DROP TABLE \"User\"; --"`
- Special characters: `"O'Brien"`, `"José"`, `"名前"`

**Step 5: Commit**

```bash
git add lib/services/user.service.ts
git commit -m "fix(security): replace SQL injection-vulnerable queryRawUnsafe with parameterized queryRaw"
```

---

### Task 3: Fix GROQ Injection in Search Functions

**Files:**
- Modify: `sanity/lib/fetch.ts:1345-1373`
- Modify: `sanity/queries/grid/grid-case-study.ts:288-296`
- Modify: `sanity/queries/news-queries.ts:116-200, 358-385`

**Step 1: Fix case study search in fetch.ts**

Current code interpolates `searchTerm`, `language`, and `tags` directly into GROQ:

```typescript
// BEFORE (vulnerable):
filters.push(`language == "${language}"`)
filters.push(`title.en match "${searchTerm}*"`)
```

Replace with GROQ parameter syntax:

```typescript
// AFTER (safe):
// Build params object
const params: Record<string, any> = { limit }

if (language) {
  filters.push(`language == $language`)
  params.language = language
}

if (searchTerm) {
  filters.push(`(
    title.en match $searchPattern ||
    title.es match $searchPattern ||
    title.fr match $searchPattern ||
    title.ar match $searchPattern ||
    excerpt.en match $searchPattern ||
    excerpt.es match $searchPattern ||
    excerpt.fr match $searchPattern ||
    excerpt.ar match $searchPattern
  )`)
  params.searchPattern = `${searchTerm}*`
}

// For tags, use array containment
if (tags && tags.length > 0) {
  filters.push(`count((tags.en[]->value.current)[@ in $tags]) > 0`)
  params.tags = tags
}

const { data } = await sanityFetch({
  query: `*[${filters.join(' && ')}] | order(featured desc, publishedAt desc)[0...$limit]{ ... }`,
  params
})
```

**Step 2: Apply same pattern to grid-case-study.ts and news-queries.ts**

Search for all instances of string interpolation inside GROQ queries:

```bash
grep -n 'match ".*\${' sanity/queries/**/*.ts sanity/lib/fetch.ts
grep -n '== ".*\${' sanity/queries/**/*.ts sanity/lib/fetch.ts
```

Fix each one by moving user input to `params` object.

**Step 3: Test**

Test search with: `"test" || true`, `"test*" ] | order(_createdAt desc) { "secret": *[_type == "settings"]`, normal queries.

**Step 4: Commit**

```bash
git add sanity/lib/fetch.ts sanity/queries/
git commit -m "fix(security): replace GROQ string interpolation with parameterized queries"
```

---

### Task 4: Fix Algolia Admin Key Exposure

**Files:**
- Modify: `lib/algolia.ts:10`

**Step 1: Remove the dangerous fallback**

```typescript
// BEFORE:
const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY || process.env.NEXT_PUBLIC_ALGOLIA_API_KEY

// AFTER:
const ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY
```

The `NEXT_PUBLIC_` prefix makes variables available to the browser bundle. The admin API key must NEVER be in a `NEXT_PUBLIC_` variable. If `ALGOLIA_API_KEY` is not set, the admin client correctly falls back to `null` (lines 32-35).

**Step 2: Verify NEXT_PUBLIC_ALGOLIA_API_KEY is not the admin key**

Check Vercel env vars. If `NEXT_PUBLIC_ALGOLIA_API_KEY` contains the admin key, remove it and replace with the search-only key. The search-only key should be in `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY`.

**Step 3: Commit**

```bash
git add lib/algolia.ts
git commit -m "fix(security): remove admin API key fallback to NEXT_PUBLIC env var"
```

---

### Task 5: Remove Sanity Browser Token Exposure

**Files:**
- Modify: `sanity/lib/live.ts`

**Step 1: Remove browserToken**

```typescript
// BEFORE:
export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
  browserToken: token,
});

// AFTER:
export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
  // browserToken intentionally omitted — client-side uses public dataset access
});
```

The `token` is a server-side secret with write permissions. Sending it to the browser exposes it in the JS bundle.

**Step 2: Verify client-side queries still work**

The Sanity dataset should be configured with public read access. Test that pages still load content without the browser token.

**Step 3: Commit**

```bash
git add sanity/lib/live.ts
git commit -m "fix(security): remove server token from browser bundle in Sanity live config"
```

---

### Task 6: Add Authentication to Search Webhook Endpoints

**Files:**
- Modify: `app/api/search/users/webhook/route.ts`
- Modify: `app/api/search/agendas/webhook/route.ts`
- Modify: `app/api/search/case-studies/webhook/route.ts`
- Modify: `app/api/webhooks/clerk/route.ts` (update callers)

**Step 1: Add shared secret verification**

These endpoints are called internally (from Clerk webhook handlers and sync scripts) but are publicly accessible. Add a shared secret to each:

```typescript
// At the top of each webhook route:
const SEARCH_WEBHOOK_SECRET = process.env.SEARCH_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  // Verify internal webhook secret
  const authHeader = request.headers.get('authorization')
  if (!SEARCH_WEBHOOK_SECRET || authHeader !== `Bearer ${SEARCH_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ... rest of handler
}
```

**Step 2: Update all callers to include the secret**

In `app/api/webhooks/clerk/route.ts` (lines 289, 325), update the internal fetch calls:

```typescript
fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/search/users/webhook`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.SEARCH_WEBHOOK_SECRET}`
  },
  body: JSON.stringify({ userId: user.id, action: 'update' })
})
```

**Step 3: Add SEARCH_WEBHOOK_SECRET to Vercel env vars**

Generate a random secret: `openssl rand -hex 32`

**Step 4: Commit**

```bash
git add app/api/search/ app/api/webhooks/clerk/route.ts
git commit -m "fix(security): add shared secret auth to internal search webhook endpoints"
```

---

### Task 7: Add Security Headers

**Files:**
- Modify: `next.config.mjs`

**Step 1: Add headers function**

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.clerk.com https://challenges.cloudflare.com https://*.algolianet.com https://plausible.io",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://cdn.sanity.io https://img.youtube.com https://img.clerk.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://*.algolia.net https://*.algolianet.com https://plausible.io https://cdn.sanity.io",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com https://*.clerk.com",
              "media-src 'self' https://cdn.sanity.io",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com"
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    qualities: [75, 85, 90, 100],
  },
}
```

**Step 2: Test locally**

Start the dev server and check response headers with browser DevTools Network tab. Verify:
- YouTube embeds still load (frame-src)
- Clerk auth still works (script-src, connect-src)
- Sanity images still load (img-src)
- Algolia search still works (connect-src)

**Step 3: Commit**

```bash
git add next.config.mjs
git commit -m "fix(security): add CSP, HSTS, X-Frame-Options, and other security headers"
```

---

### Task 8: Fix Destructive Auto-Delete on Email Conflict

**Files:**
- Modify: `app/api/webhooks/clerk/route.ts:177-217`

**Step 1: Replace delete with conflict logging**

```typescript
// BEFORE (line 188):
await prisma.user.delete({ where: { id: existingUserByEmail.id } })
// ... then creates new user

// AFTER:
// Log conflict for manual resolution instead of auto-deleting user data
console.error(`🚨 EMAIL CONFLICT: New Clerk user ${id} has email ${emailAddress} which belongs to existing user ${existingUserByEmail.id}`)
console.error(`   Action required: Manually resolve this conflict in the admin panel`)
console.error(`   Old user ID: ${existingUserByEmail.id}, New Clerk ID: ${id}`)

// Return conflict status — do not delete the existing user's data
// (community memberships, recent work, download history would be lost)
return {
  action: 'conflict_detected',
  reason: 'email_conflict',
  existingUserId: existingUserByEmail.id,
  newClerkId: id,
  email: emailAddress
}
```

This prevents auto-deletion of user data (community memberships, recent work, download history) when someone re-registers with the same email.

**Step 2: Commit**

```bash
git add app/api/webhooks/clerk/route.ts
git commit -m "fix(security): replace destructive auto-delete on email conflict with conflict logging"
```

---

### Task 9: Wrap Onboarding in Transaction

**Files:**
- Modify: `app/api/onboarding/complete/route.ts:328-389`

**Step 1: Wrap DB operations in Prisma transaction**

Currently the onboarding completion does: user upsert → deleteMany+createMany recent work → deleteMany+createMany communities as separate queries. If any fails mid-way, data is left in an inconsistent state.

```typescript
// Wrap all DB operations in a transaction
await prisma.$transaction(async (tx) => {
  // User upsert (use tx instead of prisma)
  const user = await tx.user.upsert({
    where: { id: userId },
    // ... existing upsert data (unchanged)
  })

  // Create recent work entries
  if (validatedData.recentWork && validatedData.recentWork.length > 0) {
    await tx.recentWork.deleteMany({ where: { userId } })
    await tx.recentWork.createMany({
      data: validatedData.recentWork.map((work) => ({
        userId,
        title: work.title,
        description: work.description,
        link: work.link || null,
        isOngoing: work.isOngoing,
        startDate: new Date(work.startDate),
        endDate: work.endDate ? new Date(work.endDate) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    })
  }

  // Handle community memberships
  if (validatedData.communityIds && validatedData.communityIds.length > 0) {
    await tx.userCommunity.deleteMany({ where: { userId } })

    const communities = await tx.community.findMany({
      where: { id: { in: validatedData.communityIds } },
      select: { id: true, name: true, type: true }
    })

    if (communities.length > 0) {
      await tx.userCommunity.createMany({
        data: communities.map(community => ({
          userId,
          communityId: community.id,
          role: 'community_member' as const
        }))
      })
    }
  }
})

// Clerk metadata sync happens OUTSIDE the transaction (external API call)
const clerkUpdateData = {
  publicMetadata: {
    onboardingCompleted: true,
    preferredLanguage: validatedData.preferredLanguage || 'EN'
  }
}
```

**Step 2: Test onboarding flow end-to-end**

Complete the onboarding flow and verify all data is saved correctly.

**Step 3: Commit**

```bash
git add app/api/onboarding/complete/route.ts
git commit -m "fix(data): wrap onboarding DB operations in Prisma transaction for atomicity"
```

---

### Task 10: Add Runtime Env Var Check for Webhook Secret

**Files:**
- Modify: `app/api/webhooks/clerk/route.ts:385`

**Step 1: Add guard**

```typescript
// BEFORE:
const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

// AFTER:
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
if (!webhookSecret) {
  console.error('CLERK_WEBHOOK_SECRET is not configured')
  return NextResponse.json(
    { error: 'Webhook secret not configured' },
    { status: 500 }
  )
}
const wh = new Webhook(webhookSecret)
```

**Step 2: Commit**

```bash
git add app/api/webhooks/clerk/route.ts
git commit -m "fix(security): add runtime check for CLERK_WEBHOOK_SECRET instead of non-null assertion"
```

---

### Task 11: Fix Sanity Webhook Verification Bypass

**Files:**
- Modify: `app/api/webhooks/sanity/route.ts:23-28`

**Step 1: Change default to reject unverified**

```typescript
// BEFORE:
async function verifySignature(payload: string, signature: string | null) {
  const webhookSecret = process.env.SANITY_WEBHOOK_SECRET
  if (!webhookSecret || !signature) {
    return true // Skip verification if not configured
  }

// AFTER:
async function verifySignature(payload: string, signature: string | null) {
  const webhookSecret = process.env.SANITY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn('SANITY_WEBHOOK_SECRET not configured — rejecting webhook')
    return false
  }
  if (!signature) {
    console.warn('Sanity webhook received without signature header')
    return false
  }
```

**Step 2: Ensure SANITY_WEBHOOK_SECRET is set in Vercel**

Configure the secret in Sanity dashboard → API → Webhooks, and add the same value to Vercel env vars.

**Step 3: Commit**

```bash
git add app/api/webhooks/sanity/route.ts
git commit -m "fix(security): reject Sanity webhooks when secret is not configured"
```

---

## Manual Step (Owner): Rotate All Compromised Secrets

This cannot be automated and must be done by the project owner:

1. **Rotate all secrets** in their respective dashboards:
   - Clerk: `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
   - Sanity: API tokens, `SANITY_WEBHOOK_SECRET`
   - Neon/PostgreSQL: `DATABASE_URL` credentials
   - Algolia: `ALGOLIA_API_KEY`
   - Resend: `RESEND_API_KEY`

2. **Update Vercel environment variables** with new values

3. **Purge `.env` from git history** using BFG Repo-Cleaner:
   ```bash
   # From a fresh clone:
   java -jar bfg.jar --delete-files .env
   java -jar bfg.jar --delete-files .env.local
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push --force
   ```

4. **Add new env var**: `SEARCH_WEBHOOK_SECRET` (generated with `openssl rand -hex 32`)

5. **Verify the app works** after rotation

---

## Execution Order

Tasks 1-5 can be executed in parallel (independent files).
Task 6 touches the Clerk webhook route, so do Task 8, 10 together after Task 6.
Task 7 is independent.
Task 9 is independent.
Task 11 is independent.

Suggested order: 1 → 4 → 5 → 11 → 2 → 3 → 6 → 7 → 8+10 → 9 → Manual secret rotation
