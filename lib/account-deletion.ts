import { prisma } from "@/lib/prisma"
import { activeBackend } from "@/lib/content/internal/backend"
import { deleteDocuments, queryRaw } from "@/lib/content/internal/sanity-source"
import {
  deleteDocuments as payloadDeleteDocuments,
  queryLive as payloadQueryLive,
  queryRaw as payloadQueryRaw,
} from "@/lib/content/internal/payload-source"
import type { CollectionSlug, Where } from "payload"
import { r2Configured, deleteObject } from "@/lib/r2"
import { algoliaClient, ALGOLIA_INDICES } from "@/lib/algolia"
import { writeIndexName } from "@/lib/algolia-indices"

/**
 * GDPR account erasure.
 *
 * Performs a complete, synchronous deletion of a user's account data so the
 * "right to erasure" is honoured immediately rather than relying on the
 * (eventually-consistent, best-effort) Clerk webhook:
 *
 *  1. Prisma: delete the User row. RecentWork and UserCommunity cascade
 *     (onDelete: Cascade in schema.prisma), so all relational personal data goes.
 *  2. The CMS: the user authors caseStudy / livedExperience / researchOutput /
 *     event documents keyed by `submittedBy == clerkUserId`, plus
 *     caseStudyDraft documents keyed by `userId`.
 *       - Drafts and non-approved submissions: deleted outright (private, not
 *         public, no reason to retain).
 *       - Approved (published) submissions: LEFT AS-IS. They are published
 *         community content; we do not alter them on account deletion. The user
 *         is told in the UI to contact the Connecting Climate Minds Hub team by
 *         email if they want a published case study changed or removed.
 *  3. Clerk: delete the auth user (done by the caller after this returns, so a
 *     CMS/Prisma failure doesn't leave a deleted Clerk user with orphaned data).
 *
 * The Clerk `user.deleted` webhook remains as an idempotent backstop: it skips
 * cleanly if the Prisma row is already gone.
 */

export interface DeletionResult {
  prismaDeleted: boolean
  draftsDeleted: number
  submissionsDeleted: number
  publishedRetained: number
}

interface ErasureCounts {
  draftsDeleted: number
  submissionsDeleted: number
  publishedRetained: number
}

// ---------------------------------------------------------------------------
// The Payload arm
// ---------------------------------------------------------------------------
//
// `activeBackend("account-deletion")` decides —
// `CONTENT_BACKEND_ACCOUNT_DELETION`, or the process-wide `CONTENT_BACKEND`.
// Unset means Sanity.
//
// This is the only code in the phase that deletes, and translating it is
// structural rather than mechanical. Three differences, each of which costs
// either retained content or un-erased personal data if it is got wrong:
//
// 1. **Payload has no `drafts.`-prefixed ids.** In Sanity a draft is a separate
//    document, so the raw perspective returns `X` and `drafts.X` as two ids and
//    a batch delete can take one without the other. In Payload a draft is a
//    VERSION of the same id, so there is one id and the question becomes "which
//    revision am I looking at". That splits Sanity's single read in two:
//
//      queryRaw  — every version visible, uncached. WHAT THE USER AUTHORED,
//                  including documents that were never published at all (they
//                  live in the main table with `_status: "draft"`).
//      queryLive — published-only, uncached. WHAT MAY BE RETAINED.
//
//    Both are needed, and using `queryRaw` for the retention half would be the
//    Phase-1 authorization bypass exactly: an unpublished draft carrying
//    `moderationStatus: "approved"` would look retainable and survive an
//    erasure. Measured, and this is not hypothetical: **22 rows are published
//    in the main table with a `latest` DRAFT version on top** (21 lived
//    experiences, 1 case study). A drafts-visible read reports every one of
//    them as `_status: "draft"`; classifying on that single read would delete
//    22 published community documents.
//
// 2. **`status` is `moderationStatus`,** and unset is NOT approved. GROQ's
//    `status != "approved"` matched a null `status`, which is what all 35
//    lived experiences carry — so they were deleted, not retained, and that
//    behaviour is preserved here deliberately. The partition is done in
//    JavaScript rather than as a `not_equals` filter so the rule is explicit
//    and so nothing has to depend on how the SQL adapter treats NULL in a
//    negated comparison.
//
// 3. **One `deleteDocuments` call becomes five** — `caseStudyDrafts` plus the
//    four submittable collections. Payload's bulk delete is all-or-nothing
//    within one collection; across collections it cannot be. So every batch is
//    attempted, failures are collected, and the aggregate throws naming the
//    collections that survived. `deleteUserData` calls this BEFORE the Prisma
//    delete and does not catch it, so a partial failure leaves the account
//    intact and the erasure re-runnable — it is idempotent: a retry re-reads
//    and finds only what is left.
//
// What this arm does NOT do, and why: for a document that IS retained
// (published and approved) but carries an unpublished newer version, Sanity
// would additionally have deleted the `drafts.` sibling. Payload has no
// supported way to delete a document's draft VERSIONS while keeping the
// document — `payload.db.deleteVersions` takes a parent id and would remove the
// published versions with it, and there is no supported way to re-point the
// `latest` flag afterwards. It is left in place and logged rather than silently
// ignored. It is defensible: the version is an unpublished edit OF retained
// content, whose personal data (`submittedBy`) the retention decision has
// already accepted on the published parent. Recorded for Phase 4.

