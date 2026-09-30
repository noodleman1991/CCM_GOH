import { getTranslations } from "next-intl/server";
import Blocks from "@/components/blocks";
import { sectionEditHref } from "@/lib/cms/edit-links";
import { RegionSectionSpine } from "@/components/regions/region-section-spine";
import { CHAPTER_MESSAGE, groupIntoChapters } from "@/lib/content/chapters";
import { resolveContentFeed } from "@/lib/content/feeds/resolve";
import type { FeedContext } from "@/lib/content/feeds/types";

type Section = { _type: string; _key: string; chapter?: { kind?: string | null; label?: string | null } | null } & Record<string, unknown>;

const LOCALES: readonly FeedContext["locale"][] = ["en", "es", "fr", "ar"];

/**
 * A community page's sections (CMS project 3): grouped into the chapters the
 * sections name, with the sticky chapter menu when there are two or more.
 *
 * Feeds are resolved up front (the same cached reads the feeds make): a feed
 * with nothing to show is dropped before grouping, so the menu never offers
 * an empty chapter, and a chapter that starts with a feed shows its count —
 * as the old page's menu did. Every section knows its community; staff get an
 * edit link per section, numbered by its row in the whole list.
 */
export default async function CommunitySections({
  sections,
  communityId,
  communitySlug,
  communityRegion = null,
  locale,
  userId,
  canEdit = false,
  editLabel,
  returnTo,
}: {
  sections: Section[];
  communityId: string;
  communitySlug: string;
  /** Items in this region count on the page even when not linked to the community. */
  communityRegion?: string | null;
  locale: string;
  userId?: string;
  canEdit?: boolean;
  editLabel?: string;
  /** The site path "Back to the page" returns to from the admin. */
  returnTo?: string;
}) {
  const feedLocale = LOCALES.includes(locale as FeedContext["locale"]) ? (locale as FeedContext["locale"]) : "en";
  const [t, counts] = await Promise.all([
    getTranslations({ locale, namespace: "regional" }),
    Promise.all(
      sections.map(async (section) => {
        if (section._type !== "content-feed") return null;
        try {
          const { items } = await resolveContentFeed(section.settings, { locale: feedLocale, communityId, communityRegion });
          return items.length;
        } catch {
          return null; // the feed renders (or hides) itself as usual
        }
      }),
    ),
  ]);

  // Keep each section's row in the whole list for the admin edit links.
  const shown = sections
    .map((section, row) => ({ ...section, _row: row, _count: counts[row] }))
    .filter((section) => section._count !== 0);

  const chapters = groupIntoChapters(shown, (kind) => t(`sectionTitles.${CHAPTER_MESSAGE[kind]}`));
  const menu = chapters
    .filter((c) => c.id && c.label)
    .map((c) => {
      const lead = c.blocks[0]._count;
      return { id: c.id!, label: c.label!, ...(typeof lead === "number" && lead > 0 ? { count: lead } : {}) };
    });

  return (
    <>
      {menu.length > 1 && <RegionSectionSpine sections={menu} />}
      {chapters.map((chapter) => {
        const rows = chapter.blocks.map((b) => b._row);
        return (
          <section key={chapter.id ?? `lead-${rows[0]}`} id={chapter.id ?? undefined} className="scroll-mt-14">
            <Blocks
              blocks={chapter.blocks}
              locale={locale}
              userId={userId}
              context={{ communityId, communitySlug, communityRegion }}
              editHref={canEdit ? (i) => sectionEditHref(`/admin/collections/regionalCommunities/${communityId}`, rows[i], returnTo ?? `/${locale}/communities/${communitySlug}`) : undefined}
              editLabel={editLabel}
            />
          </section>
        );
      })}
    </>
  );
}
