import { describe, it, expect, vi, beforeEach } from 'vitest'

const sendMock = vi.fn().mockResolvedValue({ id: 'email_1' })
vi.mock('resend', () => ({
  // Must be `new`-able — use a real class so `new Resend()` works.
  Resend: class {
    emails = { send: (...a: any[]) => sendMock(...a) }
  },
}))

const prismaFindUnique = vi.fn()
vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: (...a: any[]) => prismaFindUnique(...a) } },
}))

const patchSet = vi.fn().mockReturnValue({ commit: vi.fn().mockResolvedValue({}) })
const patchMock = vi.fn().mockReturnValue({ set: patchSet })
vi.mock('@/sanity/lib/write-client', () => ({
  writeClient: { patch: (...a: any[]) => patchMock(...a) },
}))

import { isNotifiableStatus, notifyCaseStudyStatusChange } from '@/lib/case-study-emails'

const base = {
  caseStudyId: 'cs1',
  status: 'approved',
  submittedBy: 'user_1',
  title: 'My Study',
  siteUrl: 'https://example.org',
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.RESEND_API_KEY = 'test_key'
  prismaFindUnique.mockResolvedValue({ email: 'submitter@example.org' })
})

describe('isNotifiableStatus', () => {
  it('accepts approved/rejected/revision only', () => {
    expect(isNotifiableStatus('approved')).toBe(true)
    expect(isNotifiableStatus('rejected')).toBe(true)
    expect(isNotifiableStatus('revision')).toBe(true)
    expect(isNotifiableStatus('pending')).toBe(false)
    expect(isNotifiableStatus(undefined)).toBe(false)
  })
})

describe('notifyCaseStudyStatusChange — idempotency & guards', () => {
  it('sends and records notifiedStatus on a fresh terminal status', async () => {
    const r = await notifyCaseStudyStatusChange(base)
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(patchMock).toHaveBeenCalledWith('cs1')
    expect(patchSet).toHaveBeenCalledWith({ notifiedStatus: 'approved' })
    expect(r).toMatch(/^sent: approved/)
  })

  it('does NOT re-send when already notified for the same status', async () => {
    const r = await notifyCaseStudyStatusChange({ ...base, notifiedStatus: 'approved' })
    expect(sendMock).not.toHaveBeenCalled()
    expect(r).toMatch(/already notified/)
  })

  it('skips non-notifiable statuses (e.g. pending)', async () => {
    const r = await notifyCaseStudyStatusChange({ ...base, status: 'pending' })
    expect(sendMock).not.toHaveBeenCalled()
    expect(r).toMatch(/not notifiable/)
  })

  it('skips when there is no submitter', async () => {
    const r = await notifyCaseStudyStatusChange({ ...base, submittedBy: undefined })
    expect(sendMock).not.toHaveBeenCalled()
    expect(r).toMatch(/no submitter/)
  })

  it('skips when the submitter has no email on file', async () => {
    prismaFindUnique.mockResolvedValue({ email: null })
    const r = await notifyCaseStudyStatusChange(base)
    expect(sendMock).not.toHaveBeenCalled()
    expect(r).toMatch(/no email/)
  })

  it('re-sends when the status changes to a different terminal value', async () => {
    const r = await notifyCaseStudyStatusChange({ ...base, status: 'revision', notifiedStatus: 'approved' })
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(patchSet).toHaveBeenCalledWith({ notifiedStatus: 'revision' })
    expect(r).toMatch(/^sent: revision/)
  })
})
