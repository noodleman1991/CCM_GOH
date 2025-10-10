import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const separatorBlockQuery = groq`
  _type == "separatorBlock" => {
    _type,
    _key,
    style,
    spacing,
    color
  }
`;