/** The module's own name, as `CONTENT_BACKEND_ACCOUNT_DELETION` spells it. */
const ACCOUNT_DELETION_DOMAIN = "account-deletion"

const onPayload = (): boolean => activeBackend(ACCOUNT_DELETION_DOMAIN) === "payload"

/** Sanity's `caseStudyDraft`, keyed by `userId` rather than `submittedBy`. */
const PAYLOAD_DRAFT_COLLECTION = "caseStudyDrafts" satisfies CollectionSlug

/** `SUBMITTABLE_TYPES`, as Payload collection slugs. Four, not one. */
const PAYLOAD_SUBMITTABLE_COLLECTIONS = [
  "caseStudies",
  "livedExperiences",
  "researchOutputs",
  "events",
] satisfies CollectionSlug[]

/** The fields the partition reads. Everything else is irrelevant to erasure. */
interface ErasableRow {
  id: string | number
  /** Absent on a collection without `versions.drafts` (researchOutputs, events). */
  _status?: string | null
  moderationStatus?: string | null
}

/**
 * The retention rule, in one place: an approved submission is kept.
 *
 * Applied only to rows that came back from the PUBLISHED read, so "published"
 * is already established by the primitive and this only has to decide
 * "approved". Unset is not approved — `status != "approved"` matched a null
 * `status` in GROQ, and 35 lived experiences depend on that reading.
 */
function isApproved(row: ErasableRow): boolean {
  return row.moderationStatus === "approved"
}

/** One collection's worth of erasure, as ids. */
interface DeleteBatch {
  collection: CollectionSlug
  ids: string[]
}

async function payloadIds(
  collection: CollectionSlug,
  where: Where,
): Promise<ErasableRow[]> {
  const { docs } = await payloadQueryRaw<{ docs: ErasableRow[] }>({
    type: "find",
    collection,
    where,
    pagination: false,
    depth: 0,
  })
  return docs
}

/**
 * Run every batch, then report. Deliberately not `Promise.all` and deliberately
 * not fail-fast: a GDPR erasure should remove as much as it can, and then say
 * loudly what it could not, rather than stopping at the first failure and
 * leaving more behind than it had to.
 */
async function runDeleteBatches(batches: DeleteBatch[]): Promise<void> {
  const failures: string[] = []
  for (const batch of batches) {
    if (batch.ids.length === 0) continue
    try {
      await payloadDeleteDocuments({ collection: batch.collection, ids: batch.ids })
    } catch (err) {
      failures.push(`${batch.collection} (${batch.ids.length} documents): ${
        err instanceof Error ? err.message : String(err)
      }`)
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `Account erasure incomplete — ${failures.join("; ")}. ` +
        `Erasure is idempotent: retrying re-reads and clears whatever remains.`,
    )
  }
}

