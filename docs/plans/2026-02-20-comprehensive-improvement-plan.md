# Comprehensive Code Review & Improvement — Implementation Plan


**Goal:** Fix all security vulnerabilities, enforce privacy, remove dead code, fix broken features, improve performance, re-enable user search, and add GDPR cookie consent across the Connecting Climate Minds Hub.

**Architecture:** Next.js 16.1 App Router with Clerk auth, Prisma/PostgreSQL, Sanity CMS, Algolia search, next-intl i18n (en/es/fr/ar). All changes are incremental fixes to the existing codebase — no architectural rewrites.

**Tech Stack:** Next.js 16.1, React 19, TypeScript 5.9, Prisma 6, Clerk, Sanity v3, Algolia (algoliasearch v5), next-intl, Tailwind CSS 4, Resend, Zod

---

## Phase 1: Critical Security Fixes

### Task 1.1: Delete Debug Endpoint

**Files:**
- Delete: `app/api/debug/db-info/route.ts`

**Step 1: Delete the file**

Delete `app/api/debug/db-info/route.ts` entirely. This endpoint is unauthenticated and exposes database hostname, IP, port, user emails, and environment info.

**Step 2: Verify no imports reference it**

Run: `grep -r "debug/db-info" --include="*.ts" --include="*.tsx" .`
Expected: No matches (this endpoint is only accessed via URL, not imported).

**Step 3: Commit**

```bash
git add -A app/api/debug/
git commit -m "fix(security): delete unauthenticated debug endpoint exposing DB info"
```

---

### Task 1.2: Fix SQL Injection in Fuzzy Search

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

### Task 1.3: Fix GROQ Injection in Search Functions

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

### Task 1.4: Fix Algolia Admin Key Exposure

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

### Task 1.5: Remove Sanity Browser Token Exposure

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

### Task 1.6: Add Authentication to Search Webhook Endpoints

**Files:**
- Modify: `app/api/search/users/webhook/route.ts`
- Modify: `app/api/search/agendas/webhook/route.ts`
- Modify: `app/api/search/case-studies/webhook/route.ts`

**Step 1: Add shared secret verification**

These endpoints are called internally (from Clerk webhook handlers and sync scripts) but are publicly accessible. Add a shared secret:

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

