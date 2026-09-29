import type { Block } from "payload";
import { hero1 } from "@/payload/blocks/hero-1";
import { splitRow } from "@/payload/blocks/split-row";
import { splitContent } from "@/payload/blocks/split-content";
import { splitImage } from "@/payload/blocks/split-image";
import { cta1 } from "@/payload/blocks/cta-1";
import { sectionHeader } from "@/payload/blocks/section-header";
import { logoCloud1 } from "@/payload/blocks/logo-cloud-1";
import { gridRow } from "@/payload/blocks/grid-row";
import { gridCard } from "@/payload/blocks/grid-card";
import { gridAgenda } from "@/payload/blocks/grid-agenda";
import { gridNews } from "@/payload/blocks/grid-news";
import { carousel2 } from "@/payload/blocks/carousel-2";
import { hero2 } from "@/payload/blocks/hero-2";
import { faqs } from "@/payload/blocks/faqs";
import { timelineRow } from "@/payload/blocks/timeline-row";
import { carousel1 } from "@/payload/blocks/carousel-1";
import { submitStoryBanner } from "@/payload/blocks/submit-story-banner";
import { formNewsletter } from "@/payload/blocks/form-newsletter";
import { eventsCalendar } from "@/payload/blocks/events-calendar";
import { peopleWidget } from "@/payload/blocks/people-widget";
import { regionMap } from "@/payload/blocks/region-map";
import { atlasEmbed } from "@/payload/blocks/atlas-embed";
import { contentFeed } from "@/payload/blocks/content-feed";
import { communityHeader } from "@/payload/blocks/community-header";
import { communityMembers } from "@/payload/blocks/community-members";

export {
  hero1,
  splitRow,
  splitContent,
  splitImage,
  cta1,
  sectionHeader,
  logoCloud1,
  gridRow,
  gridCard,
  gridAgenda,
  gridNews,
  carousel2,
  hero2,
  faqs,
  timelineRow,
  carousel1,
  submitStoryBanner,
  formNewsletter,
  eventsCalendar,
  peopleWidget,
  regionMap,
  atlasEmbed,
  contentFeed,
  communityHeader,
  communityMembers,
};

/**
 * The twelve Sanity block schemas a census of every document found actually
 * authored (spec §6) — the only ones ported. ~28 more block schemas exist on
 * disk and were never authored into a single document; porting them would
 * recreate dead weight in a new system.
 *
 * Tasks 4–6 consume this array (or the individual named exports above) to
 * build the `pages` collection's blocks field and the `homepage` global.
 */
export const blocks: Block[] = [
  hero1,
  splitRow,
  splitContent,
  splitImage,
  cta1,
  sectionHeader,
  logoCloud1,
  gridRow,
  gridCard,
  gridAgenda,
  gridNews,
  carousel2,
];
