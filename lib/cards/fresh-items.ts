import "server-only";
import { getFreshContentRows } from "@/lib/content/system";
import type { TypedCardItem } from "@/lib/cards/type-style";
import { isTypedCardType } from "@/lib/cards/type-style";

/**
 * The newest public content across the four card-capable types — the same
 * shape /api/maps/region-items serves, fetched server-side for the homepage
 * "Fresh on the hub" bento (Task 13).
 */
const HREF: Record<string, (slug: string) => string> = {
  caseStudy: (s) => `/research-and-action/case-studies/${s}`,
  livedExperience: (s) => `/lived-experiences/${s}`,
  newsPost: (s) => `/news/${s}`,
  researchOutput: (s) => `/research-and-action/research-outputs/${s}`,
};

export async function fetchFreshItems(limit = 5): Promise<TypedCardItem[]> {
  const cap = Math.min(Math.max(limit, 1), 12);
  const rows = await getFreshContentRows(cap);
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  return rows
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, cap)
    .filter((r) => isTypedCardType(r.type))
    .map((r) => ({
      type: r.type as TypedCardItem["type"],
      id: r.id,
      title: r.title,
      href: r.slug ? HREF[r.type](r.slug) : "#",
      image: r.image,
      imageLqip: r.imageLqip,
      excerpt: typeof r.excerpt === "string" ? r.excerpt : null,
      place: r.place,
      date: r.date,
      quote: r.type === "livedExperience",
      isNew: !!r.date && new Date(r.date).getTime() > weekAgo,
    }));
}