### Task 1.7: Add Security Headers

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
    // ... existing redirects
  },
  images: {
    // ... existing image config
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

### Task 1.8: Fix Destructive Auto-Delete on Email Conflict

**Files:**
- Modify: `app/api/webhooks/clerk/route.ts:177-217`

**Step 1: Replace delete with logging**

```typescript
// BEFORE (line 188):
await prisma.user.delete({ where: { id: existingUserByEmail.id } })

// AFTER:
// Log conflict for manual resolution instead of auto-deleting
console.error(`🚨 EMAIL CONFLICT: New Clerk user ${id} has email ${emailAddress} which belongs to existing user ${existingUserByEmail.id}`)
console.error(`   Action required: Manually resolve this conflict in the admin panel`)
console.error(`   Old user ID: ${existingUserByEmail.id}, New Clerk ID: ${id}`)

// Create the new user with a modified email to prevent data loss
// Admin must manually merge/resolve
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
git commit -m "fix(security): replace destructive auto-delete on email conflict with logging"
```

---

### Task 1.9: Wrap Onboarding in Transaction

**Files:**
- Modify: `app/api/onboarding/complete/route.ts:328-389`

**Step 1: Wrap DB operations in Prisma transaction**

```typescript
// Wrap all DB operations in a transaction
await prisma.$transaction(async (tx) => {
  // User upsert (use tx instead of prisma)
  const user = await tx.user.upsert({
    where: { id: userId },
    // ... existing upsert data
  })

  // Create recent work entries
  if (validatedData.recentWork && validatedData.recentWork.length > 0) {
    await tx.recentWork.deleteMany({ where: { userId } })
    await tx.recentWork.createMany({
      data: validatedData.recentWork.map((work) => ({
        // ... existing mapping
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

// Clerk metadata sync happens OUTSIDE the transaction (it's an external API)
const clerkUpdateData = { /* ... */ }
```

**Step 2: Test onboarding flow end-to-end**

Complete the onboarding flow and verify all data is saved correctly. Then test with a simulated failure (e.g., invalid community ID) to verify rollback.

**Step 3: Commit**

```bash
git add app/api/onboarding/complete/route.ts
git commit -m "fix(data): wrap onboarding DB operations in Prisma transaction for atomicity"
```

---

### Task 1.10: Add Runtime Env Var Check for Webhook Secret

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

### Task 1.11: Fix Sanity Webhook Verification Bypass

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

## Phase 2: Privacy & Auth Hardening

### Task 2.1: Create Shared User Redaction Utility

**Files:**
- Create: `lib/services/user-redaction.ts`
- Modify: `lib/services/user.service.ts`

**Step 1: Create the redaction utility**

```typescript
// lib/services/user-redaction.ts
import { User } from '@prisma/client'

/**
 * Redacts user fields based on their privacy settings.
 * Always returns unredacted data for the user viewing their own profile.
 */
export function redactUser<T extends Partial<User>>(
  user: T,
  viewerId: string | null
): T {
  // Own profile — no redaction
  if (viewerId && user.id === viewerId) return user

  const redacted = { ...user }

  // Email redaction
  if (!user.showEmail) {
    redacted.email = null as any
  }

  // Phone redaction
  if (!user.showPhoneNumber) {
    redacted.phoneNumber = null as any
  }

  // Location redaction
  if (!user.showLocation) {
    redacted.city = null as any
    redacted.country = null as any
  }

  // Work details redaction
  if (!user.showWorkDetails) {
    redacted.organization = null as any
    redacted.position = null as any
    redacted.workBio = null as any
    redacted.workTypes = [] as any
    redacted.expertiseAreas = [] as any
  }

  // Social links redaction
  if (!user.showSocialLinks) {
    redacted.linkedinProfile = null as any
    redacted.personalWebsite = null as any
    redacted.otherSocialLinks = null as any
  }

  return redacted
}
```

**Step 2: Apply redaction in user.service.ts**

Import and apply `redactUser` in:
- `searchUsers` (line ~108)
- `getUsersForCollaborate` (line ~555)
- `fuzzySearchUsers` (line ~394) — after fetching full user data
- `getUsersByRegionalCommunity` (line ~730)

Example for `getUsersForCollaborate`:
```typescript
const users = await prisma.user.findMany({ ... })
return users.map(user => redactUser(user, viewerId))
```

**Step 3: Test**

Verify that when viewing another user's profile with `showEmail: false`, the email is null in the API response.

**Step 4: Commit**

```bash
git add lib/services/user-redaction.ts lib/services/user.service.ts
git commit -m "feat(privacy): add shared user redaction utility and enforce in all user queries"
```

---

### Task 2.2: Fix Own-Profile Detection

**Files:**
- Modify: `lib/services/user.service.ts:318`

**Step 1: Fix the comparison**

```typescript
// BEFORE (line 318):
const isOwnProfile = identifier === viewerId

// AFTER:
// identifier can be a username or userId — viewerId is always a userId
// We need to check both possibilities
const isOwnProfile = viewerId !== null && (
  identifier === viewerId ||  // identifier is the userId
  false  // will check after fetch if identifier is a username
)
```

Better approach — check after fetch:

```typescript
// Remove the early isOwnProfile check (line 318)
// After fetching the user (line 342), add:
const user = await prisma.user.findFirst({ where, include: { ... } })
if (!user) return null

const isOwnProfile = viewerId !== null && user.id === viewerId

// Then apply privacy redaction only if NOT own profile:
if (isOwnProfile) {
  return this.transformToLocalizedUser(user, localizedQuery)
} else {
  const redacted = redactUser(user, viewerId)
  return this.transformToLocalizedUser(redacted, localizedQuery)
}
```

**Step 2: Commit**

```bash
git add lib/services/user.service.ts
git commit -m "fix(privacy): fix own-profile detection to compare user.id instead of username vs userId"
```

---

### Task 2.3: Stop Syncing Profile Data to Clerk publicMetadata

**Files:**
- Modify: `lib/clerk-sync.ts`
- Modify: `app/api/profile/route.ts`

**Step 1: Slim down clerk-sync.ts**

Only sync minimal metadata to Clerk:

```typescript
// In clerk-sync.ts, the syncToClerk function should only send:
publicMetadata: {
  onboardingCompleted: user.onboardingCompleted,
  preferredLanguage: user.preferredLanguage,
}
// Remove: bio, organization, position, workTypes, expertiseAreas, privacy flags, etc.
```

**Step 2: Remove dead inline syncToClerk in profile route**

In `app/api/profile/route.ts`, find the duplicate/dead `syncToClerk` function and delete it.

**Step 3: Commit**

```bash
git add lib/clerk-sync.ts app/api/profile/route.ts
git commit -m "fix(privacy): only sync onboarding status and language to Clerk publicMetadata"
```

---

### Task 2.4: Fix Newsletter Endpoint

**Files:**
- Modify: `app/api/newsletter/route.ts`

**Step 1: Add await and validation**

```typescript
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { email } = subscribeSchema.parse(body);

    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (!audienceId) {
      console.error("RESEND_AUDIENCE_ID not configured");
      return Response.json(
        { error: "Newsletter service not configured" },
        { status: 500 }
      );
    }

    await resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId,
    });

    return Response.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }
    console.error("Newsletter subscription error:", error);
    return Response.json(
      { error: "Error subscribing to updates" },
      { status: 500 }
    );
  }
};
```

**Step 2: Commit**

```bash
git add app/api/newsletter/route.ts
git commit -m "fix(newsletter): add await to Resend call, add Zod email validation, add env check"
```

---

### Task 2.5: Add Password Verification for Account Changes

**Files:**
- Modify: `app/api/account/route.ts:74-99`

**Step 1: Require currentPassword for password change**

```typescript
case "change_password":
  if (!newPassword) {
    return NextResponse.json(
      { error: "New password is required" },
      { status: 400 }
    )
  }
  if (!currentPassword) {
    return NextResponse.json(
      { error: "Current password is required to change password" },
      { status: 400 }
    )
  }

  // Verify current password first
  try {
    await clerkClientInstance.users.verifyPassword({
      userId,
      password: currentPassword,
    })
  } catch {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 403 }
    )
  }

  await clerkClientInstance.users.updateUser(userId, {
    password: newPassword
  })
  // ...
```

**Step 2: Commit**

```bash
git add app/api/account/route.ts
git commit -m "fix(security): require current password verification before password change"
```

---

### Task 2.6: Add VideoModal Domain Allowlist

**Files:**
- Modify: `components/blocks/video-modal.tsx`

**Step 1: Add URL validation**

```typescript
const ALLOWED_EMBED_DOMAINS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'vimeo.com',
]

function isAllowedEmbedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_EMBED_DOMAINS.includes(parsed.hostname)
  } catch {
    return false
  }
}

// In the component, before rendering the iframe:
if (!isAllowedEmbedUrl(videoUrl)) {
  console.warn(`Blocked embed from untrusted domain: ${videoUrl}`)
  return null
}
```

**Step 2: Commit**

```bash
git add components/blocks/video-modal.tsx
git commit -m "fix(security): add domain allowlist for video embed URLs"
```

---

### Task 2.7: Add File Upload Validation

**Files:**
- Modify: `app/api/case-studies/submit/route.ts`

**Step 1: Add validation constants and checks**

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// In the file handling section:
if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json(
    { error: `File too large. Maximum size is 5MB.` },
    { status: 400 }
  )
}

