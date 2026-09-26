/**
 * Shared normalizers for the raw tag/region projections almost every GROQ
 * query in lib/content/ dereferences the same way. Hoisted out of the first
 * domain module (lived experiences) because the remaining domains re-type
 * this exact shape too — sharing it now is cheaper than de-duplicating nine
 * near-identical copies later.
 */
import type { ContentRegion, ContentTag, Localized } from "@/lib/content/types";

/** The `tag[]->{ _id, label, value, color }` dereference. */
export interface RawTag {
  _id: string;
  label?: Localized;
  value?: string;
  color?: string;
}

/** The `region->{ _id, name, "slug": slug.current }` (or regionalCommunity) dereference. */
export interface RawRegion {
  _id: string;
  name?: Localized;
  slug?: string;
}

export function toTag(t: RawTag): ContentTag {
  return {
    id: t._id,
    label: t.label ?? {},
    value: t.value,
    color: t.color,
  };
}

export function toRegion(r: RawRegion): ContentRegion {
  return {
    id: r._id,
    name: r.name ?? {},
    slug: r.slug ?? "",
  };
}
