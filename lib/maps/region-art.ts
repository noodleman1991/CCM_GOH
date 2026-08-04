import { groq } from 'next-sanity'
import { sanityFetch } from '@/sanity/lib/live'
import { RC_SLUG_TO_REGION, type RegionCode } from '@/lib/maps/region-codes'

export type RegionArt = { url: string; lqip: string | null }

/**
 * The Regional-spotlight banner art (mock v6 §3): each regional community
 * page's welcome-hero image, keyed by region code. Server-only; the explorer
 * threads the map down as a plain prop. A region without art (or a failed
 * fetch) simply isn't in the map — the spotlight falls back to its
 * sea→midnight gradient + silhouette watermark.
 */
export async function getRegionArt(): Promise<Partial<Record<RegionCode, RegionArt>>> {
  try {
    const { data } = await sanityFetch({
      query: groq`*[_type == "regionalCommunityPage" && defined(welcomeHero.image.asset)]{
        "slug": slug.current,
        "url": welcomeHero.image.asset->url,
        "lqip": welcomeHero.image.asset->metadata.lqip
      }`,
    })
    const art: Partial<Record<RegionCode, RegionArt>> = {}
    for (const row of (data ?? []) as { slug: string; url: string | null; lqip: string | null }[]) {
      const code = RC_SLUG_TO_REGION[row.slug]
      if (code && row.url) art[code] = { url: row.url, lqip: row.lqip }
    }
    return art
  } catch {
    return {}
  }
}
