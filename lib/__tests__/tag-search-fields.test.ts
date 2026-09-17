import { describe, expect, it } from "vitest";
import { tagSearchFields } from "@/lib/search/tag-search-fields";

/**
 * Tag audit, 2026-09-17. The live case_studies and agendas indices carried
 * ZERO tag values: the index readers projected `tags[]->{name}` (a field a tag
 * never had) and the record builders mapped `tag.name`. News indexed the
 * English label only, so a search in Arabic never matched a tag. One helper
 * now turns a tag list into the three fields every record carries:
 *
 *   tags      — one display label per tag (English, else any), the facet
 *   tagLabels — every language's label, searchable so /ar finds "حرارة"
 *   tagSlugs  — the stable `value`, filterOnly, for ?tags= deep links
 */
describe("tagSearchFields", () => {
  it("emits the display label, every localized label and the slug", () => {
    expect(
      tagSearchFields([
        { _id: "t1", label: { en: "Heat", ar: "حرارة", es: null }, value: "heat" },
        { _id: "t2", label: { fr: "Politique" }, value: "policy" },
      ]),
    ).toEqual({
      tags: ["Heat", "Politique"],
      tagLabels: ["Heat", "حرارة", "Politique"],
      tagSlugs: ["heat", "policy"],
    });
  });

  it("skips tags with no label at all, de-duplicates, and tolerates null/undefined", () => {
    expect(tagSearchFields([{ label: {} }, { label: { en: "Heat" }, value: "heat" }, { label: { en: "Heat" }, value: "heat" }])).toEqual({
      tags: ["Heat"],
      tagLabels: ["Heat"],
      tagSlugs: ["heat"],
    });
    expect(tagSearchFields(null)).toEqual({ tags: [], tagLabels: [], tagSlugs: [] });
    expect(tagSearchFields(undefined)).toEqual({ tags: [], tagLabels: [], tagSlugs: [] });
  });
});
