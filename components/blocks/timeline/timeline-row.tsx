import SectionContainer from "@/components/ui/section-container";
import Timeline1 from "@/components/blocks/timeline/timeline-1";
import { PAGE_QUERY_RESULT } from "@/sanity.types";

type TimelineRow = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "timeline-row" }
>;

export default function TimelineRow({
  padding,
  timelines,
}: TimelineRow) {

  return (
    <SectionContainer padding={padding}>
      <div className="max-w-6xl mx-auto px-4 @content-sm/page:px-6 @content-lg/page:px-8">
        {timelines && timelines?.length > 0 && (
          <div className="max-w-[48rem] mx-auto">
          {timelines?.map((timeline, index) => (
            <Timeline1
              key={index}

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
