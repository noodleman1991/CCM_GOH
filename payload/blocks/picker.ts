import type { Block } from "payload";

/** The admin block picker's groups, in the order editors see them (spec §3.1). */
export const SECTION_GROUPS = ["Openings", "Text & media", "Content", "Maps", "Calls to action", "Logos & quotes"] as const;
export type SectionGroup = (typeof SECTION_GROUPS)[number];

export const SECTION_PICTURES = {
  hero: "/admin/sections/hero.svg",
  "hero-with-image": "/admin/sections/hero-with-image.svg",
  "section-heading": "/admin/sections/section-heading.svg",
  "text-image": "/admin/sections/text-image.svg",
  "image-carousel": "/admin/sections/image-carousel.svg",
  timeline: "/admin/sections/timeline.svg",
  faqs: "/admin/sections/faqs.svg",
  "content-feed": "/admin/sections/content-feed.svg",
  "events-calendar": "/admin/sections/events-calendar.svg",
  people: "/admin/sections/people.svg",
  "link-cards": "/admin/sections/link-cards.svg",
  "region-map": "/admin/sections/region-map.svg",
  atlas: "/admin/sections/atlas.svg",
  "call-to-action": "/admin/sections/call-to-action.svg",
  "share-story": "/admin/sections/share-story.svg",
  newsletter: "/admin/sections/newsletter.svg",
  "logo-strip": "/admin/sections/logo-strip.svg",
  testimonials: "/admin/sections/testimonials.svg",
  "community-header": "/admin/sections/community-header.svg",
} as const;
export type SectionPictureKey = keyof typeof SECTION_PICTURES;

/** Picker group + picture for a block. The picture is a small schematic of the section's shape. */
export function pickerAdmin(key: SectionPictureKey, group: SectionGroup, alt: string): NonNullable<Block["admin"]> {
  return { group, images: { thumbnail: { url: SECTION_PICTURES[key], alt } } };
}
