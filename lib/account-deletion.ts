import { prisma } from "@/lib/prisma"
import { writeClient } from "@/sanity/lib/write-client"

/**
 * GDPR account erasure.
 *
 * Performs a complete, synchronous deletion of a user's account data so the
 * "right to erasure" is honoured immediately rather than relying on the
 * (eventually-consistent, best-effort) Clerk webhook:
 *
 *  1. Prisma: delete the User row. RecentWork and UserCommunity cascade
 *     (onDelete: Cascade in schema.prisma), so all relational personal data goes.
 *  2. Sanity: the user authors caseStudy / caseStudyDraft documents keyed by
 *     `submittedBy == clerkUserId`.
 *       - Drafts and non-approved submissions: deleted outright (private, not
 *         public, no reason to retain).
 *       - Approved (published) case studies: LEFT AS-IS. They are published
 *         community content; we do not alter them on account deletion. The user
 *         is told in the UI to contact the Connecting Climate Minds Hub team by
 *         email if they want a published case study changed or removed.
 *  3. Clerk: delete the auth user (done by the caller after this returns, so a
 *     Sanity/Prisma failure doesn't leave a deleted Clerk user with orphaned data).
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

/** Sanity-side erasure of the user's PRIVATE authored content (drafts +
 *  non-approved submissions). Published case studies are retained untouched. */
export async function eraseUserSanityContent(clerkUserId: string): Promise<{
  draftsDeleted: number
  submissionsDeleted: number
  publishedRetained: number
}> {
  // Drafts: always delete (private, never public).
  const draftIds: string[] = await writeClient.fetch(
    `*[_type == "caseStudyDraft" && userId == $uid]._id`,
    { uid: clerkUserId }
  )

  // Non-approved submissions: delete (private, in-review).
  const submissionIds: string[] = await writeClient.fetch(
    `*[_type == "caseStudy" && submittedBy == $uid && status != "approved"]._id`,
    { uid: clerkUserId }
  )

  // Approved (published) case studies: retained as-is — counted only for the
  // audit trail / so the UI can tell the user to email the team about them.
  const publishedCount: number = await writeClient.fetch(
    `count(*[_type == "caseStudy" && submittedBy == $uid && status == "approved"])`,
    { uid: clerkUserId }
  )

  let tx = writeClient.transaction()
  for (const id of [...draftIds, ...submissionIds]) {
    tx = tx.delete(id)
  }
  if (draftIds.length + submissionIds.length > 0) {
    await tx.commit({ visibility: "async" })
  }

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
    } else {
      // No one else to inherit — archive so content isn't lost on cascade.
      await prisma.collaboration.update({
        where: { id: collaborationId },
        data: { status: "ARCHIVED" },
      })
    }
  }
}

export async function deleteUserData(clerkUserId: string): Promise<DeletionResult> {
  const sanity = await eraseUserSanityContent(clerkUserId)

  // Protect multi-person workspaces before the user-delete cascade runs.
  try {
    await handleSoleOwnedCollaborations(clerkUserId)
  } catch (err) {
    console.warn(`Sole-owner collaboration handling failed for ${clerkUserId}:`, err)
  }

  // Prisma row may not exist (e.g. user never finished onboarding) — that's fine.
  let prismaDeleted = false
  try {
    await prisma.user.delete({ where: { id: clerkUserId } })
    prismaDeleted = true
  } catch (err: any) {
    // P2025 = record not found; anything else is a real failure.
    if (err?.code !== "P2025") throw err
  }

  return { prismaDeleted, ...sanity }
}
