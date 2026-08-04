/**
 * Build-time geometry smoothing for the illustration-style atlas (mock v6 §3).
 * Turns the raw projected region outlines (M/L/Z path data) into the brand's
 * blob-rounded shapes: tiny island rings drop, coastlines simplify (RDP) and
 * then round (Chaikin), and the ocean contour bands derive from the same rings
 * by centroid dilation. Pure functions — run by scripts/build-region-map.ts,
 * never in the browser.
 */

export type Ring = [number, number][]

/** Parse "M…L…Z"-only path data (1-decimal coords) into rings. Subpaths with
 *  fewer than 3 points are dropped — they can't enclose area. */
export function parseD(d: string): Ring[] {
  const rings: Ring[] = []
  for (const chunk of d.split('M').filter(Boolean)) {
    const body = chunk.replace(/Z\s*$/i, '')
    const pts = body
      .split('L')
      .map((p) => p.split(',').map(Number) as [number, number])
      .filter((p) => p.length === 2 && p.every(Number.isFinite))
    if (pts.length >= 3) rings.push(pts)
  }
  return rings
}

/** Signed shoelace area (viewBox units²). */
export function ringArea(ring: Ring): number {
  let a = 0
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[(i + 1) % ring.length]
    a += x1 * y2 - x2 * y1
  }
  return a / 2
}

function perpDist(p: [number, number], a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)
  if (len === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len
}

/** Ramer–Douglas–Peucker simplification on an open polyline. */
export function rdp(pts: Ring, tol: number): Ring {
  if (pts.length < 3) return pts
  let maxD = 0
  let idx = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], pts[0], pts[pts.length - 1])
    if (d > maxD) {
      maxD = d
      idx = i
    }
  }
  if (maxD <= tol) return [pts[0], pts[pts.length - 1]]
  const left = rdp(pts.slice(0, idx + 1), tol)
  const right = rdp(pts.slice(idx), tol)
  return left.slice(0, -1).concat(right)
}

/** RDP for a CLOSED ring: close it for the pass, then reopen. */
export function rdpRing(ring: Ring, tol: number): Ring {
  const closed = ring.concat([ring[0]])
  const out = rdp(closed, tol)
  out.pop()
  return out
}

/** One Chaikin corner-cutting pass (doubles the point count). */
export function chaikin(ring: Ring): Ring {
  const out: Ring = []
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    out.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]])
    out.push([0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]])
  }
  return out
}

export function centroid(ring: Ring): [number, number] {
  let x = 0
  let y = 0
  for (const p of ring) {
    x += p[0]
    y += p[1]
  }
  return [x / ring.length, y / ring.length]
}

/** Grow a ring ~`px` outward by scaling around its centroid, then simplify
 *  hard + round twice — bands are decorative and want the FLOWIEST line of
 *  all: coarse RDP kills coastline detail, double Chaikin melts what's left
 *  into the brand artwork's hand-drawn contour feel. */
export function dilate(ring: Ring, px: number): Ring {
  const [cx, cy] = centroid(ring)
  const rEff = Math.sqrt(Math.abs(ringArea(ring)) / Math.PI) || 1
  const k = 1 + px / rEff
  let out: Ring = ring.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k])
  out = rdp(out.concat([out[0]]), 6).slice(0, -1)
  return chaikin(chaikin(out))
}

const r1 = (n: number) => Math.round(n * 10) / 10

export function serializeD(rings: Ring[]): string {
  return rings
    .map((ring) => {
      const [h, ...rest] = ring
      return `M${r1(h[0])},${r1(h[1])}${rest.map((p) => `L${r1(p[0])},${r1(p[1])}`).join('')}Z`
    })
    .join('')
}

export type SmoothOptions = {
  /** Rings under this area drop — except a shape's largest ring, which always
   *  survives (a region can never disappear). */
  minRingArea?: number
  rdpTolerance?: number
  chaikinIterations?: number
}

/** The full pipeline for one region's path data.
 *  Defaults tuned against the brand artwork (v2 pass): a higher ring floor
 *  drops the arctic/pacific speck islands the artwork also omits, slightly
 *  coarser RDP + a THIRD Chaikin pass turn the remaining faceted corners into
 *  genuinely curved, blob-rounded coastlines. */
export function smoothPath(
  d: string,
  { minRingArea = 80, rdpTolerance = 2.2, chaikinIterations = 3 }: SmoothOptions = {}
): string {
  let rings = parseD(d)
  const areas = rings.map((r) => Math.abs(ringArea(r)))
  const maxArea = Math.max(...areas)
  rings = rings.filter((r, i) => areas[i] === maxArea || areas[i] >= minRingArea)
  rings = rings.map((r) => {
    let out = rdpRing(r, rdpTolerance)
    if (out.length < 3) out = r // never destroy a kept ring
    for (let i = 0; i < chaikinIterations; i++) out = chaikin(out)
    return out
  })
  return serializeD(rings)
}

/** Ocean contour band: every big ring across all regions, dilated by `px`.
 *  Rings smaller than `minRingArea` skip — specks don't get halos. */
export function bandPath(
  regionDs: string[],
  px: number,
  minRingArea = 400
): string {
  const rings: Ring[] = []
  for (const d of regionDs) {
    for (const ring of parseD(d)) {
      if (Math.abs(ringArea(ring)) < minRingArea) continue
      rings.push(dilate(ring, px))
    }
  }
  return serializeD(rings)
}
