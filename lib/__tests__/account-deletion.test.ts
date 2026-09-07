import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the content-layer seam (not @/sanity/lib/write-client directly —
// account-deletion.ts no longer imports Sanity at all, only the seam) before
// importing the module under test.
const queryRawMock = vi.fn()
const deleteDocumentsMock = vi.fn()

vi.mock('@/lib/content/internal/sanity-source', () => ({
  queryRaw: (...args: unknown[]) => queryRawMock(...args),
  deleteDocuments: (...args: unknown[]) => deleteDocumentsMock(...args),
}))

// The Payload half of the seam. Mocked at the SOURCE, never at the reader, so
// the real branch inside account-deletion.ts runs and the primitive it chooses
// is observable.
const payloadQueryMock = vi.fn()
const payloadQueryRawMock = vi.fn()
const payloadQueryLiveMock = vi.fn()
const payloadDeleteDocumentsMock = vi.fn()

vi.mock('@/lib/content/internal/payload-source', () => ({
  query: (...args: unknown[]) => payloadQueryMock(...args),
  queryRaw: (...args: unknown[]) => payloadQueryRawMock(...args),
  queryLive: (...args: unknown[]) => payloadQueryLiveMock(...args),
  deleteDocuments: (...args: unknown[]) => payloadDeleteDocumentsMock(...args),
}))

const prismaUserDelete = vi.fn()
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      delete: (...a: unknown[]) => prismaUserDelete(...a),
      findUnique: vi.fn(async () => ({ email: 'user@example.com' })),
    },
    notificationPreference: { findUnique: vi.fn(async () => null) },
    // Collaboration sole-owner handling + R2 file sweep + orphan-conversation sweep.
    collaborationMember: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0), update: vi.fn() },
    collaboration: { update: vi.fn() },
    collaborationFile: { findMany: vi.fn(async () => []) },
    conversation: { deleteMany: vi.fn(async () => ({ count: 0 })) },
  },
}))

// R2 + Algolia are server-only / external — mock so the module graph loads.
vi.mock('@/lib/r2', () => ({
  r2Configured: () => false,
  deleteObject: vi.fn(),
}))
vi.mock('@/lib/algolia', () => ({
  algoliaClient: null,
  ALGOLIA_INDICES: { USERS: 'users' },
}))

import { eraseUserSanityContent, deleteUserData } from '@/lib/account-deletion'

/** Cleared per test, so these assert the module's default, not the ambient env. */
const BACKEND_FLAGS = ['CONTENT_BACKEND', 'CONTENT_BACKEND_ACCOUNT_DELETION'] as const
let ambientFlags: Record<string, string | undefined> = {}

beforeEach(() => {
  vi.clearAllMocks()
  ambientFlags = Object.fromEntries(BACKEND_FLAGS.map((f) => [f, process.env[f]]))
  for (const flag of BACKEND_FLAGS) delete process.env[flag]
  deleteDocumentsMock.mockResolvedValue(undefined)
})

afterEach(() => {
  for (const flag of BACKEND_FLAGS) {
    if (ambientFlags[flag] === undefined) delete process.env[flag]
    else process.env[flag] = ambientFlags[flag]
  }
})

