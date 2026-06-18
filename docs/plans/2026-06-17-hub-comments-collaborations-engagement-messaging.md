# Hub Comments, Collaborations, Engagement & Messaging — Implementation Plan

## Context

A feature spec ("Hub Content Comments" + "Collaborative Projects") was supplied written against an *assumed* stack. The task was explicitly **not** to accept it blindly, but to adapt it to the real codebase. Exploration found the spec diverges from reality in load-bearing ways, and clarifying answers expanded scope well past the spec's "cost-minimal, no-realtime v1."

**This is the Connecting Climate Minds Hub** — a climate × mental-health platform. That domain matters: moderation and anonymous participation are handled conservatively because the audience is vulnerable.

### Spec vs. reality (verified)

| Spec claim | Reality |
|---|---|
| "JS", Turborepo | **100% TypeScript**, single Next.js **16.1.1** app (App Router, React 19), i18n via next-intl (en/es/fr/ar, Arabic RTL) |
| Need a `clerkId` column + User mirror | **Already exists.** `User.id` **IS** the Clerk id (webhook `prisma.user.create({ data: { id: clerkId }})`). All new UGC FKs to `User.id`; **no `clerkId` column** |
| Clerk webhooks to build | **Already built**: `app/api/webhooks/clerk/route.ts` syncs create/update/delete/session |
| Neon serverless adapter | Standard pooled Prisma via `DATABASE_URL`; client singleton `lib/prisma.ts` (+ `safeQuery`) |
| R2 to set up | **Creds already in `.env` (commented out)** — real account, buckets `ccm-avatars` / `ccm-reports-agendas`, public hostnames. `MAX_FILE_SIZE=50MB`, `ALLOWED_FILE_TYPES` env vars active. `@aws-sdk/client-s3` **not installed** |
| EmbedPDF | **Not installed.** New, unproven on React 19 / Turbopack |
| Feature B "Project" | **Collides** with an existing Sanity `project` doc type (content artifact referenced by case studies) |
| One global role | **Two divergent role systems** (see below) |

### The role-vocabulary landmine (top correctness risk)
- Prisma `User.role` enum: `community_member | community_editor | team_editor | admin`.
- `utils/roles.ts` `checkRole()` reads `sessionClaims.metadata.role`; `types/globals.ts` `Roles` = `admin | editor | community-editor | member`.
- **These vocabularies do not map 1:1** (`team_editor`≠`editor`, `community_member`≠`member`). Using `checkRole()` for new moderation would silently mis-authorize. → **All new server-side authz reads Prisma `User.role` as the single source of truth.**

### Decisions (locked)
1. **PDF**: full canvas annotations via EmbedPDF — **with a time-boxed spike checkpoint** so React-19 incompatibility can't silently stall release.
2. **Naming**: the collaborative-space feature is **"Collaboration"** in code/routes (avoids the Sanity `project` collision).
3. **Anonymous comments allowed**, but every anonymous comment is **held for editor approval**; signed-in comments post immediately. All comments pass a wordlist filter.
4. **Moderation**: deterministic **risky-term wordlist** (CMS-editable in Sanity) → editor review queue. **No AI** classification.
5. **Engagement is in scope**: email-on-reply (Resend), @mentions, reactions, in-app + email notifications, **and direct messaging**.

### Intended outcome
A unified discussion + collaboration layer: threaded moderated comments on Sanity content, user-created Collaboration spaces (members/roles, files, PDF annotation, threads), and a full engagement subsystem (notifications + DMs) — all on the existing Clerk + Neon/Prisma + Sanity + R2 stack, mobile-first, reusing CCM design tokens.

> **Scope honesty:** this is a multi-month *program*, not one PR. It is sliced so each slice ships independently behind the existing patterns. Recommend treating Phases 0–2 (comments) as release 1, Phase 3 (collaborations) as release 2, Phase 4 (engagement/messaging) as release 3.

---

## Architectural decisions

### A. Single authoritative authz core — build first
New `lib/authz.ts`:
- `getActor()` — `auth()` → `userId` → `prisma.user.findUnique({ select: { id, role }})`. Returns `null` for anonymous. Standardizes the ~12 existing ad-hoc lookups.
- `assertCan(actor, action, resource)` — throws a typed 403. Global actions (`comment:remove`, `report:resolve`, `moderation:view`) gate on Prisma `User.role ∈ {team_editor, admin}`. Collaboration actions gate on **membership role**, not global role.
- Do **not** extend `checkRole()`; leave it for existing Clerk-session-gated UI only.

