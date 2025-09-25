import { groq } from "next-sanity";

// @sanity-typegen-ignore
export const sectionHeaderQuery = groq`
  _type == "section-header" => {
    _type,
    _key,
    padding,
    colorVariant,
    sectionWidth,
    stackAlign,
    tagLine,
    title,
    description,
    link{
      title,
      href,
      target,
      buttonVariant{
        variant,
        size,
        stroke
      }
    },
  }
`;
