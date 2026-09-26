/**
 * Data fetching for the community graph: a region's members + their
 * contributions, and a single user's contributions. The pure shaping/privacy
 * lives in `contributions.ts`; this module does the Sanity + Prisma I/O and is
 * privacy-filtered for public display (the dataset is public).
 */
import { prisma, safeQuery } from "@/lib/prisma";
import {
  getApprovedCaseStudiesByContributor,
  getApprovedCaseStudyCountsBySubmitter,
} from "@/lib/content/case-studies";
import { RC_SLUG_TO_REGION, type RegionCode } from "@/lib/maps/region-codes";
import {
  normalizeContributions,
  publicRegionMembers,
  type Contribution,
  type RegionMember,
} from "./contributions";

/** Map a regional-community SLUG (the URL) to its Prisma RegionalCommunityName. */
function slugToRegion(slug: string): RegionCode | undefined {
  return RC_SLUG_TO_REGION[slug];
}

/**
 * Members of a region (by RC slug) for PUBLIC display, with each member's
 * approved case-study count. Returns [] on any failure so callers stay resilient.
 */
export async function getRegionMembers(slug: string): Promise<RegionMember[]> {
  const region = slugToRegion(slug);
  if (!region) return [];

  const result = await safeQuery(() =>
    prisma.user.findMany({
      where: {
        communityMemberships: {
          some: { community: { type: "REGIONAL", regionalName: region } },
        },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        image: true,
        isSearchable: true,
        profileVisibility: true,
        communityMemberships: {
          where: { community: { type: "REGIONAL", regionalName: region } },
          select: { role: true },
          take: 1,
        },
      },
      take: 200,
    })
  );
  if (!result.success) return [];

  const ids = result.data.map((u) => u.id);
  const counts = await caseStudyCountsByUser(ids);

  return publicRegionMembers(
    result.data.map((u) => ({
      ...u,
      role: u.communityMemberships[0]?.role ?? null,
      contributionCount: counts[u.id] ?? 0,
    }))
  );
}

/** Approved case-study counts keyed by submitter Clerk id, for a set of users. */
async function caseStudyCountsByUser(userIds: string[]): Promise<Record<string, number>> {
  return getApprovedCaseStudyCountsBySubmitter(userIds);
}

/**
 * A single user's contributions (approved case studies they submitted or
 * authored, their RecentWork, their Content), normalized + newest-first.
 */
export async function getUserContributions(
  userId: string,
  locale: string
): Promise<Contribution[]> {
  const caseStudies = await getApprovedCaseStudiesByContributor(userId);

  const prismaRes = await safeQuery(() =>
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        // Hidden recent work never appears in the public Contributions block.
        recentWork: { where: { hidden: false }, select: { id: true, title: true, link: true, startDate: true } },
        createdContent: { select: { id: true, title: true, createdAt: true } },
      },
    })
  );

  return normalizeContributions({
    caseStudies,
    recentWork: prismaRes.success ? prismaRes.data?.recentWork : [],
    content: prismaRes.success ? prismaRes.data?.createdContent : [],
    locale,
  });
}
