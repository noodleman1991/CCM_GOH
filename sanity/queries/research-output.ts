import { groq } from "next-sanity";
import { styledBodyProjection } from "@/sanity/queries/shared/styled-body";
import { RELATED_CONTENT_PROJECTION } from "@/sanity/queries/grid/grid-case-study";
import { sanityFetch } from "@/sanity/lib/live";

// Shared projection for a researchOutput card/detail. Mirrors the case-study
// shape so the existing card/detail components can consume it.
const RESEARCH_OUTPUT_FRAGMENT = `
  _id,
  title,
  excerpt,
  "slug": slug.current,
  outputType,
  layout,
  status,
  featured,
  publishDate,
  year,
  region,
  themes,
  populations,
  "image": coverImage{ asset->{ _id, url }, alt, caption },
  organizations[]->{ _id, name },
  relatedCommunities[]->{ _id, name, "slug": slug.current },
  tags[]->{ _id, label, value, color },
  "versions": versions[]{ _key, kind, lang, label, pages, downloadCount, "fileUrl": file.asset->url, "fileName": file.asset->originalFilename, body[]{ ${styledBodyProjection} } }
`;

export const RESEARCH_OUTPUT_BY_SLUG_QUERY = groq`
  *[_type == "researchOutput" && slug.current == $slug && status == "approved"][0]{
    ${RESEARCH_OUTPUT_FRAGMENT},
    "content": coalesce(content, body)[]{ ${styledBodyProjection} },
    ${RELATED_CONTENT_PROJECTION}
  }
`;

export const APPROVED_RESEARCH_OUTPUTS_QUERY = groq`
  *[_type == "researchOutput" && status == "approved"] | order(coalesce(publishDate, _createdAt) desc){
    ${RESEARCH_OUTPUT_FRAGMENT}
  }
`;

export const RESEARCH_OUTPUTS_STATIC_PARAMS_QUERY = groq`
  *[_type == "researchOutput" && status == "approved" && defined(slug.current)]{ "slug": slug.current }
`;

export const fetchResearchOutputBySlug = async ({ slug }: { slug: string }) => {
  const { data } = await sanityFetch({
    query: RESEARCH_OUTPUT_BY_SLUG_QUERY,
    params: { slug },
    perspective: "published",
    stega: false,
  });
  return data;
};

export const fetchApprovedResearchOutputs = async () => {
  const { data } = await sanityFetch({
    query: APPROVED_RESEARCH_OUTPUTS_QUERY,
    perspective: "published",
    stega: false,
  });
  return data ?? [];
};

export const fetchResearchOutputsStaticParams = async () => {
  const { data } = await sanityFetch({
    query: RESEARCH_OUTPUTS_STATIC_PARAMS_QUERY,
    perspective: "published",
    stega: false,
  });
  return (data ?? []) as { slug: string }[];
};
