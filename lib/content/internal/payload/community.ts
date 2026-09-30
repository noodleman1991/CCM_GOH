/**
 * A regional community's page (CMS project 3): its record's Sections, in one
 * language. The shared list, or — with the per-language switch on — that
 * language's own list (English's when it is empty); text collapsed to the
 * language with English per field; each section mapped by the same adapter
 * pages use, with its chapter carried along for the page menu.
 *
 * `sections: []` means "not moved yet": the route then renders the old page.
 */
import "server-only";
import { queryPreviewable } from "@/lib/content/internal/payload-source";
import { collapseLocales } from "@/lib/content/internal/localize";
import { pageBlocks } from "@/lib/content/internal/payload/blocks";
import { imageGroup } from "@/lib/content/internal/image-shape";
import type { Locale } from "@/lib/content/types";

type Row = Record<string, unknown>;

export interface CommunityPage {
  id: string;
  slug: string;
  name: string;
  sections: unknown[];
  /** User ids of the community's leads — they see "Edit this section" here (editor-experience spec §3.5). */
  leadIds: string[];
  /** The community's region code (e.g. "oce"), for feeds that count items in its region. */
  region: string | null;
  meta_title: string | null;
  meta_description: string | null;
  noindex: boolean;
  ogImage: unknown;
}

const isRow = (v: unknown): v is Row => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : null);

function sectionList(record: Row, locale: Locale): unknown[] {
  let list: unknown = record.sections;
  if (record.layoutPerLanguage === true && isRow(record.sectionsByLanguage)) {
    const own = record.sectionsByLanguage[locale];
    list = Array.isArray(own) && own.length > 0 ? own : record.sectionsByLanguage.en;
  }
  return Array.isArray(list) ? list : [];
}

export async function findCommunity(slug: string, locale: Locale): Promise<CommunityPage | null> {
  const result = await queryPreviewable<{ docs?: Row[] }>({
    type: "find",
    collection: "regionalCommunities",
    where: { slug: { equals: slug } },
    locale: "all",
    // Only what the page needs: the whole record at depth 3 in every language
    // came to ~2.4 MB, over Next's 2 MB data-cache limit, so it could never be
    // cached (and a stale answer kept being served). Depth 2 reaches an
    // organisation's logo inside a logo strip.
    depth: 2,
    select: {
      slug: true,
      name: true,
      layoutPerLanguage: true,
      sections: true,
      sectionsByLanguage: true,
      leadIds: true,
      region: true,
      meta_title: true,
      meta_description: true,
      noindex: true,
      ogImage: true,
    },
    limit: 1,
    pagination: false,
  });
  const record = result?.docs?.[0];
  if (!record) return null;

  const rows = collapseLocales(sectionList(record, locale), locale) as Row[];
  const sections = rows.flatMap((row) => {
    const mapped = pageBlocks([row])?.[0];
    if (!isRow(mapped)) return [];
    const chapter = isRow(row.chapter) ? row.chapter : {};
    return [{ ...mapped, chapter: { kind: text(chapter.kind), label: text(chapter.label) } }];
  });

  return {
    id: String(record.id),
    slug: String(record.slug ?? slug),
    name: text(collapseLocales(record.name, locale)) ?? "",
    sections,
    leadIds: Array.isArray(record.leadIds) ? record.leadIds.map(String) : [],
    region: text(record.region),
    meta_title: text(collapseLocales(record.meta_title, locale)),
    meta_description: text(collapseLocales(record.meta_description, locale)),
    noindex: record.noindex === true,
    ogImage: imageGroup(record.ogImage, { asset: ["_id", "url", "dimensions"], keys: ["alt"] }),
  };
}