if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
  return NextResponse.json(
    { error: `Invalid file type. Allowed: JPEG, PNG, WebP` },
    { status: 400 }
  )
}

// Sanitize filename
const sanitizedFilename = file.name
  .replace(/[^a-zA-Z0-9._-]/g, '_')
  .substring(0, 255)
```

**Step 2: Commit**

```bash
git add app/api/case-studies/submit/route.ts
git commit -m "fix(security): add file size, type, and filename validation for case study uploads"
```

---

## Phase 3: Dead Code Cleanup & Consolidation

### Task 3.1: Delete Unused Onboarding Containers

**Files:**
- Delete: `components/onboarding/onboarding-container.tsx`
- Delete: `components/onboarding/unified-onboarding-container.tsx`

**Step 1: Verify they are not imported**

```bash
grep -r "onboarding-container" --include="*.ts" --include="*.tsx" app/ components/ lib/
grep -r "unified-onboarding-container" --include="*.ts" --include="*.tsx" app/ components/ lib/
```

Expected: Only import is in the files themselves (self-references or from each other). The active onboarding uses `ModernOnboardingContainer`.

**Step 2: Check if `components/onboarding/steps/` is used by the active container**

```bash
grep -r "onboarding/steps" --include="*.ts" --include="*.tsx" components/onboarding/modern-
```

If no results, delete the `steps/` directory too.

**Step 3: Delete files and commit**

```bash
git rm components/onboarding/onboarding-container.tsx
git rm components/onboarding/unified-onboarding-container.tsx
# If steps/ is dead:
git rm -r components/onboarding/steps/
git commit -m "chore: delete 2 unused onboarding containers and dead step components"
```

---

### Task 3.2: Delete Unused Case Study Forms

**Files:**
- Delete: `components/forms/case-study-submission.tsx`
- Delete: `components/forms/enhanced-case-study-form.tsx`

**Step 1: Verify no imports**

```bash
grep -r "case-study-submission" --include="*.ts" --include="*.tsx" app/ components/ lib/
grep -r "enhanced-case-study-form" --include="*.ts" --include="*.tsx" app/ components/ lib/
```

**Step 2: Delete and commit**

```bash
git rm components/forms/case-study-submission.tsx
git rm components/forms/enhanced-case-study-form.tsx
git commit -m "chore: delete 2 unused case study form components"
```

---

### Task 3.3: Delete Dead R2 Service

**Files:**
- Delete: `lib/cloudflare-r2.ts`

**Step 1: Verify no imports**

```bash
grep -r "cloudflare-r2" --include="*.ts" --include="*.tsx" .
grep -r "@aws-sdk/client-s3" --include="*.ts" --include="*.tsx" .
grep -r "@aws-sdk/s3-request-presigner" --include="*.ts" --include="*.tsx" .
```

**Step 2: Delete file, optionally remove dependencies**

```bash
git rm lib/cloudflare-r2.ts
# If no other usage of S3 SDK:
npm uninstall @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
git commit -m "chore: delete unused Cloudflare R2 service and S3 SDK dependencies"
```

---

### Task 3.4: Remove All Commented-Out Code

**Files:**
- Modify: `app/api/profile/route.ts` — remove lines 1-139 dead code
- Modify: `app/api/analytics/download/route.ts` — remove lines 5-88 commented POST handler
- Modify: `sanity/lib/fetch.ts` — remove commented blocks at lines 27-38, 90-99, 115-127, 1418-1457
- Modify: `sanity/structure.ts` — remove lines 116-129
- Modify: `components/search/search-interface.tsx` — remove lines 84-193 (will be restored properly in Phase 6)
- Modify: `lib/utils.ts` — remove lines 54-65
- Delete: `components/header/language-switcher.tsx` (entirely commented out)
- Delete: `components/latest-content-section.tsx` (0-byte empty file)

**Step 1: Remove commented code from each file**

Read each file, identify the commented blocks, and remove them cleanly. Leave meaningful `// TODO` comments where behavior needs to be restored (like the download tracking POST handler).

