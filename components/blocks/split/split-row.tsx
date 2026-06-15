import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { PAGE_QUERY_RESULT } from "@/sanity.types";
import SplitContent from "./split-content";
import SplitCardsList from "./split-cards-list";
import SplitImage from "./split-image";
import SplitInfoList from "./split-info-list";

type Block = NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];
type SplitRow = Extract<Block, { _type: "split-row" }>;
type SplitColumn = NonNullable<NonNullable<SplitRow["splitColumns"]>[number]>;

const componentMap: {
  [K in SplitColumn["_type"]]: React.ComponentType<
    Extract<SplitColumn, { _type: K }> & { locale?: string }
  >;
} = {
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
}: SplitRow & { locale?: string }) {

  return (
    <SectionContainer padding={padding}>
      <div className="overflow-x-hidden">
        {splitColumns && splitColumns?.length > 0 && (
          <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-2 items-center",
            noGap ? "gap-0" : "gap-6 md:gap-8 lg:gap-12"
          )}
        >
          {splitColumns?.map((column) => {
            const Component = componentMap[column._type];
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
                  {...(column as any)}

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