### B. Polymorphic Comment engine (powers content comments AND collaboration threads)
- One `Comment` table; FK `authorId → User.id` (nullable for anonymous; `authorName`/`authorEmail` captured instead).
- `targetType` enum + `targetId` string. Allowlist of target types enforced server-side: `caseStudy | newsPost | livedExperience | report | collaborationThread`. Reject anything else (prevents aiming the polymorphic id at arbitrary docs).
- **One level of nesting**, enforced in the handler (reject a reply whose parent already has a `parentId`) — not in SQL.
- `status` enum: `PENDING | VISIBLE | DELETED_BY_AUTHOR | REMOVED_BY_MOD`. Anonymous → `PENDING`. Signed-in → `VISIBLE` unless wordlist-flagged → `PENDING`.
- **Soft delete** keeps the row (tombstone if it has replies). Hard delete only on GDPR erasure.
- **Cross-datastore integrity**: no FK to Sanity. Validate `targetId` at **write** time with one targeted GROQ existence query that re-asserts the public predicate (e.g. case study `status == "approved"`). Read path needs no validation fetch — the content page only renders if the doc is already public, and it passes `_id`+`targetType` as props to the client island.
- Indexes: `(targetType, targetId, status, createdAt)`, `(parentId)`, `(authorId)`. **Keyset (cursor) pagination** on `(createdAt, id)`, not OFFSET.

### C. Comment section mounting (must not break ISR)
- Content detail pages are RSC with `export const revalidate = 300`. `<CommentSection>` is a `'use client'` island that fetches client-side via `GET /api/comments` (SWR — already a dep). It renders nothing blocking server-side, so `generateStaticParams` + ISR stay intact. Lazy/below-the-fold to protect mobile LCP. `sonner` for toasts (already wired).

### D. Collaboration tables — mirror the proven `UserCommunity` pattern
- New `CollaborationRole` enum (`OWNER | EDITOR | COMMENTER | VIEWER`) — separate axis from the global `Role`.
- `CollaborationMember`: composite PK `[collaborationId, userId]`, per-row `role`, `onDelete: Cascade` (exactly like `UserCommunity`). Workspaces are user-created/free-form, so fully separate tables (not shoehorned into `Community`, which is a fixed regional/special taxonomy).
- Lifecycle `DRAFT | ACTIVE | ARCHIVED` (no `SUGGESTED` gate — cut). Visibility `PUBLIC | MEMBERS`.

### E. R2 wiring
- Install `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`; S3 client → R2 endpoint (`region: 'auto'`, `forcePathStyle: true`).
- **Presigned PUT**: `POST /api/collaborations/[id]/files/presign` → `assertCan('collab:upload')` → **server-side** validate contentType against `ALLOWED_FILE_TYPES` + size against `MAX_FILE_SIZE` (echo existing env). Key: `collaborations/{id}/{uuid}/{sanitizedName}`, short-TTL signature with `Content-Length`/`Content-Type` baked in. Persist `CollaborationFile` row only after PUT confirmed (optionally HEAD the object).
- **MEMBERS-visibility reads**: do **not** place MEMBERS files in the public buckets (world-readable by URL). Use a **private bucket/prefix** + a presigned-GET route (`assertCan('collab:read')`, short TTL, client caches for TTL). PUBLIC collabs may use a public prefix. Visibility decides the key routing **at upload time**.

### F. EmbedPDF (highest risk)
- `'use client'` + `next/dynamic({ ssr: false })`. Budget time for **Turbopack web-worker resolution** (known sharp edge). Route-split: load only when a file is opened, never on the overview.
- Annotations persist as a `CollaborationAnnotation` row: `(fileId, page)`, `rects Json` (viewport-independent), `authorId`, `body`, `color`, `resolved`, `parentId` for replies. PDF bytes in R2 are **never mutated**.
- **Spike checkpoint (Phase 3, slice C-B5):** time-box an EmbedPDF + React-19 + Turbopack proof. If it fails, fall back to **page-anchored comments** (reuse `Comment` with `targetType=collaborationFile` + a `page` field) and defer canvas rects to a follow-up. The user chose full annotations; the spike protects the schedule, it doesn't override the choice.

### G. Moderation — deterministic wordlist, no AI
- Risky-term list authored in **Sanity** (new `moderationTerm` doc or a settings singleton) so editors maintain it without deploys; cached server-side.
- On comment create: normalize body, match against terms → if hit, set `status=PENDING` and create a `CommentFlag` (reason `WORDLIST`). Anonymous comments are `PENDING` regardless.
- **Moderation queue UI** at `app/[locale]/(main)/moderation/` gated by `assertCan('moderation:view')` (`team_editor|admin`): tabs for pending-anon, wordlist-flagged, reported. Actions: approve (→`VISIBLE`), remove (→`REMOVED_BY_MOD`), dismiss report. Reuses shadcn `tabs`/`card`/`dropdown-menu`.
- `CommentReport` table: `reporterId`, `reason`, `status (OPEN|ACTIONED|DISMISSED)`, unique `[commentId, reporterId]`.