describe('eraseUserSanityContent', () => {
  it('deletes drafts and non-approved submissions, retains (counts) published', async () => {
    // queryRaw call order in the module: draftIds, submissionIds, publishedCount
    queryRawMock
      .mockResolvedValueOnce(['draft1', 'draft2'])      // caseStudyDraft ids
      .mockResolvedValueOnce(['sub1'])                    // non-approved caseStudy ids
      .mockResolvedValueOnce(3)                           // approved count

    const result = await eraseUserSanityContent('user_123')

    expect(result).toEqual({ draftsDeleted: 2, submissionsDeleted: 1, publishedRetained: 3 })
    // The 3 private docs (2 drafts + 1 submission) go into a single batch delete.
    expect(deleteDocumentsMock).toHaveBeenCalledWith(['draft1', 'draft2', 'sub1'])
    expect(deleteDocumentsMock).toHaveBeenCalledTimes(1)
  })

  it('still calls deleteDocuments with an empty batch when the user has no private content', async () => {
    queryRawMock
      .mockResolvedValueOnce([]) // no drafts
      .mockResolvedValueOnce([]) // no submissions
      .mockResolvedValueOnce(0)  // no published

    const result = await eraseUserSanityContent('user_456')

    expect(result).toEqual({ draftsDeleted: 0, submissionsDeleted: 0, publishedRetained: 0 })
    expect(deleteDocumentsMock).toHaveBeenCalledWith([])
  })

  it('never includes published case studies in the delete batch', async () => {
    queryRawMock
      .mockResolvedValueOnce([])  // drafts
      .mockResolvedValueOnce([])  // non-approved
      .mockResolvedValueOnce(5)   // 5 published — retained

    const result = await eraseUserSanityContent('user_789')

    expect(result.publishedRetained).toBe(5)
    expect(deleteDocumentsMock).toHaveBeenCalledWith([])
  })

  it('propagates a deleteDocuments failure instead of swallowing it', async () => {
    queryRawMock
      .mockResolvedValueOnce(['draft1'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(0)
    deleteDocumentsMock.mockRejectedValueOnce(new Error('Sanity transaction failed'))

    await expect(eraseUserSanityContent('user_err')).rejects.toThrow('Sanity transaction failed')
  })
})

describe('deleteUserData', () => {
  it('erases Sanity content and deletes the Prisma user', async () => {
    queryRawMock
      .mockResolvedValueOnce(['d1'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(1)
    prismaUserDelete.mockResolvedValueOnce({})

    const result = await deleteUserData('user_1')

    expect(prismaUserDelete).toHaveBeenCalledWith({ where: { id: 'user_1' } })
    expect(result.prismaDeleted).toBe(true)
    expect(result.publishedRetained).toBe(1)
  })

  it('tolerates a missing Prisma row (P2025) without throwing', async () => {
    queryRawMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce(0)
    prismaUserDelete.mockRejectedValueOnce({ code: 'P2025' })

    const result = await deleteUserData('ghost_user')

    expect(result.prismaDeleted).toBe(false)
  })

  it('rethrows unexpected Prisma errors', async () => {
    queryRawMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce(0)
    prismaUserDelete.mockRejectedValueOnce({ code: 'P1001', message: 'db down' })

    await expect(deleteUserData('user_x')).rejects.toMatchObject({ code: 'P1001' })
  })

  it('does not catch a Sanity erasure failure — it propagates before Prisma delete runs', async () => {
    queryRawMock.mockRejectedValueOnce(new Error('Sanity read failed'))

    await expect(deleteUserData('user_y')).rejects.toThrow('Sanity read failed')
    expect(prismaUserDelete).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// The Payload arm
// ---------------------------------------------------------------------------
//
// The same contract, against a store that expresses drafts as VERSIONS of one
// document rather than as a separate `drafts.`-prefixed document. Two reads
// therefore replace Sanity's one, and which primitive answers which is the
// whole safety argument:
//
//   queryRaw  — every version visible, uncached. Enumerates what the user
//               authored, including documents that were never published.
//   queryLive — published-only, uncached. Decides RETENTION. Using queryRaw
//               here is the Phase-1 bypass shape: an unpublished draft saying
//               `moderationStatus: "approved"` would look retainable and
//               survive an erasure it should not have survived.
//
// This module has no rendered route, so `compareRoute` does not apply; it is
// verified here, directly, and never by performing a real deletion.

/** Payload's five collections, in the order the reader walks them. */
const DRAFTS = 'caseStudyDrafts'
const SUBMITTABLE = ['caseStudies', 'livedExperiences', 'researchOutputs', 'events']

type Row = { id: string; _status?: string; moderationStatus?: string | null }

/** Wire both Payload reads from a per-collection description of the store. */
function payloadStore(store: Record<string, Row[]>) {
  const docs = (collection: string) => store[collection] ?? []
  payloadQueryRawMock.mockImplementation(async ({ collection }: { collection: string }) => ({
    docs: docs(collection),
  }))
  payloadQueryLiveMock.mockImplementation(async ({ collection }: { collection: string }) => ({
    // What a published-only read sees: `_status` published, or a collection
    // with no drafts at all (researchOutputs, events have no `_status`).
    docs: docs(collection).filter((d) => d._status === undefined || d._status === 'published'),
  }))
}

/** Every id handed to a delete, flattened across the per-collection calls. */
function deletedIds(): string[] {
  return payloadDeleteDocumentsMock.mock.calls.flatMap(([c]) => (c as { ids: string[] }).ids)
}

describe('eraseUserSanityContent on Payload', () => {
  beforeEach(() => {
    process.env.CONTENT_BACKEND_ACCOUNT_DELETION = 'payload'
    payloadDeleteDocumentsMock.mockResolvedValue(undefined)
    payloadStore({})
  })

  it('never touches Sanity once the flag is set', async () => {
    await eraseUserSanityContent('user_1')

    expect(queryRawMock).not.toHaveBeenCalled()
    expect(deleteDocumentsMock).not.toHaveBeenCalled()
  })

  it('decides retention through the published-only primitive, never the drafts-visible one', async () => {
    payloadStore({ caseStudies: [{ id: 'cs1', _status: 'published', moderationStatus: 'approved' }] })

    await eraseUserSanityContent('user_1')

    // Both reads happen, each for its own half.
    expect(payloadQueryRawMock).toHaveBeenCalled()
    expect(payloadQueryLiveMock).toHaveBeenCalled()
    // `query` is cached an hour. A stale read driving a deletion is the one
    // thing this file must never do.
    expect(payloadQueryMock).not.toHaveBeenCalled()

    const retentionReads = payloadQueryLiveMock.mock.calls.map(([c]) => (c as { collection: string }).collection)
    expect(retentionReads).toEqual(SUBMITTABLE)
  })

  it('covers every submittable collection plus the draft collection', async () => {
    payloadStore({
      caseStudyDrafts: [{ id: 'd1' }],
      caseStudies: [{ id: 'cs1', _status: 'draft' }],
      livedExperiences: [{ id: 'le1', _status: 'draft' }],
      researchOutputs: [{ id: 'ro1' }],
      events: [{ id: 'ev1' }],
    })

    const result = await eraseUserSanityContent('user_1')

    const collections = payloadDeleteDocumentsMock.mock.calls.map(([c]) => (c as { collection: string }).collection)
    expect(collections).toEqual([DRAFTS, ...SUBMITTABLE])
    expect(result).toEqual({ draftsDeleted: 1, submissionsDeleted: 4, publishedRetained: 0 })
    expect(deletedIds()).toEqual(['d1', 'cs1', 'le1', 'ro1', 'ev1'])
  })

  it('reads drafts by `userId` and submissions by `submittedBy` — the two are different columns', async () => {
    await eraseUserSanityContent('user_42')

    const byCollection = new Map(
      payloadQueryRawMock.mock.calls.map(([c]) => [
        (c as { collection: string }).collection,
        c as { where: unknown },
      ]),
    )
    expect(byCollection.get(DRAFTS)?.where).toEqual({ userId: { equals: 'user_42' } })
    for (const collection of SUBMITTABLE) {
      expect(byCollection.get(collection)?.where).toEqual({ submittedBy: { equals: 'user_42' } })
    }
  })

  it('RETAINS a published approved submission and counts it for the audit trail', async () => {
    payloadStore({
      caseStudies: [
        { id: 'keep', _status: 'published', moderationStatus: 'approved' },
        { id: 'drop', _status: 'published', moderationStatus: 'pending' },
      ],
    })

    const result = await eraseUserSanityContent('user_1')

    expect(deletedIds()).toEqual(['drop'])
    expect(result.publishedRetained).toBe(1)
    expect(result.submissionsDeleted).toBe(1)
  })

  it('deletes a published submission whose moderationStatus is UNSET — `status != "approved"` matched null in GROQ too', async () => {
    // All 35 lived experiences carry moderationStatus null today. GROQ's
    // `status != "approved"` matched them; a reader that treated unset as
    // approved would silently stop erasing them.
    payloadStore({ livedExperiences: [{ id: 'le1', _status: 'published', moderationStatus: null }] })

    const result = await eraseUserSanityContent('user_1')

    expect(deletedIds()).toEqual(['le1'])
    expect(result.publishedRetained).toBe(0)
  })

  it('deletes a never-published submission even when its draft claims to be approved', async () => {
    // The Phase-1 bypass, inverted: a draft saying "approved" must not buy
    // retention. Only the published read decides.
    payloadStore({ caseStudies: [{ id: 'cs1', _status: 'draft', moderationStatus: 'approved' }] })

    const result = await eraseUserSanityContent('user_1')

    expect(deletedIds()).toEqual(['cs1'])
    expect(result.publishedRetained).toBe(0)
  })

  it('does NOT delete a published approved document that carries an unpublished newer version', async () => {
    // 22 real rows are exactly this shape (21 lived experiences + 1 case
    // study): `_status = published` in the main table with a `latest` DRAFT
    // version on top. A drafts-visible read reports `_status: "draft"` for
    // them, and classifying on that one read would erase published community
    // content the retention rule says to keep.
    payloadQueryRawMock.mockImplementation(async ({ collection }: { collection: string }) => ({
      docs: collection === 'livedExperiences' ? [{ id: 'le1', _status: 'draft', moderationStatus: 'pending' }] : [],
    }))
    payloadQueryLiveMock.mockImplementation(async ({ collection }: { collection: string }) => ({
      docs: collection === 'livedExperiences' ? [{ id: 'le1', _status: 'published', moderationStatus: 'approved' }] : [],
    }))

    const result = await eraseUserSanityContent('user_1')

    expect(deletedIds()).toEqual([])
    expect(result.publishedRetained).toBe(1)
    expect(result.submissionsDeleted).toBe(0)
  })

  it('makes no store round-trip for a user with nothing to erase', async () => {
    const result = await eraseUserSanityContent('ghost')

    expect(payloadDeleteDocumentsMock).not.toHaveBeenCalled()
    expect(result).toEqual({ draftsDeleted: 0, submissionsDeleted: 0, publishedRetained: 0 })
  })

  it('names the collections that failed instead of reporting a complete erasure', async () => {
    payloadStore({
      caseStudyDrafts: [{ id: 'd1' }],
      livedExperiences: [{ id: 'le1', _status: 'draft' }],
      events: [{ id: 'ev1' }],
    })
    payloadDeleteDocumentsMock.mockImplementation(async ({ collection }: { collection: string }) => {
      if (collection === 'livedExperiences') throw new Error('connection reset')
      return undefined
    })

    await expect(eraseUserSanityContent('user_1')).rejects.toThrow(/livedExperiences/)
    // The other collections were still attempted — a failure part-way through
    // must erase what it can, and the throw makes the remainder a retry, not a
    // silent success.
    const attempted = payloadDeleteDocumentsMock.mock.calls.map(([c]) => (c as { collection: string }).collection)
    expect(attempted).toEqual([DRAFTS, 'livedExperiences', 'events'])
  })

  it('propagates a failed erasure before deleteUserData reaches the Prisma delete', async () => {
    payloadQueryRawMock.mockRejectedValue(new Error('payload unreachable'))

    await expect(deleteUserData('user_y')).rejects.toThrow('payload unreachable')
    expect(prismaUserDelete).not.toHaveBeenCalled()
  })
})
