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
