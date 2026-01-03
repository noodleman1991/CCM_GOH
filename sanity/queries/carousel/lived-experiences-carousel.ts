import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const livedExperiencesCarouselBlockQuery = groq`
  _type == "lived-experiences-carousel" => {
    _type,
    _key,
    title,
    subtitle,
    background,
    padding,
    filterBy,
    maxItems,
    featured,
  }
`;

export const livedExperiencesCarouselQuery = groq`
  *[_type == "livedExperience" &&
    (!defined($communities) || _id in *[_type == "regionalCommunity" && _id in $communities].members[].person._ref) &&
    (!defined($tags) || count(tags[]._ref[@ in $tags]) > 0) &&
    (!defined($authors) || author._ref in $authors) &&
    (!defined($featured) || $featured == false || featured == true)
  ] | order(publishedAt desc) [0...$maxItems] {
    _id,
    _type,
    title,
    description,
    videoLink,
    thumbnail,
    duration,
    publishedAt,
    author -> {
      _id,
      name,
      image,
      organizationalAffiliation
    },
    relatedCommunity -> {
      _id,
      name,
      slug
    },
    tags[] -> {
      _id,
      label,
      color
    },
    featured,
    slug
  }
`;

export const livedExperiencesCarouselFullQuery = groq`
  {
    "experiences": ${livedExperiencesCarouselQuery}
  }
`;