### H. Engagement subsystem
- **Reactions**: `Reaction` table `[commentId, userId, emoji]` unique; aggregate counts in the list query.
- **@mentions**: parse `@username` against `User.username` (exists, unique-indexed) at write time; store resolved mentions in a `Mention` table to drive notifications; render as profile links.
- **Notifications**: `Notification` table (`recipientId`, `type`, `actorId`, `entityType`, `entityId`, `readAt`). Events: reply, mention, reaction, collab-activity, new message. In-app bell (polling via SWR; no realtime in v1) + batched email via **Resend** (already wired, `app/api/newsletter/route.ts` is the integration template) respecting a per-user notification preference + unsubscribe.
- **Messaging (DMs)**: `Conversation` + `ConversationParticipant` + `Message` tables. 1:1 and small-group. Inbox UI; near-real-time via SWR polling (no socket infra in v1). Each new message fans out a `Notification`. Built last; it's the largest single slice.

### I. Rate limiting (none exists today)
- Postgres-backed fixed-window counter (`lib/rate-limit.ts`, `assertRateLimit(actorKey, action)` → 429). In-memory buckets are unreliable on serverless (per-instance). Apply to all writes: comment create, report, collab create, file persist, message send. Generous limits.

### J. GDPR (must-not-skip)
Extend `lib/account-deletion.ts`:
- All new FKs to `User`: `onDelete: Cascade` (`Comment.authorId`, `CommentReport.reporterId`, `Reaction.userId`, `Mention`, `Notification.recipientId`, `CollaborationMember.userId`, `CollaborationFile.uploadedById`, `CollaborationAnnotation.authorId`, `Message.senderId`, `ConversationParticipant.userId`).
- **Prisma cascade does NOT delete R2 objects** — extend `eraseUserSanityContent`'s sibling logic to sweep the user's `CollaborationFile` R2 objects, mirroring the existing Sanity sweep.
- **Sole-OWNER erasure**: deleting the only OWNER of a Collaboration would cascade-delete everyone's contributions. Add ownership-transfer-or-archive semantics before enabling erasure of collab owners.

---

## Prisma schema delta (high level)
Add to `prisma/schema.prisma`:
- Enums: `CommentTargetType`, `CommentStatus`, `CollaborationStatus`, `CollaborationVisibility`, `CollaborationRole`, `NotificationType`.
- Models: `Comment`, `CommentReport`, `CommentFlag`, `Reaction`, `Mention`, `Collaboration`, `CollaborationMember`, `CollaborationFile`, `CollaborationThread`, `CollaborationAnnotation`, `CollaborationMedia`, `Notification`, `NotificationPreference`, `Conversation`, `ConversationParticipant`, `Message`, `RateLimit`.
- Add back-relations on `User` (comments, reactions, notifications, memberships, uploads, messages…).
- Every user FK `onDelete: Cascade`. Mirror `UserCommunity` for `CollaborationMember`.

Migrations via existing Prisma workflow (`prisma migrate dev`), generated client to `@/generated/prisma`.

---

## Build sequence (slice-by-slice, mobile-first, with checkpoints)

**Phase 0 — Foundations (no user-visible change)**
- Slice 0a: `lib/authz.ts` (`getActor`, `assertCan`); document Prisma `User.role` as the authz source. Opportunistically migrate existing handlers off `checkRole()`.
- Slice 0b: `lib/rate-limit.ts` + `RateLimit` model + migration.
- **Checkpoint:** typecheck + a Vitest unit test on `assertCan` matrix.

**Phase 1 — Content comments (Release 1)**
- C1: `Comment`/`CommentReport`/`CommentFlag` models + migration; `GET /api/comments` (anon read, keyset pagination); read-only `<CommentSection>` island on the case-study page.
- C2: authed write + optimistic insert + edit/soft-delete; GROQ target guard; one-level-nesting enforcement.
- C3: anonymous write (name capture, held `PENDING`); wordlist filter + Sanity `moderationTerm` source; `POST /api/comments/[id]/report`.
- C4: moderation queue UI (`/moderation`), `assertCan('moderation:view')`, approve/remove/dismiss.
- C5: roll the island out to news / lived-experience / report detail pages (confirm each projection exposes `_id`).
- **Checkpoint each slice:** verify on the *rendered* page (screenshot), not just green build (per standing directive).