/** Payload-side erasure. Same contract as the Sanity arm above it. */
async function erasePayloadContent(clerkUserId: string): Promise<ErasureCounts> {
  // Drafts: a collection of their own (`caseStudyDrafts`, no versions), keyed
  // by `userId`, not `submittedBy`. Always deleted — private, never public.
  const draftRows = await payloadIds(PAYLOAD_DRAFT_COLLECTION, {
    userId: { equals: clerkUserId },
  })
  const batches: DeleteBatch[] = [
    { collection: PAYLOAD_DRAFT_COLLECTION, ids: draftRows.map((d) => String(d.id)) },
  ]

  let submissionsDeleted = 0
  let publishedRetained = 0
  const unerasableEdits: string[] = []

  for (const collection of PAYLOAD_SUBMITTABLE_COLLECTIONS) {
    const where = { submittedBy: { equals: clerkUserId } }

    // Two reads, two questions. See the header note above.
    const authored = await payloadIds(collection, where)
    const { docs: published } = await payloadQueryLive<{ docs: ErasableRow[] }>({
      type: "find",
      collection,
      where,
      pagination: false,
      depth: 0,
    })

    const retained = new Set(published.filter(isApproved).map((d) => String(d.id)))
    publishedRetained += retained.size

    const ids = authored.map((d) => String(d.id)).filter((id) => !retained.has(id))
    submissionsDeleted += ids.length
    batches.push({ collection, ids })

    // A retained document whose newest revision is an unpublished edit. Named
    // rather than dropped silently — see the header note.
    for (const row of authored) {
      const id = String(row.id)
      if (retained.has(id) && row._status === "draft") unerasableEdits.push(`${collection}/${id}`)
    }
  }

  await runDeleteBatches(batches)

  if (unerasableEdits.length > 0) {
    console.warn(
      `[account-deletion] ${unerasableEdits.length} unpublished edit(s) remain on RETAINED approved ` +
        `submissions for ${clerkUserId}; Payload cannot delete a draft version without its document. ` +
        `Clear by hand if required: ${unerasableEdits.join(", ")}`,
    )
  }

  return {
    draftsDeleted: batches[0].ids.length,
    submissionsDeleted,
    publishedRetained,
  }
}

/** CMS-side erasure of the user's PRIVATE authored content (drafts +
 *  non-approved submissions). Published, approved submissions are retained
 *  untouched. Still named `...Sanity...` because its other caller lives in
 *  `app/api/webhooks/clerk/route.ts`, which this phase does not touch. */
export async function eraseUserSanityContent(clerkUserId: string): Promise<ErasureCounts> {
  if (onPayload()) return erasePayloadContent(clerkUserId)

  // Drafts: always delete (private, never public).
  const draftIds = await queryRaw<string[]>(
    `*[_type == "caseStudyDraft" && userId == $uid]._id`,
    { uid: clerkUserId }
  )

  // Non-approved submissions across every submittable doc type: delete
  // (private, in-review). The same retain-when-published policy applies to all
  // of them — livedExperience/researchOutput/event carry submittedBy exactly
  // like caseStudy does.
  const SUBMITTABLE_TYPES = ["caseStudy", "livedExperience", "researchOutput", "event"]
  const submissionIds = await queryRaw<string[]>(
    `*[_type in $types && submittedBy == $uid && status != "approved"]._id`,
    { uid: clerkUserId, types: SUBMITTABLE_TYPES }
  )

  // Approved (published) docs: retained as-is — counted only for the
  // audit trail / so the UI can tell the user to email the team about them.
  const publishedCount = await queryRaw<number>(
    `count(*[_type in $types && submittedBy == $uid && status == "approved"])`,
    { uid: clerkUserId, types: SUBMITTABLE_TYPES }
  )

  await deleteDocuments([...draftIds, ...submissionIds])

  return {
    draftsDeleted: draftIds.length,
    submissionsDeleted: submissionIds.length,
    publishedRetained: publishedCount,
  }
}

/** Full erasure of Prisma data + private Sanity content for a user. Does NOT
 *  delete the Clerk user — the caller does that last so a failure here can be
 *  retried safely. Published case studies are intentionally left untouched. */
/**
 * Before deleting a user, protect collaborations they solely own: deleting the
 * sole OWNER would cascade-delete every member's work. We transfer ownership to
 * the longest-standing other member where possible, otherwise archive the
 * workspace (preserving its content) rather than let it be orphaned/wiped.
 */
