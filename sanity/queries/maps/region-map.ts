import { groq } from "next-sanity";

export const regionMapQuery = groq`
  _type == "region-map" => {
    _type,
    _key,
    padding,
    title,
    description,
    defaultFacet,
    allowedFacets,
  }
`;
