import "server-only";
import { client } from "@/sanity/lib/client";
import type { TypedCardItem } from "@/lib/cards/type-style";
import { isTypedCardType } from "@/lib/cards/type-style";

/**
 * The newest public content across the four card-capable types — the same
 * shape /api/maps/region-items serves, fetched server-side for the homepage
 * "Fresh on the hub" bento (Task 13).
 */
const TYPES = ["caseStudy", "livedExperience", "newsPost", "researchOutput"] as const;

const STATUS: Record<string, string> = {
  caseStudy: '&& status == "approved"',
  researchOutput: '&& status == "approved"',
  livedExperience: '&& (status == "approved" || !defined(status))',
  newsPost: "",
};

const HREF: Record<string, (slug: string) => string> = {
  caseStudy: (s) => `/research-and-action/case-studies/${s}`,
  livedExperience: (s) => `/lived-experiences/${s}`,
  newsPost: (s) => `/news/${s}`,
  researchOutput: (s) => `/research-and-action/research-outputs/${s}`,
};

type Row = {
  id: string;
  type: string;
  title: string;
  slug: string | null;
  image: string | null;
  imageLqip: string | null;
  excerpt: string | null;
  place: string | null;
  date: string | null;
};

export async function fetchFreshItems(limit = 5): Promise<TypedCardItem[]> {
  const cap = Math.min(Math.max(limit, 1), 12);
  const perType = await Promise.all(
    TYPES.map((type) =>
      client
        .fetch<Row[]>(
          `*[_type == $type ${STATUS[type]} && defined(slug.current)] | order(coalesce(publishedAt, publishDate, _createdAt) desc)[0...${cap}]{
            "id": _id,
            "type": _type,
            "title": coalesce(title.en, title, ""),
            "slug": slug.current,
            "image": coalesce(image.asset->url, coverImage.asset->url),
            "imageLqip": coalesce(image.asset->metadata.lqip, coverImage.asset->metadata.lqip),
            "excerpt": coalesce(excerpt.en, excerpt, description.en, description),
            "place": coalesce(locationDisplayText, locationText.city, place.text),
            "date": coalesce(publishedAt, publishDate, _createdAt)
          }`,
          { type }
        )
        .catch(() => [] as Row[])
    )
  );
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  return perType
    .flat()
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
