/**
 * Which component renders each section type (`_type`). Kept apart from the
 * <Blocks> renderer so the renderer can be tested without loading every
 * section and its data dependencies.
 */
import Hero1 from "@/components/blocks/hero/hero-1";
import Hero2 from "@/components/blocks/hero/hero-2";
import SectionHeader from "@/components/blocks/section-header";
import SplitRow from "@/components/blocks/split/split-row";
import GridRow from "@/components/blocks/grid/grid-row";
import TeamGrid from "@/components/blocks/grid/team-grid";
import Carousel1 from "@/components/blocks/carousel/carousel-1";
import Carousel2 from "@/components/blocks/carousel/carousel-2";
import LivedExperiencesCarouselBlock from "@/components/blocks/carousel/lived-experiences-carousel-block";
import TimelineRow from "@/components/blocks/timeline/timeline-row";
import Cta1 from "@/components/blocks/cta/cta-1";
import LogoCloud1 from "@/components/blocks/logo-cloud/logo-cloud-1";
import FAQs from "@/components/blocks/faqs";
import FormNewsletter from "@/components/blocks/forms/newsletter";
import AllPosts from "@/components/blocks/all-posts";
import RegionMapBlock from "@/components/blocks/maps/region-map";
import AtlasEmbedBlock from "@/components/blocks/maps/atlas-embed";
import PeopleWidget from "@/components/blocks/people/people-widget";
import EventsCalendar from "@/components/blocks/events/events-calendar";
import FreshContent from "@/components/blocks/fresh-content";
import SubmitStoryBanner from "@/components/blocks/cta/submit-story-banner";
import ContentFeed from "@/components/blocks/content-feed";

export const componentMap: Record<string, React.ElementType> = {
    "hero-1": Hero1,
    "hero-2": Hero2,
    "section-header": SectionHeader,
    "split-row": SplitRow,
    "grid-row": GridRow,
    "team-grid": TeamGrid,
    "carousel-1": Carousel1,
    "carousel-2": Carousel2,
    "lived-experiences-carousel": LivedExperiencesCarouselBlock,
    "timeline-row": TimelineRow,
    "cta-1": Cta1,
    "logo-cloud-1": LogoCloud1,
    faqs: FAQs,
    "form-newsletter": FormNewsletter,
    "all-posts": AllPosts,
    "region-map": RegionMapBlock,
    "atlas-embed": AtlasEmbedBlock,
    "people-widget": PeopleWidget,
    "events-calendar": EventsCalendar,
    "fresh-content": FreshContent,
    "submit-story-banner": SubmitStoryBanner,
    "content-feed": ContentFeed,
};
