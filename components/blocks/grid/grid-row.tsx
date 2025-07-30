import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult } from "@/sanity.types";
import GridCard from "./grid-card";
import PricingCard from "./pricing-card";
import GridPost from "./grid-post";
import GridReport from "./grid-report";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRow = Extract<Block, { _type: "grid-row" }>;
type GridColumn = NonNullable<NonNullable<GridRow["columns"]>[number]>;

type GridReportType = {
    _type: "grid-report";
    _key: string;
    report: any;
    showTags?: boolean;
    showDownloadButtons?: boolean;
    showMetadata?: boolean;
};

type ExtendedGridColumn = GridColumn | GridReportType;

// todo: fix type workaround
// const componentMap: {
//   [K in GridColumn["_type"]]: React.ComponentType<
//      Extract<GridColumn, { _type: K }> & {
//         color?: string;
//         locale?: string;
//         userId?: string;
//     }
//     >;
// } = {
//     "grid-card": GridCard,
//     "pricing-card": PricingCard,
//     "grid-post": GridPost,
//     "grid-report": GridReport,
// };

const componentMap: {
    [K in ExtendedGridColumn["_type"]]: React.ComponentType<any>;
} = {
    "grid-card": GridCard,
    "pricing-card": PricingCard,
    "grid-post": GridPost,
    "grid-report": GridReport,
};

interface GridRowProps extends GridRow {
    locale?: string;
    userId?: string;
}

export default function GridRow({
  padding,
  colorVariant,
  gridColumns,
  columns,
  locale,
  userId,
}: GridRowProps) {
  const color = stegaClean(colorVariant);

  return (
    <SectionContainer color={color} padding={padding}>
      {columns && columns?.length > 0 && (
        <div
          className={cn(
            `grid grid-cols-1 gap-6`,
            `lg:${stegaClean(gridColumns)}`
          )}
        >
          {columns.map((column) => {
            const Component = componentMap[column._type];
            if (!Component) {
              // Fallback for development/debugging of new component types
              console.warn(
                `No component implemented for grid column type: ${column._type}`
              );
              return <div data-type={column._type} key={column._key} />;
            }
            return (
                  <Component
                      {...(column as any)}
                      color={color}
                      key={column._key}
                      locale={locale} // NEW: Pass locale
                      userId={userId} // NEW: Pass userId
                  />
            );
          })}
        </div>
      )}
    </SectionContainer>
  );
}
