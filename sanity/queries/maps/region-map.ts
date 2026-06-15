import { groq } from "next-sanity";

export const regionMapQuery = groq`
  _type == "region-map" => {
    _type,
    _key,
    padding,
    colorVariant,
    title,
    description,
    defaultFacet,
    allowedFacets,
  }
`;
