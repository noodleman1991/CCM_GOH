import { groq } from "next-sanity";
import { gridCardQuery } from "@/sanity/queries/grid/grid-card";
import { gridPostQuery } from "@/sanity/queries/grid/grid-post";
import { gridReportQuery } from "@/sanity/queries/grid/grid-report";
import { gridCaseStudyQuery } from "@/sanity/queries/grid/grid-case-study";


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
    columns[]{
      ${gridCardQuery},
      ${gridPostQuery},
      ${gridReportQuery},
      ${gridCaseStudyQuery},
    },
  }
`;
