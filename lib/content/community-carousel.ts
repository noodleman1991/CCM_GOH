import "server-only";
import { query } from "@/lib/content/internal/payload-source";
import { prisma } from "@/lib/prisma";
import { getRegionStats } from "@/lib/content/pages/regional-community";
import { getRegionFacetItems } from "@/lib/content/regions";
import { alpha3sForRegion } from "@/lib/maps/iso-to-region";
import { whenFilter } from "@/lib/maps/date-filter";
import { isRegionCode, type RegionCode } from "@/lib/maps/region-codes";
import { buildCarouselCards, type CarouselCard, type RawCommunity } from "@/lib/communities/carousel-cards";

/**
 * Every regional community's live numbers for the Community carousel
 * (regions-and-partners spec §3.3), in a handful of reads: one Prisma query
 * for all members and public faces, one Payload query for all upcoming
 * events, and the atlas's own cached readers for stories — so a card's
 * numbers match the community page and the map.
 */
type Row = Record<string, unknown>;
type Locale = "en" | "es" | "fr" | "ar";
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const idOf = (v: unknown): string | null =>
  v && typeof v === "object" ? idOf((v as Row).id) : typeof v === "number" ? String(v) : str(v);

/** Members come from a second database; if it stalls, the cards still render — without member numbers. */
const MEMBERS_TIMEOUT_MS = 4000;
function within<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      () => { clearTimeout(timer); resolve(fallback); },
    );
  });
}

const STORY_HREF: Record<string, (slug: string) => string> = {
  caseStudy: (s) => `/research-and-action/case-studies/${s}`,
  livedExperience: (s) => `/lived-experiences/${s}`,
};

export async function getCommunityCarouselCards(locale: Locale, now: Date = new Date()): Promise<CarouselCard[]> {
  const communities = (
    await query<{ docs?: Row[] }>({
      type: "find",
      collection: "regionalCommunities",
      locale,
      depth: 0,
      pagination: false,
      select: { slug: true, region: true, name: true, tagline: true, active: true } as never,
    })
  )?.docs?.filter((c) => c.active !== false && typeof c.region === "string" && isRegionCode(c.region)) ?? [];
  if (communities.length === 0) return [];

  // Whole minutes, so the cached events read is shared between visitors.
  const minute = new Date(now);
  minute.setUTCSeconds(0, 0);
  const nowIso = minute.toISOString();
  const [memberRows, events] = await Promise.all([
    within(prisma.community.findMany({
      where: { type: "REGIONAL" },
      select: {
        regionalName: true,
        _count: { select: { members: true } },
        // Faces only from profiles their owners made public.
        members: {
          where: { user: { profileVisibility: "PUBLIC" } },
          orderBy: { user: { createdAt: "desc" } },
          take: 8,
          select: { user: { select: { firstName: true, lastName: true, image: true } } },
        },
      },
    }), MEMBERS_TIMEOUT_MS, []),
    query<{ docs?: Row[] }>({
      type: "find",
      collection: "events",
      locale,
      depth: 0,
      pagination: false,
      sort: ["startAt", "id"],
      select: { slug: true, title: true, startAt: true, relatedCommunity: true } as never,
      where: {
        and: [
          { moderationStatus: { equals: "approved" } },
          { relatedCommunity: { in: communities.map((c) => String(c.id)) } },
          { or: [{ endAt: { greater_than_equal: nowIso } }, { and: [{ endAt: { exists: false } }, { startAt: { greater_than_equal: nowIso } }] }] },
        ],
      } as never,
    }),
  ]);
  const members = new Map(memberRows.map((m) => [String(m.regionalName), m]));
  const eventsBy = new Map<string, Row[]>();
  for (const e of events?.docs ?? []) {
    const id = idOf(e.relatedCommunity);
    if (id) eventsBy.set(id, [...(eventsBy.get(id) ?? []), e]);
  }

  const noWhen = whenFilter(null, now);
  const raw: RawCommunity[] = await Promise.all(
    communities.map(async (c) => {
      const code = c.region as RegionCode;
      const slug = String(c.slug ?? "");
      const params = { region: code, slug, regionCountries: alpha3sForRegion(code), theme: null, q: "", when: noWhen };
      const [counts, cases, lived] = await Promise.all([
        getRegionStats(code, slug),
        getRegionFacetItems("caseStudy", params).catch(() => []),
        getRegionFacetItems("livedExperience", params).catch(() => []),
      ]);
      const newest = [...cases.slice(0, 1).map((i) => ({ ...i, kind: "caseStudy" })), ...lived.slice(0, 1).map((i) => ({ ...i, kind: "livedExperience" }))]
        .filter((i) => i.slug)
        .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))[0];
      const m = members.get(code);
      const upcoming = eventsBy.get(String(c.id)) ?? [];
      const next = upcoming[0];
      const faces = (m?.members ?? []).map(({ user }) => ({
        name: [user.firstName, user.lastName].filter(Boolean).join(" ").trim(),
        image: user.image ?? null,
      }));
      const firstPublic = m?.members?.[0]?.user.firstName ?? null;
      return {
        id: String(c.id),
        slug,
        code,
        name: str(c.name) ?? slug,
        tagline: str(c.tagline),
        members: m?._count.members ?? 0,
        stories: counts.caseStudies + counts.livedExperiences,
        upcomingEvents: upcoming.length,
        publicFaces: faces.filter((f) => f.name),
        newestStory: newest ? { title: newest.title, href: STORY_HREF[newest.kind](newest.slug as string) } : null,
        nextEvent: next && str(next.slug) && str(next.startAt)
          ? { title: str(next.title) ?? "", startAt: String(next.startAt), href: `/events/${next.slug}` }
          : null,
        newestMember: firstPublic ? { firstName: firstPublic } : null,
      };
    }),
  );
  return buildCarouselCards(raw, locale);
}
