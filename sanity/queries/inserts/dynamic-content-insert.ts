import { groq } from "next-sanity";

export const dynamicContentInsertQuery = groq`
  _type == "dynamicContentInsert" => {
    _type,
    _key,
    queryType,
    displayStyle,
    itemCount,
    title,
    subtitle,
    showViewAllButton,
    backgroundColor,
    padding
  }
`;