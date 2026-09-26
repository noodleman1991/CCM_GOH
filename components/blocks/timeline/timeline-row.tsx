import SectionContainer, { type SectionPadding } from "@/components/ui/section-container";
import Timeline1, { type Timeline1Fields } from "@/components/blocks/timeline/timeline-1";

interface TimelineRowProps {
  padding?: SectionPadding | null;
  timelines?: Timeline1Fields[] | null;
}

export default function TimelineRow({
  padding,
  timelines,
}: TimelineRowProps) {

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