**Step 2: Delete empty/dead files**

```bash
git rm components/header/language-switcher.tsx
git rm components/latest-content-section.tsx
```

**Step 3: Add *.backup to .gitignore**

```
# In .gitignore, add:
*.backup
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove all commented-out code blocks, dead files, and backup files"
```

---

### Task 3.5: Remove Unused Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Verify styled-components is unused**

```bash
grep -r "styled-components" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" app/ components/ lib/
grep -r "styled\." --include="*.ts" --include="*.tsx" app/ components/ lib/
```

**Step 2: Remove if confirmed unused**

```bash
npm uninstall styled-components
git add package.json package-lock.json
git commit -m "chore: remove unused styled-components dependency"
```

---

### Task 3.6: Consolidate Sanity Clients

**Files:**
- Modify: `sanity/lib/client.ts` (keep this as canonical)
- Delete: `sanity/client.ts` (if it's a duplicate)

**Step 1: Identify all Sanity client files**

```bash
find . -name "client.ts" -path "*/sanity/*"
grep -r "createClient" --include="*.ts" sanity/
```

**Step 2: Merge into single canonical file with named exports**

```typescript
// sanity/lib/client.ts
export const readClient = createClient({
  // ... with useCdn: true
})

export const writeClient = createClient({
  // ... with token, useCdn: false
})
```

**Step 3: Update all imports across the codebase**

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: consolidate Sanity client definitions into single canonical module"
```

---

## Phase 4: Fix Broken Features

### Task 4.1: Fix Download Tracking

**Files:**
- Modify: `app/api/analytics/download/route.ts`

**Step 1: Rewrite the POST handler (currently commented out)**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const downloadEventSchema = z.object({
  reportId: z.string().min(1),
  fileLanguage: z.string().min(1),
  sessionId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await request.json()
    const validated = downloadEventSchema.parse(body)

    const downloadEvent = await prisma.downloadEvent.create({
      data: {
        reportId: validated.reportId,
        fileLanguage: validated.fileLanguage,
        userId: userId || null,
        sessionId: validated.sessionId || 'anonymous',
        userAgent: request.headers.get('user-agent') || null,
        referer: request.headers.get('referer') || null,
        ipAddress: getClientIP(request),
        timestamp: new Date(),
      },
    })

    // Update report metadata count
    await prisma.report_metadata.upsert({
      where: { sanityId: validated.reportId },
      create: {
        id: validated.reportId,
        sanityId: validated.reportId,
        downloadCount: 1,
        lastDownloadedAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        downloadCount: { increment: 1 },
        lastDownloadedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, eventId: downloadEvent.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    console.error('Download tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track download' },
      { status: 500 }
    )
  }
}

// Keep existing GET handler for analytics
```

**Step 2: Remove the old commented-out code**

Delete lines 5-88 (the old commented POST and getClientIP).

**Step 3: Commit**

```bash
git add app/api/analytics/download/route.ts
git commit -m "fix(downloads): rewrite download tracking POST handler with validation"
```

---

### Task 4.2: Fix Content Locale Fallback Chain

**Files:**
- Modify: Sanity fetch functions that return localized content

**Step 1: Implement fallback pattern**

For each content query that filters by language, change to sort-based prioritization:

```groq
// BEFORE:
*[_type == "newsPost" && language == $lang]

// AFTER:
*[_type == "newsPost"] | order(
  language == $userLang desc,
  language == "en" desc,
  publishedAt desc
)
```

This returns ALL content, but prioritizes the user's language, then English, then any other language.

**Step 2: Apply to all content types**

- News posts
- Case studies
- Agendas
- Lived experiences

**Step 3: Commit**

```bash
git add sanity/
git commit -m "feat(i18n): implement content locale fallback chain (user lang → English → any)"
```

---

### Task 4.3: Fix 404 and Error Page Locale Navigation

**Files:**
- Modify: `components/404.tsx`
- Modify: `app/[locale]/(main)/error.tsx`
- Modify: `app/[locale]/(main)/not-found.tsx`

**Step 1: Fix Link imports**

```typescript
// components/404.tsx
// BEFORE:
import Link from "next/link"
// AFTER:
import { Link } from "@/i18n/navigation"

// app/[locale]/(main)/error.tsx
// BEFORE:
<a href="/">
// AFTER:
import { Link } from "@/i18n/navigation"
// ... <Link href="/">
```

**Step 2: Localize not-found metadata**

```typescript
// app/[locale]/(main)/not-found.tsx
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'errors' })
  return { title: t('notFound.title') }
}
```

**Step 3: Commit**

```bash
git add components/404.tsx app/[locale]/(main)/error.tsx app/[locale]/(main)/not-found.tsx
git commit -m "fix(i18n): use locale-aware Link and localized metadata in error pages"
```

---

## Phase 5: Performance Improvements

### Task 5.1: Fix N+1 Query in Fuzzy Search

**Files:**
- Modify: `lib/services/user.service.ts:511-535`

**Step 1: Replace N individual queries with batch**

```typescript
// BEFORE (N+1):
const usersWithRelations = await Promise.all(
  users.map(async (user) => {
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { communityMemberships: { include: { community: true } }, recentWork: { ... } }
    })
    // ...
  })
)

// AFTER (single query):
const userIds = users.map(u => u.id)
const fullUsers = await prisma.user.findMany({
  where: { id: { in: userIds } },
  include: {
    communityMemberships: { include: { community: true } },
    recentWork: { orderBy: { createdAt: 'desc' }, take: 3 }
  }
})

// Maintain original sort order from fuzzy query
const userMap = new Map(fullUsers.map(u => [u.id, u]))
const orderedUsers = users
  .map(u => userMap.get(u.id))
  .filter((u): u is NonNullable<typeof u> => u !== null)
  .map((fullUser, i) => ({
    ...this.transformToLocalizedUser(fullUser, localizedQuery),
    similarity: users[i].similarity_score
  }))
```

**Step 2: Commit**

```bash
git add lib/services/user.service.ts
git commit -m "perf: replace N+1 query pattern in fuzzy search with batch findMany"
```

---

### Task 5.2: Switch Algolia Sync to replaceAllObjects

**Files:**
- Modify: All 4 sync route files under `app/api/search/*/sync/`

**Step 1: Find all sync routes**

```bash
find app/api/search -name "route.ts" -path "*/sync/*"
```

**Step 2: Replace clearObjects + saveObjects pattern**

```typescript
// BEFORE:
await algoliaClient.clearObjects({ indexName })
await algoliaClient.saveObjects({ indexName, objects: records })

// AFTER:
await algoliaClient.replaceAllObjects({
  indexName,
  objects: records,
})
```

`replaceAllObjects` is atomic — it builds a temp index, then swaps. Zero downtime.

**Step 3: Commit**

```bash
git add app/api/search/
git commit -m "perf: switch Algolia sync from clear+save to atomic replaceAllObjects"
```

---

### Task 5.3: Enable Sanity CDN for Read Client

**Files:**
- Modify: `sanity/env.ts` or `sanity/lib/client.ts`

**Step 1: Set useCdn: true for read client**

```typescript
// Ensure the primary read client has:
useCdn: true
// Only disable for preview/draft:
// useCdn: false (write client, preview client only)
```

**Step 2: Commit**

```bash
git add sanity/
git commit -m "perf: enable Sanity CDN for read client"
```

---

### Task 5.4: Add Missing Database Indexes

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add indexes**

```prisma
model User {
  // ... existing fields

  @@index([lastLoginAt])
  @@index([profileVisibility])
  @@index([isSearchable])
  @@index([profileCompleteness])
  @@index([country])
}

model RecentWork {
  // ... existing fields

  @@index([userId])
}

model Content {
  // ... existing fields

  @@index([communityId])
  @@index([authorId])
}

model UserCommunity {
  // ... existing fields (already has @@id([userId, communityId]))

  @@index([communityId])
}
```

**Step 2: Generate and apply migration**

```bash
npx prisma migrate dev --name add-performance-indexes
```

**Step 3: Commit**

```bash
git add prisma/
git commit -m "perf: add database indexes for frequently queried User, RecentWork, Content columns"
```

---

### Task 5.5: Fix Image Quality Settings

**Files:**
- Modify: `components/portable-text-renderer.tsx:53`
- Modify: `components/ui/post-card.tsx:39`
- Modify: `components/blocks/grid/grid-card.tsx:54`
- Modify: `components/blocks/hero/hero-1.tsx:114`
- Modify: `components/blocks/split/split-image.tsx:24`
- Modify: `components/blocks/post-hero.tsx:28`
- Modify: `components/blocks/carousel/carousel-1.tsx:111`

**Step 1: Remove quality={100} from all instances**

In each file, find `quality={100}` and either remove it (Next.js default is 75) or set to `quality={85}` for a good balance.

```typescript
// BEFORE:
<Image quality={100} ... />

// AFTER:
<Image ... />
// or <Image quality={85} ... />
```

**Step 2: Commit**

```bash
git add components/
git commit -m "perf: remove quality=100 from Next.js Image components (saves ~40% bandwidth)"
```

---

### Task 5.6: Remove Custom Algolia Debounce Wrapper

**Files:**
- Modify: `lib/algolia.ts:84-116`

**Step 1: Remove the debounce wrapper**

```typescript
// Delete the createDebouncedSearchClient function (lines 84-113)
// Change the export:

// BEFORE:
export const searchClient = createDebouncedSearchClient(baseSearchClient, 300)

// AFTER:
export const searchClient = baseSearchClient
```

The custom debounce creates abandoned promises that can cause stale results. InstantSearch has built-in query debouncing via the `searchAsYouType` prop or `queryHook`.

**Step 2: Commit**

```bash
git add lib/algolia.ts
git commit -m "perf: remove custom Algolia debounce wrapper (use InstantSearch built-in instead)"
```

---

### Task 5.7: Remove Wasted Query in getUsersByRegionalCommunity

**Files:**
- Modify: `lib/services/user.service.ts`

**Step 1: Find and remove the initial eager query**

Look for the function around line 730. The first query fetches users but its results are discarded before the privacy-filtered query runs.

Remove the first query, keep only the privacy-filtered one.

**Step 2: Commit**

```bash
git add lib/services/user.service.ts
git commit -m "perf: remove discarded eager query in getUsersByRegionalCommunity"
```

---

## Phase 6: Re-enable User Search with Privacy

### Task 6.1: Update User Transform for Privacy

**Files:**
- Modify: `lib/algolia.ts` (transformUserForIndex function)

**Step 1: Only index public fields**

```typescript
export function transformUserForIndex(user: any): UserSearchRecord | null {
  if (!user.isSearchable) return null

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()

  return {
    objectID: user.id,
    userId: user.id,
    username: user.username || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    fullName,
    profileImage: user.image,
    // Conditionally include based on privacy settings
    organization: user.showWorkDetails ? user.organization : undefined,
    position: user.showWorkDetails ? user.position : undefined,
    workTypes: user.showWorkDetails ? (user.workTypes || []) : [],
    expertiseAreas: user.showWorkDetails ? (user.expertiseAreas || []) : [],
    country: user.showLocation ? user.country : undefined,
    city: user.showLocation ? user.city : undefined,
    location: user.showLocation
      ? [user.city, user.country].filter(Boolean).join(', ') || undefined
      : undefined,
    // Never index sensitive fields
    bio: undefined, // too personal
    // Privacy flags for filtering
    isSearchable: user.isSearchable,
    profileVisibility: user.profileVisibility,
    showEmail: user.showEmail,
    showWorkDetails: user.showWorkDetails,
    showSocialLinks: user.showSocialLinks,
    showLocation: user.showLocation,
    // Metadata
    joinedAt: new Date(user.createdAt).getTime(),
    lastActiveAt: user.updatedAt ? new Date(user.updatedAt).getTime() : undefined,
    communityCount: user.communityMemberships?.length || 0,
    communities: user.communityMemberships?.map((m: any) => m.community.name) || [],
    role: user.role,
  }
}
```

**Step 2: Add re-index on privacy settings change**

In the profile update handler, when privacy settings change, trigger an Algolia re-index for that user. When `isSearchable` changes to `false`, remove from index.

**Step 3: Commit**

```bash
git add lib/algolia.ts app/api/profile/
git commit -m "feat(search): update user index transform to respect privacy settings"
```

---

### Task 6.2: Restore User Search Tab

**Files:**
- Modify: `components/search/search-interface.tsx`

**Step 1: Restore the user search tab**

Remove the comment markers around the user search tab (lines ~84-193 that were commented out). Ensure search results:
- Only show fields the user has made public
- Link to profile pages
- Respect `profileVisibility` via Algolia filters

**Step 2: Add Algolia-side filtering**

```typescript
// In the user search configuration:
searchParameters={{
  filters: 'isSearchable:true AND (profileVisibility:PUBLIC OR profileVisibility:MEMBERS)',
}}
```

**Step 3: Commit**

```bash
git add components/search/search-interface.tsx
git commit -m "feat(search): re-enable user search tab with privacy-respecting filters"
```

---

## Phase 7: New Features & Polish

### Task 7.1: GDPR Cookie Consent Banner

**Files:**
- Create: `components/cookie-consent/cookie-consent-banner.tsx`
- Create: `components/cookie-consent/cookie-settings-modal.tsx`
- Modify: `app/[locale]/layout.tsx` (add banner)
- Modify: `messages/en.json`, `messages/es.json`, `messages/fr.json`, `messages/ar.json` (add translations)

**Step 1: Identify all cookies**

- **Necessary (always allowed):** Clerk auth cookies (`__clerk_*`, `__session`)
- **Analytics:** Plausible (actually cookieless by default — verify)
- **Media:** YouTube embeds (`CONSENT`, `VISITOR_INFO1_LIVE`, `YSC`)

**Step 2: Build the banner component**

```typescript
// components/cookie-consent/cookie-consent-banner.tsx
'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

type CookieConsent = {
  necessary: true // always true
  analytics: boolean
  media: boolean
}

const COOKIE_CONSENT_KEY = 'ccm-cookie-consent'

export function CookieConsentBanner() {
  const t = useTranslations('cookieConsent')
  const [consent, setConsent] = useState<CookieConsent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (stored) {
      setConsent(JSON.parse(stored))
    } else {
      setShowBanner(true)
    }
  }, [])

  const acceptAll = () => {
    const newConsent: CookieConsent = { necessary: true, analytics: true, media: true }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent))
    document.cookie = `ccm-consent=${JSON.stringify(newConsent)}; max-age=31536000; path=/; SameSite=Lax`
    setConsent(newConsent)
    setShowBanner(false)
  }

  const acceptNecessaryOnly = () => {
    const newConsent: CookieConsent = { necessary: true, analytics: false, media: false }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newConsent))
    document.cookie = `ccm-consent=${JSON.stringify(newConsent)}; max-age=31536000; path=/; SameSite=Lax`
    setConsent(newConsent)
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div
      dir="auto"
      className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-900 border-t p-4 shadow-lg"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm flex-1">
          {t('message')}
        </p>
        <div className="flex gap-2">
          <button
            onClick={acceptNecessaryOnly}
            className="px-4 py-2 text-sm border rounded-md"
          >
            {t('necessaryOnly')}
          </button>
          <button
            onClick={acceptAll}
            className="px-4 py-2 text-sm bg-primary text-white rounded-md"
          >
            {t('acceptAll')}
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Block YouTube embeds until consent**

In the video modal component, check consent before rendering iframe:

```typescript
const consent = typeof window !== 'undefined'
  ? JSON.parse(localStorage.getItem('ccm-cookie-consent') || '{}')
  : {}

if (!consent.media) {
  return (
    <div className="aspect-video bg-gray-100 flex items-center justify-center">
      <p>{t('cookieConsent.mediaBlocked')}</p>
      <button onClick={requestMediaConsent}>{t('cookieConsent.enableMedia')}</button>
    </div>
  )
}
```

**Step 4: Add translation keys to all 4 locale files**

```json
{
  "cookieConsent": {
    "message": "We use cookies to enhance your experience. YouTube embeds require media cookies.",
    "acceptAll": "Accept all",
    "necessaryOnly": "Necessary only",
    "settings": "Cookie settings",
    "mediaBlocked": "YouTube video blocked. Enable media cookies to watch.",
    "enableMedia": "Enable media cookies"
  }
}
```

Add equivalent translations for es, fr, ar.

**Step 5: Add banner to root layout**

```typescript
// app/[locale]/layout.tsx
import { CookieConsentBanner } from '@/components/cookie-consent/cookie-consent-banner'

// In the layout JSX:
<body>
  {children}
  <CookieConsentBanner />
</body>
```

**Step 6: Commit**

```bash
git add components/cookie-consent/ app/[locale]/layout.tsx messages/
git commit -m "feat(gdpr): add cookie consent banner with i18n, RTL support, and YouTube embed blocking"
```

---

### Task 7.2: Fix i18n Translation Gaps

**Files:**
- Modify: `messages/en.json` — fix duplicate `caseStudy` key
- Modify: `messages/ar.json` — fix file size
- Modify: `messages/es.json`, `messages/fr.json`, `messages/ar.json` — translate app.name/tagline

**Step 1: Fix duplicate key in en.json**

Search for `"caseStudy"` — there should be two top-level keys with this name. Merge them into one.

**Step 2: Translate app.name and tagline**

The brand name "Connecting Climate Minds" may stay in English, but `app.tagline` should be translated.

**Step 3: Commit**

```bash
git add messages/
git commit -m "fix(i18n): merge duplicate caseStudy key, translate app.tagline, fix ar.json size"
```

---

### Task 7.3: Fix Frontend Cleanup Items

**Files:**
- Multiple component files

**Step 1: Remove console.log statements (or gate behind NODE_ENV)**

```bash
grep -rn "console\.log" --include="*.tsx" components/ | head -30
```

Replace bare `console.log` in components with nothing (remove them), keeping `console.error` and `console.warn` for actual error conditions.

**Step 2: Fix news-card.tsx to use next/image**

Replace raw `<img>` tags with `<Image>` from `next/image`.

**Step 3: Fix DesktopNav accessibility**

Wrap navigation links in a `<nav>` element.

**Step 4: Commit**

```bash
git add components/
git commit -m "fix(frontend): remove console.logs, fix img→Image, add nav landmark"
```

---

## Execution Notes

### Secret Rotation (Task 1.1 — manual, not in this plan)

Secret rotation must be done manually by the project owner:
1. Rotate all secrets in their respective dashboards (Clerk, Sanity, Neon, Algolia, Resend)
2. Update Vercel environment variables
3. Purge `.env` from git history using BFG Repo-Cleaner
4. Verify app works after rotation

This is listed in the design doc but omitted from this plan because it cannot be automated via code changes.

### Testing Strategy

- **Security fixes:** Test with malicious inputs (SQL injection strings, GROQ injection, XSS payloads)
- **Privacy fixes:** Verify with different user roles (anonymous, authenticated, own-profile)
- **Dead code removal:** Run `npm run build` after each deletion to catch broken imports
- **Performance:** Compare query counts before/after using Prisma query logging
- **Cookie consent:** Test all 4 languages, test RTL layout, test YouTube blocking

### Dependency Order

```
Phase 1 (Critical Security) → must be first
Phase 2 (Privacy Hardening) → after Phase 1
Phase 3 (Dead Code) → can parallel with Phase 2
Phase 4 (Fix Features) → after Phase 3 (less code to navigate)
Phase 5 (Performance) → after Phase 2 (privacy changes affect queries)
Phase 6 (User Search) → after Phase 2 (needs privacy enforcement)
Phase 7 (New Features) → after Phase 1 (independent otherwise)
```
