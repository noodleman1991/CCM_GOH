import { groq } from "next-sanity";

export const peopleWidgetQuery = groq`
  _type == "people-widget" => {
    _type,
    _key,
    padding,
    title,
    description,
    limit,
  }
`;
