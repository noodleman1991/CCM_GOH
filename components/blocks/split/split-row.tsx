import { cn } from "@/lib/utils";
import SectionContainer, { type SectionPadding } from "@/components/ui/section-container";
import SplitContent from "./split-content";
import SplitCardsList from "./split-cards-list";
import SplitImage from "./split-image";
import SplitInfoList from "./split-info-list";

/** A split column, in its raw CMS shape (`_type`/`_key` discriminant plus
 *  whatever fields that column type carries). Loose by design — SplitRow just
 *  dispatches on `_type` and spreads the rest into the matching child
 *  component, which owns its own precise prop type. Same pattern as
 *  GridRow's column dispatch (components/blocks/grid/grid-row.tsx). */
type SplitColumn = { _type: string; _key: string } & Record<string, unknown>;

interface SplitRowProps {
  padding?: SectionPadding | null;
  noGap?: boolean;
  splitColumns?: SplitColumn[] | null;
  locale?: string;
}

const componentMap: Record<string, React.ElementType> = {
  "split-content": SplitContent,
  "split-cards-list": SplitCardsList,
  "split-image": SplitImage,
  "split-info-list": SplitInfoList,
};

export default function SplitRow({
  padding,
  noGap,
  splitColumns,
  locale = "en",
}: SplitRowProps) {

  return (
    <SectionContainer padding={padding}>
      <div className="overflow-x-hidden">
        {splitColumns && splitColumns?.length > 0 && (
          <div
          className={cn(
            "grid grid-cols-1 @content-md/page:grid-cols-2 items-center",
            noGap ? "gap-0" : "gap-6 @content-md/page:gap-8 @content-lg/page:gap-12"
          )}
        >
          {splitColumns?.map((column) => {
            // Widen to ElementType: the map is keyed by the column's _type, but
            // TS can't correlate the union member with its component here.
            const Component: React.ElementType = componentMap[column._type];
            if (!Component) {
              // Fallback for development/debugging of new component types
              console.warn(
                `No component implemented for split column type: ${column._type}`
              );
              return <div data-type={column._type} key={column._key} />;
            }
            return (
              // h-full + centered so a shorter column (e.g. the image) sits
              // vertically centred against a taller text column.
              <div key={column._key} className="flex h-full min-w-0 flex-col justify-center">
                <Component
                  {...column}

                  noGap={noGap}
                  locale={locale}
                />
              </div>
            );
          })}
        </div>
        )}
      </div>
    </SectionContainer>
  );
}
