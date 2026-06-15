import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import Timeline1 from "@/components/blocks/timeline/timeline-1";
import { PAGE_QUERY_RESULT, ColorVariant } from "@/sanity.types";

type TimelineRow = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "timeline-row" }
>;

export default function TimelineRow({
  padding,
  colorVariant,
  timelines,
}: TimelineRow) {
  const color = stegaClean(colorVariant) as ColorVariant;

  return (
    <SectionContainer color={color} padding={padding}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {timelines && timelines?.length > 0 && (
          <div className="max-w-[48rem] mx-auto">
          {timelines?.map((timeline, index) => (
            <Timeline1
              key={index}
              color={color}
              tagLine={timeline.tagLine}
              title={timeline.title}
              body={timeline.body}
            />
          ))}
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