**Phase 2 — Engagement on comments (Release 1.x)**
- E1: `Reaction` model + UI. E2: `@mention` parse + `Mention` model + profile links. E3: `Notification` + `NotificationPreference` + in-app bell (SWR poll) + Resend email-on-reply/mention (reuse newsletter route pattern) + unsubscribe.

**Phase 3 — Collaborations (Release 2)**
- C-B1: `Collaboration` + `CollaborationMember` (mirror `UserCommunity`) + lifecycle/visibility; list + detail UI; membership CRUD.
- C-B2: discussion threads (`CollaborationThread`; reuse the whole Comment engine via `targetType=collaborationThread`) — high leverage, do before files.
- C-B3: R2 upload (install AWS SDK, presign PUT/GET, `CollaborationFile`, server-side size/type validation, private-bucket MEMBERS reads).
- C-B4: oEmbed external media (`CollaborationMedia`, YouTube/Vimeo allowlist only; `react-player` already present renders).
- **C-B5 (SPIKE):** time-boxed EmbedPDF + React-19 + Turbopack proof → full canvas annotations (`CollaborationAnnotation`) **or** documented fallback to page-anchored comments.
- Cross-cutting: optional Algolia index for PUBLIC+ACTIVE collaborations (mirror `app/api/search/case-studies/webhook`) — deferrable.

**Phase 4 — Notifications hardening + Messaging (Release 3)**
- M1: extend `Notification` to collab-activity events. M2: `Conversation`/`ConversationParticipant`/`Message` + inbox UI + SWR-poll delivery + message→notification fan-out. M3: GDPR sole-owner-transfer + R2-object erasure wiring in `lib/account-deletion.ts`.

---

## What was cut / pushed back on (YAGNI)
- **`SUGGESTED` review gate** on collaboration lifecycle — cut (DRAFT→ACTIVE→ARCHIVED only).
- **AI moderation** — cut; deterministic wordlist only.
- **Realtime/presence/co-annotation** — out; SWR polling everywhere.
- **`Comment.reportCount` denormalization** — query `CommentReport` instead.
- **oEmbed for arbitrary providers** — YouTube/Vimeo allowlist only.
- **Neon serverless adapter** — not needed; existing pooled Prisma is fine.
- **Generalized rate-limit infra** — minimal Postgres counter, not Upstash.

---

## Critical files
- `prisma/schema.prisma` — all new models/enums; mirror `UserCommunity` join + `onDelete: Cascade`.
- `lib/authz.ts` *(new)* — `getActor`/`assertCan`; resolves the `User.role` vs `sessionClaims.metadata.role` divergence in `utils/roles.ts` + `types/globals.ts`.
- `lib/rate-limit.ts` *(new)*, `lib/r2.ts` *(new)* — S3/R2 client + presign helpers echoing `MAX_FILE_SIZE`/`ALLOWED_FILE_TYPES`.
- `lib/account-deletion.ts` — extend for new UGC + R2 object sweep + sole-owner transfer.
- `app/api/case-studies/submit/route.ts` — canonical write-handler template (`auth()`, zod `safeParse`, size/type checks, `NextResponse`).
- `app/[locale]/(main)/research-and-action/case-studies/[slug]/page.tsx` — `<CommentSection>` mount point (`_id`+`status` already available; ISR-safe island).
- `sanity/queries/grid/grid-case-study.ts` — public `status=="approved"` contract + GROQ target-guard template.
- `app/api/search/case-studies/webhook/route.ts` — template for eventual `collaborations` Algolia sync.
- `app/api/newsletter/route.ts` — Resend integration template for notification emails.
- `lib/prisma.ts` — `prisma` + `safeQuery`.

## Verification
- **Per slice**: `pnpm typecheck` + relevant Vitest unit tests (authz matrix, wordlist filter, nesting/target-guard rejection, rate-limit window).
- **Rendered-UI check** (standing directive): screenshot the actual page after each UI slice — green build ≠ validated.
- **Comments E2E**: comment on a case study persists against its Sanity `_id`, survives re-publish; reply tombstone on parent delete; anonymous comment lands in queue and only shows after editor approval; wordlist-flagged comment is held; reported comment removable by `team_editor` and disappears for all.
- **Collaboration E2E**: creator auto-OWNER; EDITOR uploads PDF + creates thread; COMMENTER annotates but can't upload; VIEWER read-only; MEMBERS collab returns 403 to non-members; deleting a file removes the R2 object + its annotations.
- **GDPR**: erasing a user removes their comments/reactions/messages/notifications (Prisma cascade) **and** their R2 files (extended sweep), with sole-owner collabs transferred/archived not orphaned.
- **PDF spike gate**: explicit go/no-go on EmbedPDF before committing the annotation UI.
