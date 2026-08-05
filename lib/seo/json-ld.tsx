/**
 * JSON-LD structured data (B7 follow-up): plain schema.org objects rendered
 * into a <script type="application/ld+json"> per detail page, so search
 * engines and answer engines can read what each page IS (Article / Person /
 * Event) instead of guessing. No schema-dts dependency — the builders below
 * are the complete vocabulary this site emits.
 */

const ORG = {
  '@type': 'Organization',
  name: 'Connecting Climate Minds',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://connectingclimateminds.org',
} as const

type JsonLdData = Record<string, unknown>

/** Renders one JSON-LD block. `<` is escaped so content can never close the
 *  script tag early (the standard XSS guard for inline JSON). */
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

/** Strips undefined/null/empty values so the emitted JSON stays clean. */
function compact(obj: JsonLdData): JsonLdData {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

/** Case studies, news posts, lived experiences, research outputs. */
export function articleJsonLd({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName,
  inLanguage,
}: {
  title: string
  description?: string
  url: string
  image?: string | null
  datePublished?: string | null
  dateModified?: string | null
  authorName?: string | null
  inLanguage?: string
}): JsonLdData {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    image: image ?? undefined,
    datePublished: datePublished ?? undefined,
    dateModified: dateModified ?? datePublished ?? undefined,
    inLanguage,
    author: authorName ? { '@type': 'Person', name: authorName } : ORG,
    publisher: ORG,
  })
}

/** Member profiles. */
export function personJsonLd({
  name,
  url,
  image,
  jobTitle,
  affiliation,
}: {
  name: string
  url: string
  image?: string | null
  jobTitle?: string | null
  affiliation?: string | null
}): JsonLdData {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url,
    image: image ?? undefined,
    jobTitle: jobTitle ?? undefined,
    affiliation: affiliation ? { '@type': 'Organization', name: affiliation } : undefined,
  })
}

/** Hub events. */
export function eventJsonLd({
  name,
  description,
  url,
  startDate,
  endDate,
  locationName,
  isOnline,
  image,
}: {
  name: string
  description?: string
  url: string
  startDate?: string | null
  endDate?: string | null
  locationName?: string | null
  isOnline?: boolean
  image?: string | null
}): JsonLdData {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    url,
    startDate: startDate ?? undefined,
    endDate: endDate ?? undefined,
    image: image ?? undefined,
    eventAttendanceMode: isOnline
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: isOnline
      ? { '@type': 'VirtualLocation', url }
      : locationName
        ? { '@type': 'Place', name: locationName }
        : undefined,
    organizer: ORG,
  })
}
