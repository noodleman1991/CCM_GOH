/**
 * The Community carousel's cards (regions-and-partners spec §3.3). Pure: the
 * reader gathers the numbers, this orders and shapes them. Every community is
 * presented equally — alphabetical in the reader's language (spec R1).
 */
import type { RegionCode } from "@/lib/maps/region-codes";

export interface RawCommunity {
  slug: string;
  code: RegionCode;
  name: string;
  tagline: string | null;
  members: number;
  stories: number;
  upcomingEvents: number;
  /** Members whose profile is public — never anyone else. */
  publicFaces: Array<{ name: string; image: string | null }>;
  newestStory: { title: string; href: string } | null;
  nextEvent: { title: string; startAt: string; href: string } | null;
  newestMember: { firstName: string } | null;
}

export interface LatestItem {
  kind: "story" | "event" | "member";
  title: string;
  startAt: string | null;
  href: string | null;
}

export interface CarouselCard {
  slug: string;
  code: RegionCode;
  name: string;
  tagline: string | null;
  members: number;
  stories: number;
  upcomingEvents: number;
  faces: Array<{ name: string; image: string }>;
  /** Members not shown as a face. */
  moreFaces: number;
  latest: LatestItem[];
}

const MAX_FACES = 5;

export function buildCarouselCards(raw: RawCommunity[], locale: string): CarouselCard[] {
  return [...raw]
    .sort((a, b) => a.name.localeCompare(b.name, locale))
    .map((c) => {
      const faces = c.publicFaces
        .filter((f): f is { name: string; image: string } => Boolean(f.image))
        .slice(0, MAX_FACES);
      const latest: LatestItem[] = [];
      if (c.newestStory) latest.push({ kind: "story", title: c.newestStory.title, startAt: null, href: c.newestStory.href });
      if (c.nextEvent) latest.push({ kind: "event", title: c.nextEvent.title, startAt: c.nextEvent.startAt, href: c.nextEvent.href });
      if (c.newestMember) latest.push({ kind: "member", title: c.newestMember.firstName, startAt: null, href: null });
      return {
        slug: c.slug,
        code: c.code,
        name: c.name,
        tagline: c.tagline,
        members: c.members,
        stories: c.stories,
        upcomingEvents: c.upcomingEvents,
        faces,
        moreFaces: Math.max(0, c.members - faces.length),
        latest,
      };
    });
}
