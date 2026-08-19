import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Sanity write client and Prisma before importing the module under test.
const fetchMock = vi.fn()
const commitMock = vi.fn().mockResolvedValue({})
const transactionMock = vi.fn()

vi.mock('@/sanity/lib/write-client', () => ({
  writeClient: {
    fetch: (...args: unknown[]) => fetchMock(...args),
    transaction: () => transactionMock(),
  },
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

function makeChainableTx() {
  // tx.delete(id) and tx.patch(id, fn) return the tx for chaining; commit resolves.
  const tx: { delete: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; commit: typeof commitMock } = {
    delete: vi.fn(() => tx),
    patch: vi.fn(() => tx),
    commit: commitMock,
  }
  return tx
}

beforeEach(() => {
  vi.clearAllMocks()
  commitMock.mockResolvedValue({})
})

describe('eraseUserSanityContent', () => {
  it('deletes drafts and non-approved submissions, retains (counts) published', async () => {
    // fetch call order in the module: draftIds, submissionIds, publishedCount
    fetchMock
      .mockResolvedValueOnce(['draft1', 'draft2'])      // caseStudyDraft ids
      .mockResolvedValueOnce(['sub1'])                    // non-approved caseStudy ids
      .mockResolvedValueOnce(3)                           // approved count
    const tx = makeChainableTx()
    transactionMock.mockReturnValue(tx)

    const result = await eraseUserSanityContent('user_123')

    expect(result).toEqual({ draftsDeleted: 2, submissionsDeleted: 1, publishedRetained: 3 })
    // 3 private docs deleted, NOTHING patched (published left untouched)
    expect(tx.delete).toHaveBeenCalledTimes(3)
    expect(tx.patch).not.toHaveBeenCalled()
    expect(commitMock).toHaveBeenCalledTimes(1)
  })

  it('does not commit a transaction when the user has no private content', async () => {
    fetchMock
      .mockResolvedValueOnce([]) // no drafts
      .mockResolvedValueOnce([]) // no submissions
      .mockResolvedValueOnce(0)  // no published
    const tx = makeChainableTx()
    transactionMock.mockReturnValue(tx)

    const result = await eraseUserSanityContent('user_456')

    expect(result).toEqual({ draftsDeleted: 0, submissionsDeleted: 0, publishedRetained: 0 })
    expect(tx.delete).not.toHaveBeenCalled()
    expect(commitMock).not.toHaveBeenCalled()
  })

  it('never deletes or patches published case studies', async () => {
    fetchMock
      .mockResolvedValueOnce([])  // drafts
      .mockResolvedValueOnce([])  // non-approved
      .mockResolvedValueOnce(5)   // 5 published — retained
    const tx = makeChainableTx()
    transactionMock.mockReturnValue(tx)

    const result = await eraseUserSanityContent('user_789')

    expect(result.publishedRetained).toBe(5)
    expect(tx.delete).not.toHaveBeenCalled()
    expect(tx.patch).not.toHaveBeenCalled()
  })
})

describe('deleteUserData', () => {
  it('erases Sanity content and deletes the Prisma user', async () => {
    fetchMock
      .mockResolvedValueOnce(['d1'])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(1)
    transactionMock.mockReturnValue(makeChainableTx())
    prismaUserDelete.mockResolvedValueOnce({})

    const result = await deleteUserData('user_1')

    expect(prismaUserDelete).toHaveBeenCalledWith({ where: { id: 'user_1' } })
    expect(result.prismaDeleted).toBe(true)
    expect(result.publishedRetained).toBe(1)
  })

  it('tolerates a missing Prisma row (P2025) without throwing', async () => {
    fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce(0)
    transactionMock.mockReturnValue(makeChainableTx())
    prismaUserDelete.mockRejectedValueOnce({ code: 'P2025' })

    const result = await deleteUserData('ghost_user')

    expect(result.prismaDeleted).toBe(false)
  })

  it('rethrows unexpected Prisma errors', async () => {
    fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce(0)
    transactionMock.mockReturnValue(makeChainableTx())
    prismaUserDelete.mockRejectedValueOnce({ code: 'P1001', message: 'db down' })

    await expect(deleteUserData('user_x')).rejects.toMatchObject({ code: 'P1001' })
  })
})
