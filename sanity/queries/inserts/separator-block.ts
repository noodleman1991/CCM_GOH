import { groq } from "next-sanity";

export const separatorBlockQuery = groq`
  _type == "separatorBlock" => {
    _type,
    _key,
    style,
    spacing,
    color
  }
`;