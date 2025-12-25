import { PAGE_QUERYResult } from "@/sanity.types";
import Hero1 from "@/components/blocks/hero/hero-1";
import Hero2 from "@/components/blocks/hero/hero-2";
import SectionHeader from "@/components/blocks/section-header";
import SplitRow from "@/components/blocks/split/split-row";
import GridRow from "@/components/blocks/grid/grid-row";
import TeamGrid from "@/components/blocks/grid/team-grid";
import Carousel1 from "@/components/blocks/carousel/carousel-1";
import Carousel2 from "@/components/blocks/carousel/carousel-2";
import LivedExperiencesCarousel from "@/components/blocks/carousel/lived-experiences-carousel";
import TimelineRow from "@/components/blocks/timeline/timeline-row";
import Cta1 from "@/components/blocks/cta/cta-1";
import LogoCloud1 from "@/components/blocks/logo-cloud/logo-cloud-1";
import FAQs from "@/components/blocks/faqs";
import FormNewsletter from "@/components/blocks/forms/newsletter";
import AllPosts from "@/components/blocks/all-posts";
import { isRTL } from "@/i18n/i18n-helpers";
// import gridReport from "@/sanity/schemas/blocks/grid/grid-report"; //todo: what is the diff between reportsgrid and gridreports in schemas???

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];

interface BlocksProps {
    blocks: Block[];
    locale: string;
    translations?: Array<{
        language: string;
        path: string;
        title: string;
    }>;
    userId?: string;
}

const componentMap: Record<string, React.ComponentType<any>> = {
    "hero-1": Hero1,
    "hero-2": Hero2,
    "section-header": SectionHeader,
    "split-row": SplitRow,
    "grid-row": GridRow,
    "team-grid": TeamGrid,
    "carousel-1": Carousel1,
    "carousel-2": Carousel2,
    "lived-experiences-carousel": LivedExperiencesCarousel,
    "timeline-row": TimelineRow,
    "cta-1": Cta1,
    "logo-cloud-1": LogoCloud1,
    faqs: FAQs,
    "form-newsletter": FormNewsletter,
    "all-posts": AllPosts,
};

export default function Blocks({ blocks, locale, userId }: BlocksProps) {
    const rtl = isRTL(locale);

    return (
        <div dir={rtl ? 'rtl' : 'ltr'}>
            {blocks?.map((block) => {
                const Component = componentMap[block._type];
                if (!Component) {
                    console.warn(
                        `No component implemented for block type: ${block._type}`
                    );
                    return <div data-type={block._type} key={block._key} />;
                }
                return (
                    <Component
                        key={block._key}
                        {...(block as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                        locale={locale}
                        isRTL={rtl}
                        userId={userId} // Pass userId for download tracking
                    />
                );
            })}
        </div>
    );
}
