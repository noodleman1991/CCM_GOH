import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('test infra smoke', () => {
  it('resolves @ alias and runs', () => {
    expect(cn('a', 'b')).toContain('a')
  })
})
