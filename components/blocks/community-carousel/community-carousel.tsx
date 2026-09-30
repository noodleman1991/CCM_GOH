import { getTranslations } from "next-intl/server";
import { getCommunityCarouselCards } from "@/lib/content/community-carousel";
import { REGION_I18N_KEY } from "@/lib/maps/region-codes";
import { CONTAINER_WIDTH, SECTION_SPACING_Y } from "@/lib/design-tokens";
import { CarouselTrack, type TrackCard } from "./carousel-track";

const LOCALES = ["en", "es", "fr", "ar"] as const;
type Locale = (typeof LOCALES)[number];

export interface CommunityCarouselProps {
  _type?: "community-carousel";
  _key?: string;
  heading?: string | null;
  intro?: string | null;
  communities?: string[];
  show?: { members: boolean; stories: boolean; events: boolean; faces: boolean; latest: boolean };
  autoplay?: boolean;
  speed?: "calm" | "normal";
  locale: string;
}

const ALL_ON = { members: true, stories: true, events: true, faces: true, latest: true };

/**
 * The Community carousel section (regions-and-partners spec §3.3): every
 * regional community as an equal card with its live numbers. Every sentence
 * is built here, in the reader's language; the client track only moves.
 */
export default async function CommunityCarousel({ heading, intro, communities = [], show = ALL_ON, autoplay = true, speed = "calm", locale }: CommunityCarouselProps) {
  const pageLocale: Locale = (LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : "en";
  const [all, t, tRegions] = await Promise.all([
    getCommunityCarouselCards(pageLocale),
    getTranslations({ locale: pageLocale, namespace: "communityCarousel" }),
    getTranslations({ locale: pageLocale, namespace: "navigation.regions" }),
  ]);
  // Cards carry the region's name — the same words as the atlas's Region row —
  // and stay alphabetical by it (spec R1).
  const chosen = (communities.length ? all.filter((c) => c.id && communities.includes(c.id)) : all)
    .map((c) => ({ ...c, name: tRegions(REGION_I18N_KEY[c.code]) }))
    .sort((a, b) => a.name.localeCompare(b.name, pageLocale));
  if (chosen.length === 0) return null;

  const day = new Intl.DateTimeFormat(pageLocale, { day: "numeric", month: "short", timeZone: "UTC" });
  const cards: TrackCard[] = chosen.map((c, i) => {
    const counts = [
      show.members && c.members > 0 ? t("members", { count: c.members }) : null,
      show.stories && c.stories > 0 ? t("stories", { count: c.stories }) : null,
      show.events && c.upcomingEvents > 0 ? t("events", { count: c.upcomingEvents }) : null,
    ].filter((s): s is string => Boolean(s));
    const latest = show.latest
      ? c.latest.map((l) =>
          l.kind === "story"
            ? t("latestStory", { title: l.title })
            : l.kind === "event"
              ? t("latestEvent", { title: l.title, date: l.startAt ? day.format(new Date(l.startAt)) : "" })
              : t("latestMember", { name: l.title }),
        )
      : [];
    return {
      slug: c.slug,
      code: c.code,
      name: c.name,
      tagline: c.tagline,
      // A community with nothing yet still reads as an invitation, not a row of zeros.
      counts: counts.length ? counts : c.members === 0 ? [t("beFirst")] : [],
      faces: show.faces ? c.faces : [],
      moreFaces: show.faces && c.faces.length > 0 && c.moreFaces > 0 ? t("moreFaces", { count: c.moreFaces }) : null,
      latest,
      visitLabel: t("visit", { name: c.name }),
      slideLabel: t("slide", { n: i + 1, total: chosen.length }),
      goToLabel: t("goTo", { name: c.name }),
    };
  });

  const title = heading || t("heading");
  return (
    <section className={`mx-auto px-4 @content-sm/page:px-6 @content-lg/page:px-8 ${CONTAINER_WIDTH.default} ${SECTION_SPACING_Y.md}`}>
      <div className="mb-4 min-w-0 space-y-1">
        <h2 className="font-heading text-xl font-bold text-ccm-midnight @content-sm/page:text-2xl">
          <bdi>{title}</bdi>
        </h2>
        {intro && <p className="max-w-prose text-ccm-midnight/75">{intro}</p>}
      </div>
      <CarouselTrack
        cards={cards}
        labels={{ region: title, previous: t("previous"), next: t("next") }}
        autoplay={autoplay}
        speed={speed}
      />
    </section>
  );
}
