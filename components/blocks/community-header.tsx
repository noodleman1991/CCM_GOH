import { RegionHero } from "@/components/regions/region-hero";

/**
 * The community's header (CMS project 3): the region hero for the page's
 * community (illustration, name, Get involved, Follow), plus an optional
 * intro line. Nothing outside a community page.
 */
export default async function CommunityHeader({
  communitySlug,
  locale,
  intro,
}: {
  communitySlug?: string;
  locale: string;
  intro?: string | null;
}) {
  if (!communitySlug) return null;
  return (
    <>
      <RegionHero slug={communitySlug} locale={locale} />
      {intro && <p className="mx-auto max-w-prose px-4 pt-2 text-center text-lg text-ccm-midnight/85">{intro}</p>}
    </>
  );
}
