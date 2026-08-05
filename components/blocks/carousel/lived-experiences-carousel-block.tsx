import { sanityFetch } from "@/sanity/lib/live";
import { livedExperiencesCarouselQuery } from "@/sanity/queries/carousel/lived-experiences-carousel";
import LivedExperiencesCarousel from "./lived-experiences-carousel";

type CarouselProps = React.ComponentProps<typeof LivedExperiencesCarousel>;

/**
 * Server wrapper for the `lived-experiences-carousel` page-builder block.
 * The client carousel only RENDERS `experiences` — it never fetches — so a
 * CMS-composed page (homepage) rendered the block as nothing while
 * `livedExperiencesCarouselQuery` sat orphaned. This wrapper runs that query
 * from the block's own CMS config. Surfaces that already fetched (the
 * regional template passes `experiences` in) skip the extra round trip.
 */
export default async function LivedExperiencesCarouselBlock(props: CarouselProps) {
  if (props.experiences && props.experiences.length > 0) {
    return <LivedExperiencesCarousel {...props} />;
  }

  let experiences: CarouselProps["experiences"] = [];
  try {
    const { data } = await sanityFetch({
      query: livedExperiencesCarouselQuery,
      params: {
        // GROQ guards each facet with !defined($x) — absent filters bind null.
        // The CMS block stores reference objects; the query compares raw ids.
        communities: props.filterBy?.communities?.length ? props.filterBy.communities.map((r) => r._ref) : null,
        tags: props.filterBy?.tags?.length ? props.filterBy.tags.map((r) => r._ref) : null,
        authors: props.filterBy?.authors?.length ? props.filterBy.authors.map((r) => r._ref) : null,
        featured: props.featured ?? false,
        maxItems: props.maxItems ?? 10,
      },
    });
    experiences = data ?? [];
  } catch {
    // The carousel renders nothing on an empty set — the right failure mode
    // for a homepage strip (never a broken section).
    experiences = [];
  }

  return <LivedExperiencesCarousel {...props} experiences={experiences} />;
}
