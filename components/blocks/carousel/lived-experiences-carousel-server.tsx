import { getTranslations } from "next-intl/server";
import { stegaClean } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { livedExperiencesCarouselQuery } from "@/sanity/queries/carousel/lived-experiences-carousel";
import LivedExperiencesCarousel from "./lived-experiences-carousel";
import type { BackgroundOptionType } from "@/types/background-option";
import type { SectionPadding } from "@/sanity.types";

/**
 * Server wrapper for the lived-experiences carousel block.
 *
 * The carousel itself is a client component that takes `experiences` as a prop.
 * When placed in a `blocks[]` page-builder the shared <Blocks> renderer only
 * spreads the block projection (title/filterBy/maxItems/…) — it never fetches
 * the experiences. So this async server block fetches them (filtered by the
 * editor's filterBy/maxItems/featured) and renders the client carousel with the
 * data plus a "View all" link to the lived-experiences index. Mirrors the H3
 * events-calendar server → client split.
 */
type LivedExperiencesCarouselServerProps = {
  _type?: "lived-experiences-carousel";
  _key?: string;
  title?: string;
  subtitle?: string;
  background?: BackgroundOptionType | null;
  padding?: SectionPadding | null;
  filterBy?: {
    communities?: Array<{ _ref: string }>;
    tags?: Array<{ _ref: string }>;
    authors?: Array<{ _ref: string }>;
  };
  maxItems?: number;
  featured?: boolean;
  viewAllLink?: boolean;
  locale?: string;
};

export default async function LivedExperiencesCarouselServer({
  title,
  subtitle,
  background,
  padding,
  filterBy,
  maxItems = 10,
  featured = false,
  viewAllLink = true,
  locale = "en",
}: LivedExperiencesCarouselServerProps) {
  const communities = filterBy?.communities?.map((c) => c._ref) ?? [];
  const tags = filterBy?.tags?.map((t) => t._ref) ?? [];
  const authors = filterBy?.authors?.map((a) => a._ref) ?? [];

  // Empty filters must be null so the GROQ `!defined($x)` branches short-circuit
  // (an empty array would otherwise filter everything out).
  const experiences =
    (await client.fetch(livedExperiencesCarouselQuery, {
      communities: communities.length ? communities : null,
      tags: tags.length ? tags : null,
      authors: authors.length ? authors : null,
      featured: !!stegaClean(featured),
      maxItems: stegaClean(maxItems) ?? 10,
    })) || [];

  let viewAllHref: string | undefined;
  let viewAllLabel: string | undefined;
  if (stegaClean(viewAllLink) !== false) {
    const supportedLocale = locale as "en" | "es" | "fr" | "ar";
    const t = await getTranslations({
      locale: supportedLocale,
      namespace: "livedExperiences",
    });
    viewAllHref = "/lived-experiences";
    viewAllLabel = t("viewAll");
  }

  return (
    <LivedExperiencesCarousel
      title={stegaClean(title)}
      subtitle={stegaClean(subtitle)}
      background={background}
      padding={padding}
      maxItems={maxItems}
      featured={featured}
      experiences={experiences}
      locale={locale}
      viewAllHref={viewAllHref}
      viewAllLabel={viewAllLabel}
    />
  );
}
