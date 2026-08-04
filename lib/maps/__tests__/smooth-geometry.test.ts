import { describe, expect, it } from 'vitest'
import {
  bandPath,
  chaikin,
  dilate,
  parseD,
  rdpRing,
  ringArea,
  serializeD,
  smoothPath,
  type Ring,
} from '../smooth-geometry'

const square = (x: number, y: number, s: number): Ring => [
  [x, y],
  [x + s, y],
  [x + s, y + s],
  [x, y + s],
]

describe('parseD / serializeD', () => {
  it('round-trips M/L/Z multi-ring path data', () => {
    const d = 'M0,0L10,0L10,10L0,10ZM20,20L24,20L24,24Z'
    const rings = parseD(d)
    expect(rings).toHaveLength(2)
    expect(rings[0]).toHaveLength(4)
    expect(serializeD(rings)).toBe(d)
  })

  it('drops degenerate sub-paths (< 3 points)', () => {
    expect(parseD('M0,0L1,1ZM0,0L4,0L4,4Z')).toHaveLength(1)
  })
})

describe('ringArea', () => {
  it('computes the shoelace area', () => {
    expect(Math.abs(ringArea(square(0, 0, 10)))).toBe(100)
  })
})

describe('rdpRing', () => {
  it('removes collinear points but keeps corners', () => {
    const ring: Ring = [
      [0, 0], [5, 0], [10, 0], // collinear midpoint
      [10, 10], [0, 10],
    ]
    const out = rdpRing(ring, 0.5)
    expect(out.length).toBeLessThan(ring.length)
    // corners survive
    expect(out).toContainEqual([0, 0])
    expect(out).toContainEqual([10, 10])
  })
})

describe('chaikin', () => {
  it('doubles the point count per pass and stays inside the hull', () => {
    const out = chaikin(square(0, 0, 10))
    expect(out).toHaveLength(8)
    for (const [x, y] of out) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(10)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(10)
    }
  })
})

describe('dilate', () => {
  it('grows the ring outward around its centroid', () => {
    const out = dilate(square(0, 0, 10), 5)
    const area = Math.abs(ringArea(out))
    // Chaikin shaves corners, but a +5px dilation of a 10px square must still
    // clearly exceed the original area.
    expect(area).toBeGreaterThan(100)
  })
})

describe('smoothPath', () => {
  const big = 'M0,0L40,0L40,40L0,40Z'
  const speck = 'M100,100L102,100L102,102Z' // area 2 — under any threshold

  it('drops speck rings but never a shape\'s largest ring', () => {
    const out = smoothPath(big + speck, { minRingArea: 35 })
    expect(parseD(out)).toHaveLength(1)
    // alone, the speck IS the largest ring — it must survive
    expect(parseD(smoothPath(speck, { minRingArea: 35 }))).toHaveLength(1)
  })

  it('emits only M/L/Z commands', () => {
    const out = smoothPath(big)
    expect(out).toMatch(/^([ML]-?[\d.]+,-?[\d.]+|Z)+$/i)
  })

  it('rounds corners (no output point equals an input corner)', () => {
    const out = parseD(smoothPath(big, { rdpTolerance: 0.1 }))[0]
    expect(out).not.toContainEqual([0, 0])
    expect(out.length).toBeGreaterThan(4)
  })
})

describe('bandPath', () => {
  it('skips small rings and dilates the big ones', () => {
    const big = 'M0,0L40,0L40,40L0,40Z' // area 1600
    const small = 'M100,100L110,100L110,110L100,110Z' // area 100 < 400
    const out = bandPath([big, small], 10)
    const rings = parseD(out)
    expect(rings).toHaveLength(1)
    expect(Math.abs(ringArea(rings[0]))).toBeGreaterThan(1600)
  })
})
