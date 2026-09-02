import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the content-layer seam (not @/sanity/lib/write-client directly —
// account-deletion.ts no longer imports Sanity at all, only the seam) before
// importing the module under test.
const queryRawMock = vi.fn()
const deleteDocumentsMock = vi.fn()

vi.mock('@/lib/content/internal/sanity-source', () => ({
  queryRaw: (...args: unknown[]) => queryRawMock(...args),
  deleteDocuments: (...args: unknown[]) => deleteDocumentsMock(...args),
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

beforeEach(() => {
  vi.clearAllMocks()
  deleteDocumentsMock.mockResolvedValue(undefined)
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
