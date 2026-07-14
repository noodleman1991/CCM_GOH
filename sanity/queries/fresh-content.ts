import { groq } from "next-sanity";

export const freshContentQuery = groq`
  _type == "fresh-content" => {
    _type,
    _key,
    title,
    limit,
  }
`;
