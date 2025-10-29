import { groq } from "next-sanity";
import { gridCardQuery } from "@/sanity/queries/grid/grid-card";
import { gridPostQuery } from "@/sanity/queries/grid/grid-post";
import { gridAgendaQuery } from "@/sanity/queries/grid/grid-agenda";
import { gridCaseStudyQuery } from "@/sanity/queries/grid/grid-case-study";
import { gridNewsQuery } from "@/sanity/queries/grid/grid-news";
import { gridLivedExperienceQuery } from "@/sanity/queries/grid/grid-lived-experience";

// @sanity-typegen-ignore
export const gridRowQuery = groq`
  _type == "grid-row" => {
    _type,
    _key,
    padding,
    background,
    title,
    description,
    gridColumns,
    cardVariant,
    columns[]{
      ${gridCardQuery},
      ${gridPostQuery},
      ${gridAgendaQuery},
      ${gridCaseStudyQuery},
      ${gridNewsQuery},
      ${gridLivedExperienceQuery},
    },
  }
`;
