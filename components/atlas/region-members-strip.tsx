'use client'

import useSWR from 'swr'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { initials, type RegionMember } from '@/lib/community/contributions'
import { REGION_TO_RC_SLUG, type RegionCode } from '@/lib/maps/region-codes'
import { COLOR } from '@/lib/ccm-colors'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

/**
 * Members strip for the atlas spotlight — members ARE content: each card links
 * to the person's profile page (user correction 2026-08-04: "they have
 * profiles"). Same group-header grammar as the typed content cards (dot +
 * label + count + end-aligned view-all), so the Members facet reads exactly
 * like the others. View-all goes to the community page's #members section.
 */
export function RegionMembersStrip({
  region,
  label,
  viewAllLabel,
}: {
  region: RegionCode
  /** Localized facet label ("Members") — passed in so this stays namespace-free. */
  label: string
  viewAllLabel: string
}) {
  const { data, error } = useSWR<{ total: number; members: RegionMember[] }>(
    `/api/maps/region-members?region=${region}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
  if (error) return null
  const members = data?.members ?? []
  if (data && members.length === 0) return null

  const membersHref = `/communities/${REGION_TO_RC_SLUG[region]}#members`

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: COLOR.layer.people }}
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {data && (
          <span className="text-xs font-semibold tabular-nums text-[var(--color-ccm-sea)]">
            {data.total}
          </span>
        )}
        <Link
          href={membersHref}
          className="ms-auto inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-ccm-sea)] hover:underline"
        >
          {viewAllLabel}
          <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
        </Link>
      </div>
      {!data ? (
        <div className="flex gap-3 overflow-hidden pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 w-28 shrink-0 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {members.map((m) => {
            const card = (
              <span className="flex h-full flex-col items-center gap-2 rounded-lg border bg-card px-3 py-3 text-center transition-colors group-hover/member:border-[var(--color-ccm-sea)]/40 group-hover/member:bg-muted">
                {m.image ? (
                  <Image
                    src={m.image}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex size-12 items-center justify-center rounded-full font-heading text-sm font-bold text-white"
                    style={{ backgroundColor: COLOR.layer.people }}
                  >
                    {initials(m.displayName)}
                  </span>
                )}
                <span className="line-clamp-2 text-xs font-semibold text-ccm-midnight">
                  {/* bdi: Latin names inside RTL pages (and vice versa) keep
                      their own direction — same convention as the pin popover. */}
                  <bdi>{m.displayName}</bdi>
                </span>
              </span>
            )
            return (
              <li key={m.id} className="group/member w-28 shrink-0 snap-start">
                {m.username ? (
                  <Link href={`/profiles/${m.username}`} className="block h-full">
                    {card}
                  </Link>
                ) : (
                  card
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
