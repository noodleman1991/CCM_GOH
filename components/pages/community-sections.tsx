import { getTranslations } from "next-intl/server";
import Blocks from "@/components/blocks";
import { RegionSectionSpine } from "@/components/regions/region-section-spine";
import { CHAPTER_MESSAGE, groupIntoChapters } from "@/lib/content/chapters";

type Section = { _type: string; _key: string; chapter?: { kind?: string | null; label?: string | null } | null } & Record<string, unknown>;

/**
 * A community page's sections (CMS project 3): grouped into the chapters the
 * sections name, with the sticky chapter menu when there are two or more.
 * Every section knows its community; staff get an edit link per section.
 */
export default async function CommunitySections({
  sections,
  communityId,
  communitySlug,
  locale,
  userId,
  canEdit = false,
  editLabel,
}: {
  sections: Section[];
  communityId: string;
  communitySlug: string;
  locale: string;
  userId?: string;
  canEdit?: boolean;
  editLabel?: string;
}) {
  const t = await getTranslations({ locale, namespace: "regional" });
  const chapters = groupIntoChapters(sections, (kind) => t(`sectionTitles.${CHAPTER_MESSAGE[kind]}`));
  const menu = chapters.filter((c) => c.id && c.label).map((c) => ({ id: c.id!, label: c.label! }));

  // Where each chapter starts in the whole list — the admin numbers rows across it.
  const starts = chapters.map((_, i) => chapters.slice(0, i).reduce((n, c) => n + c.blocks.length, 0));

  return (
    <>
      {menu.length > 1 && <RegionSectionSpine sections={menu} />}
      {chapters.map((chapter, index) => {
        const start = starts[index];
        return (
          <section key={chapter.id ?? `lead-${start}`} id={chapter.id ?? undefined} className="scroll-mt-14">
            <Blocks
              blocks={chapter.blocks}
              locale={locale}
              userId={userId}
              context={{ communityId, communitySlug }}
              editHref={canEdit ? (i) => `/admin/collections/regionalCommunities/${communityId}#sections-row-${start + i}` : undefined}
              editLabel={editLabel}
            />
          </section>
        );
      })}
    </>
  );
}
