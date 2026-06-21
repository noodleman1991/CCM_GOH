import { groq } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { RELATED_CONTENT_PROJECTION } from "@/sanity/queries/grid/grid-case-study";

/**
 * Public lived-experience detail by slug. Hard-filters to approved (legacy docs
 * without a status still count) so non-approved submissions never render
 * publicly — the same contract as the case-study by-slug query.
 */
export const LIVED_EXPERIENCE_BY_SLUG_QUERY = groq`
  *[_type == "livedExperience"
    && slug.current == $slug
    && (status == "approved" || !defined(status))][0]{
    _id,
    title,
    format,
    description,
    issue,
    personContext,
    slug,
    videoLink,
    duration,
    publishedAt,
    thumbnail{
      asset->{ _id, url, mimeType, metadata { lqip, dimensions { width, height } } },
      alt
    },
    author->{ _id, name, organizationalAffiliation },
    relatedCommunity->{ _id, name, slug },
    organizations[]->{ _id, name, slug, acronym },
    tags[]->{ _id, label, value, color },
    ${RELATED_CONTENT_PROJECTION}
  }
`;

export const LIVED_EXPERIENCE_SLUGS_QUERY = groq`
  *[_type == "livedExperience"
    && defined(slug.current)
    && (status == "approved" || !defined(status))]{ "slug": slug.current }
`;

export async function fetchLivedExperienceBySlug(slug: string) {
  return client.fetch(LIVED_EXPERIENCE_BY_SLUG_QUERY, { slug });
}

export async function fetchLivedExperienceSlugs(): Promise<{ slug: string }[]> {
  return client.fetch(LIVED_EXPERIENCE_SLUGS_QUERY);
}