async function handleSoleOwnedCollaborations(userId: string): Promise<void> {
  const owned = await prisma.collaborationMember.findMany({
    where: { userId, role: "OWNER" },
    select: { collaborationId: true },
  })
  for (const { collaborationId } of owned) {
    const owners = await prisma.collaborationMember.count({
      where: { collaborationId, role: "OWNER" },
    })
    if (owners > 1) continue // another owner remains; cascade is safe

    // Find the next member to promote (oldest non-owner member).
    const heir = await prisma.collaborationMember.findFirst({
      where: { collaborationId, userId: { not: userId } },
      orderBy: { joinedAt: "asc" },
      select: { userId: true },
    })
    if (heir) {
      await prisma.collaborationMember.update({
        where: { collaborationId_userId: { collaborationId, userId: heir.userId } },
        data: { role: "OWNER" },
      })
      // The creator column is SET NULL on delete; point it at the heir so the
      // public project page keeps naming a real lead.
      await prisma.collaboration.update({
        where: { id: collaborationId },
        data: { createdById: heir.userId },
      })
    } else {
      // No one else to inherit — archive so content isn't lost on cascade.
      await prisma.collaboration.update({
        where: { id: collaborationId },
        data: { status: "ARCHIVED" },
      })
    }
  }
}

/**
 * Delete the user's uploaded collaboration files from R2 (Prisma cascade can't
 * reach object storage). Must run BEFORE the user-delete cascade removes the
 * CollaborationFile rows. No-op when R2 isn't configured.
 */
async function sweepUserR2Files(userId: string): Promise<void> {
  if (!r2Configured()) return
  const files = await prisma.collaborationFile.findMany({
    where: { uploadedById: userId },
    select: { r2Key: true },
  })
  for (const f of files) {
    await deleteObject(f.r2Key)
  }
}

/** Remove the user's contact from the Resend newsletter audience. The
 *  subscription was keyed by email, so it must go before the Prisma row
 *  (our last record of that email) is deleted. Best-effort: the contact may
 *  never have subscribed. */
async function eraseFromResendAudience(email: string | null | undefined): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!apiKey || !audienceId || !email) return
  try {
    const { Resend } = await import("resend")
    await new Resend(apiKey).contacts.remove({ email, audienceId })
  } catch (err) {
    console.warn(`Resend contact erasure failed:`, err)
  }
}

/** Remove the user's record from the Algolia search index — the same
 *  write-prefixed index every user-record WRITE targets (`writeIndexName`),
 *  so a verification run with `ALGOLIA_INDEX_PREFIX` set erases from its
 *  scratch index and not from the live one. Unprefixed in production. */
async function eraseUserFromAlgolia(userId: string): Promise<void> {
  if (!algoliaClient) return
  try {
    await algoliaClient.deleteObject({ indexName: writeIndexName(ALGOLIA_INDICES.USERS), objectID: userId })
  } catch (err) {
    console.warn(`Algolia erasure failed for ${userId}:`, err)
  }
}

export async function deleteUserData(clerkUserId: string): Promise<DeletionResult> {
  // Grab the email before anything deletes the row that holds it.
  const user = await prisma.user
    .findUnique({ where: { id: clerkUserId }, select: { email: true } })
    .catch(() => null)

  const sanity = await eraseUserSanityContent(clerkUserId)

  await eraseFromResendAudience(user?.email)

  // Protect multi-person workspaces before the user-delete cascade runs.
  try {
    await handleSoleOwnedCollaborations(clerkUserId)
  } catch (err) {
    console.warn(`Sole-owner collaboration handling failed for ${clerkUserId}:`, err)
  }

  // Sweep R2 objects + the Algolia record (neither is reachable by the Prisma
  // cascade). R2 must run before the cascade deletes the file rows.
  try {
    await sweepUserR2Files(clerkUserId)
  } catch (err) {
    console.warn(`R2 file sweep failed for ${clerkUserId}:`, err)
  }
  await eraseUserFromAlgolia(clerkUserId)

  // Note: messages, conversation participations, notifications, blocks, mentions,
  // reactions, comments and collaboration memberships all cascade from User
  // (onDelete: Cascade). After the user-delete below we sweep conversations that
  // are left with no participants (fully-orphaned DMs).

  // Prisma row may not exist (e.g. user never finished onboarding) — that's fine.
  let prismaDeleted = false
  try {
    await prisma.user.delete({ where: { id: clerkUserId } })
    prismaDeleted = true
  } catch (err) {
    // P2025 = record not found; anything else is a real failure.
    if ((err as { code?: string })?.code !== "P2025") throw err
  }

  // Sweep conversations left with no participants (both sides deleted).
  try {
    await prisma.conversation.deleteMany({ where: { participants: { none: {} } } })
  } catch (err) {
    console.warn("Orphan-conversation sweep failed:", err)
  }

  return { prismaDeleted, ...sanity }
}
