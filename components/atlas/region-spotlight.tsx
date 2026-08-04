'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'

import geometry from '@/components/maps/region-geometry-soft.json'
import { RegionContentCards } from '@/components/atlas/region-content-cards'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { facetShares } from '@/lib/maps/facet-shares'
import { parseD } from '@/lib/maps/smooth-geometry'
import { REGION_TO_RC_SLUG, type RegionCode } from '@/lib/maps/region-codes'
import { atlasDestination, type FacetId } from '@/lib/maps/region-facets'
import type { RegionArt } from '@/lib/maps/region-art'
import { CCM, COLOR } from '@/lib/ccm-colors'
import { cn } from '@/lib/utils'

/** Facet → the atlas layer swatch (same colours as pins, legend, popover). */
const FACET_TO_LAYER_KEY: Partial<Record<FacetId, keyof typeof COLOR.layer>> = {
  caseStudyCount: 'cases',
  livedExpCount: 'lived',
  newsCount: 'projects',
  researchOutputCount: 'projects',
  memberCount: 'people',
}

function facetColor(id: FacetId): string {
  return COLOR.layer[FACET_TO_LAYER_KEY[id] ?? 'projects']
}

/** The selected region's silhouette, viewBox-fitted from its own path data —
 *  the no-art banner's watermark. Memoized: parsing runs once per region. */
function useSilhouette(region: RegionCode) {
  return useMemo(() => {
    const d = (geometry.regions as Record<string, { d: string }>)[region]?.d
    if (!d) return null
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity
    for (const ring of parseD(d)) {
      for (const [x, y] of ring) {
        if (x < minx) minx = x
        if (x > maxx) maxx = x
        if (y < miny) miny = y
        if (y > maxy) maxy = y
      }
    }
    const pad = Math.max(maxx - minx, maxy - miny) * 0.06
    return {
      d,
      viewBox: `${(minx - pad).toFixed(1)} ${(miny - pad).toFixed(1)} ${(maxx - minx + pad * 2).toFixed(1)} ${(maxy - miny + pad * 2).toFixed(1)}`,
    }
  }, [region])
}

/**
 * Regional spotlight (mock v6 §3, Slice 4): what selecting a region opens.
 * Artwork banner (the community page's welcome-hero image under a midnight
 * scrim; silhouette-watermark gradient when a region has no art), the
 * facet-composition bar, country chips (any mode — no longer locked-embed
 * only), the region's content cards, and a CTA row that includes the
 * community page itself.
 */
