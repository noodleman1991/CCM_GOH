import "server-only";
import { prisma, safeQuery } from "@/lib/prisma";
import { getForYouCandidates } from "@/lib/content/discovery";
import { slugToShortCode } from "@/lib/maps/region-codes";

/**
 * "For you" (X5): recent published content matching the regions and themes
 * the user follows. This is the pull-side consequence of REGION/THEME
 * follows — the fan-out consequence for PROJECT follows lives in the
 * notification spine.
 */

export type ForYouItem = {
  id: string;
  type: string;
  title: string;
  slug: string;
  match: "region" | "theme";
};

export async function getForYou(userId: string, limit = 6): Promise<ForYouItem[]> {
  const followsR = await safeQuery(() =>
    prisma.follow.findMany({
      where: { userId, targetType: { in: ["REGION", "THEME"] } },
      select: { targetType: true, targetId: true },
    })
  );
  if (!followsR.success || followsR.data.length === 0) return [];

  const regionSlugs = followsR.data.filter((f) => f.targetType === "REGION").map((f) => f.targetId);
  const regionCodes = regionSlugs.map((slug) => slugToShortCode(slug)).filter(Boolean) as string[];
  const themeSlugs = followsR.data.filter((f) => f.targetType === "THEME").map((f) => f.targetId);

  if (regionCodes.length === 0 && regionSlugs.length === 0 && themeSlugs.length === 0) return [];

  try {
    const rows = await getForYouCandidates({ regionCodes, regionSlugs, themeSlugs, limit });
    return rows
      .filter((r) => r.title && r.slug)
      .map((r) => ({
        id: r._id,
        type: r._type,
        title: r.title!,
        slug: r.slug!,
        match:
          (r.region && regionCodes.includes(r.region)) || (r.rcSlug && regionSlugs.includes(r.rcSlug))
            ? "region"
            : "theme",
      }));
  } catch (error) {
    console.warn("[for-you] fetch failed:", error);
    return [];
  }
}

/** Detail-page href per content type (mirrors outputDetailHref's routes). */
export function forYouHref(item: ForYouItem): string {
  switch (item.type) {
    case "caseStudy":
      return `/research-and-action/case-studies/${item.slug}`;
    case "livedExperience":
      return `/lived-experiences/${item.slug}`;
    case "newsPost":
      return `/news/${item.slug}`;
    default:
      return "#";
  }
}