export function RegionSpotlight({
  region,
  label,
  total,
  byFacet,
  layers,
  art,
  countries,
  facetLabel,
  destinationHref,
  singleFacet,
  singleCardFacet,
  cardFacetsQS,
  theme,
  q,
  when,
  facetLabelFor,
  compact = false,
}: {
  region: RegionCode
  label: string
  total: number
  byFacet: Partial<Record<FacetId, number>>
  layers: FacetId[]
  art?: RegionArt | null
  countries?: Array<{ countryCode3: string; count: number; name?: string }>
  facetLabel: string
  destinationHref?: string | null
  singleFacet: boolean
  singleCardFacet?: FacetId | null
  cardFacetsQS?: string | null
  theme?: string | null
  q?: string
  when?: string | null
  facetLabelFor: (id: FacetId) => string
  /** Locked-embed variant (regional community pages): the page's own hero
   *  already carries the region's name + artwork, so the spotlight drops its
   *  banner and the self-referential "Visit the community page" CTA and keeps
   *  only the live facet content — composition bar, countries, cards, and the
   *  atlas deep-link. */
  compact?: boolean
}) {
  const tAtlas = useTranslations('atlas')
  const silhouette = useSilhouette(region)
  const shares = facetShares(byFacet, layers)
  const communityHref = `/communities/${REGION_TO_RC_SLUG[region]}`

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      {compact ? (
        /* Compact header (locked embeds): one slim row — the page hero above
           already owns the region's name+artwork moment. */
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b px-4 pb-3 pt-4 sm:px-5">
          <p className="font-heading text-[10.5px] font-bold uppercase tracking-[0.13em] text-[var(--color-ccm-slate,#8595AC)]">
            {tAtlas('regionalSpotlight')}
          </p>
          <span className="rounded-full bg-[var(--color-ccm-sky)]/25 px-3 py-1 font-heading text-xs font-bold tabular-nums text-ccm-midnight">
            {tAtlas('inThisView', { count: total })}
          </span>
        </div>
      ) : (
      /* Banner: region artwork under a to-top midnight scrim; a region with
         no art gets the sea→midnight gradient with its own map silhouette as
         a watermark (mock v6 §3 fallback rule). */
      <div className="relative h-[132px] sm:h-[150px]" style={{ backgroundColor: CCM.midnight }}>
        {art ? (
          <Image
            src={art.url}
            alt=""
            fill
            sizes="(min-width: 1152px) 1120px, 100vw"
            // The artwork centres its gold region vertically — a slightly
            // below-centre crop keeps the gold in this thin banner instead of
            // the empty ocean along the artwork's top edge.
            className="object-cover object-[center_55%]"
            placeholder={art.lqip ? 'blur' : undefined}
            blurDataURL={art.lqip ?? undefined}
          />
        ) : (
          <>
            <div
              aria-hidden
              className="absolute inset-0"
              style={{ background: `linear-gradient(120deg, ${CCM.sea}, ${CCM.midnight})` }}
            />
            {silhouette && (
              <svg
                viewBox={silhouette.viewBox}
                aria-hidden="true"
                className="absolute inset-y-2 end-4 h-[calc(100%-16px)] w-auto opacity-20"
              >
                <path d={silhouette.d} fill="white" />
              </svg>
            )}
          </>
        )}
        {/* Scrim carries the text on ANY art — including near-white artwork,
            so it runs deeper than a typical caption gradient. */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,49,96,0.92)] via-[rgba(11,49,96,0.38)] via-55% to-[rgba(11,49,96,0.05)]" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 p-4 sm:px-5">
          <div className="min-w-0">
            <p className="font-heading text-[10.5px] font-bold uppercase tracking-[0.13em] text-[var(--color-ccm-secondary,#90E0F4)]">
              {tAtlas('regionalSpotlight')}
            </p>
            <h2 className="truncate font-heading text-xl font-bold text-white sm:text-2xl">{label}</h2>
          </div>
          <span className="ms-auto self-end rounded-full bg-white/95 px-3 py-1 font-heading text-xs font-bold tabular-nums text-ccm-midnight">
            {tAtlas('inThisView', { count: total })}
          </span>
        </div>
      </div>
      )}

      <div className="space-y-4 p-4 sm:p-5">
        {/* Composition bar: each active layer's share in its exact layer
            colour — the same swatches as the pins and legend. */}
        {shares.length > 0 && (
          <div className="space-y-2">
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" role="img"
              aria-label={shares.map((s) => `${facetLabelFor(s.id)}: ${s.count}`).join(', ')}>
              {shares.map((s) => (
                <span
                  key={s.id}
                  className="block h-full rounded-[2px]"
                  style={{ width: `${(s.share * 100).toFixed(2)}%`, backgroundColor: facetColor(s.id) }}
                />
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {shares.map((s) => (
                <li key={s.id} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ccm-midnight">
                  <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: facetColor(s.id) }} />
                  {facetLabelFor(s.id)}
                  <span className="tabular-nums text-[var(--color-ccm-sea)]">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Country chips — available in EVERY mode now (the pins route always
            computes them; only the display used to be locked-embed-gated). */}
        {countries && countries.length > 0 && (
          <div className="space-y-1.5">
            <span className="font-heading text-[10px] font-bold uppercase tracking-[0.11em] text-[var(--color-ccm-slate,#8595AC)]">
              {tAtlas('countryBreakdown')}
            </span>
            <ul className="flex flex-wrap gap-1.5">
              {countries.slice(0, 8).map((c) => (
                <li key={c.countryCode3} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-sm font-medium">
                  {c.name ?? c.countryCode3}
                  <span aria-hidden className="text-xs tabular-nums text-muted-foreground">{c.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* The region's actual content. */}
        {total > 0 ? (
          <>
            {singleFacet && singleCardFacet && (
              <RegionContentCards region={region} facet={singleCardFacet} theme={theme} q={q} when={when} />
            )}
            {!singleFacet && cardFacetsQS && (
              <RegionContentCards region={region} facet={cardFacetsQS} theme={theme} q={q} when={when} />
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{tAtlas('empty', { layer: facetLabel })}</p>
        )}

        {/* CTA row: explore the listing (when a single facet gives one clear
            destination) + the community page itself. */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {singleFacet && destinationHref && total > 0 && (
            <Button asChild size="sm">
              <Link href={destinationHref}>
                {tAtlas('explore', { region: label })}
                <ArrowRight className="size-4 rtl:-scale-x-100" />
              </Link>
            </Button>
          )}
          {/* On the community page itself (compact) this link would point at
              the page you're already on — dropped there. */}
          {!compact && (
            <Button asChild size="sm" variant="outline">
              <Link href={communityHref}>
                {tAtlas('visitCommunity')}
                <ArrowRight className="size-4 rtl:-scale-x-100" />
              </Link>
            </Button>
          )}
          {!singleFacet && (
            <ul className={cn('ms-auto flex flex-wrap gap-1.5')}>
              {layers.map((layerId) => {
                const count = byFacet[layerId] ?? 0
                const href = atlasDestination(layerId, REGION_TO_RC_SLUG[region])
                return (
                  <li key={layerId}>
                    <Link
                      href={href}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-sm font-medium text-ccm-midnight transition-colors hover:border-[var(--color-ccm-sea)]/40 hover:bg-muted"
                    >
                      {facetLabelFor(layerId)}
                      <span className="text-xs font-semibold tabular-nums text-[var(--color-ccm-sea)]">{count}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
