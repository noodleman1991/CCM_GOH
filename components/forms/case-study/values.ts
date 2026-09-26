import { WRITING_LANGUAGES, type WritingLanguage } from "@/lib/validation/case-study";
import type { PlaceValue } from "@/components/forms/place-picker";
import type { AuthorRole } from "@/components/forms/case-study/byline-chips";
import type { CaseStudyLayout } from "@/components/forms/case-study/layout-chooser";

/** Everything the case study form holds, in one object (drafts save exactly this). */
export type CaseStudyValues = {
  originalLanguage: WritingLanguage;
  title: Partial<Record<WritingLanguage, string>>;
  excerpt: Partial<Record<WritingLanguage, string>>;
  content: unknown[];
  authors: Array<{ name: string; email?: string; role: AuthorRole }>;
  organizationName: string;
  place: PlaceValue | null;
  relatedCommunity: string;
  studyPeriod: { startDate: string; endDate: string };
  tags: string[];
  suggestedTags: string[];
  layout: CaseStudyLayout;
  /** null = the cover was removed (saved as such); undefined = none chosen yet. */
  imageAssetId?: string | null;
  imageUrl?: string | null;
};

export type DescribedBy = (path: string) => { "aria-invalid"?: true; "aria-describedby"?: string };

/** What every section gets from the form. */
export type SectionProps = {
  values: CaseStudyValues;
  set: (path: string, value: unknown) => void;
  errors: Record<string, string>;
  leave: (path: string) => void;
  describedBy: DescribedBy;
};

export function emptyValues(author?: { name: string; email: string }): CaseStudyValues {
  return {
    originalLanguage: "en",
    title: {},
    excerpt: {},
    content: [],
    authors: author ? [{ ...author, role: "lead" }] : [],
    organizationName: "",
    place: null,
    relatedCommunity: "",
    studyPeriod: { startDate: "", endDate: "" },
    tags: [],
    suggestedTags: [],
    layout: "story",
  };
}

/** A copy of `target` with `value` at a dotted path; every level on the way is copied. */
export function setAt<T>(target: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".");
  const node = (target ?? {}) as Record<string, unknown>;
  const copy: Record<string, unknown> = Array.isArray(node) ? ([...node] as never) : { ...node };
  copy[head] = rest.length === 0 ? value : setAt(node[head], rest.join("."), value);
  return copy as T;
}

const str = (value: unknown) => (typeof value === "string" ? value : "");
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function localized(value: unknown): Partial<Record<WritingLanguage, string>> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(WRITING_LANGUAGES.filter((l) => str(value[l])).map((l) => [l, str(value[l])]));
}

/** A stored draft, an on-device copy or a submitted case study, read back into form values. */
export function fromStored(raw: Record<string, unknown>, fallback: CaseStudyValues): CaseStudyValues {
  const lang = [raw.originalLanguage, raw.contentLanguage].find((l): l is WritingLanguage =>
    (WRITING_LANGUAGES as readonly unknown[]).includes(l),
  );
  const authors = Array.isArray(raw.authors)
    ? raw.authors.filter(isRecord).map((a) => ({
        name: str(a.name),
        email: str(a.email),
        role: (["lead", "coauthor", "contributor", "advisor"].includes(str(a.role)) ? a.role : "coauthor") as AuthorRole,
      }))
    : [];
  const tags = Array.isArray(raw.tags) ? raw.tags : Array.isArray(raw.selectedTags) ? raw.selectedTags : [];
  const period = isRecord(raw.studyPeriod) ? raw.studyPeriod : {};
  const layout = ["story", "feature", "report"].includes(str(raw.layout)) ? (raw.layout as CaseStudyLayout) : fallback.layout;
  const place = isRecord(raw.place) && typeof raw.place.lat === "number" && str(raw.place.text) ? (raw.place as PlaceValue) : null;
  return {
    ...fallback,
    originalLanguage: lang ?? fallback.originalLanguage,
    title: localized(raw.title),
    excerpt: localized(raw.excerpt),
    content: Array.isArray(raw.content) ? raw.content : [],
    authors: authors.length > 0 ? authors : fallback.authors,
    organizationName: str(raw.organizationName),
    place,
    relatedCommunity: str(raw.relatedCommunity),
    studyPeriod: { startDate: str(period.startDate), endDate: str(period.endDate) },
    tags: tags.filter((id): id is string => typeof id === "string"),
    suggestedTags: Array.isArray(raw.suggestedTags) ? raw.suggestedTags.filter((s): s is string => typeof s === "string") : [],
    layout,
    ...(str(raw.imageAssetId) ? { imageAssetId: str(raw.imageAssetId) } : {}),
    ...(str(raw.imageUrl) ? { imageUrl: str(raw.imageUrl) } : {}),
  };
}

/** True once the form holds something worth saving. */
export function hasAnything(v: CaseStudyValues): boolean {
  return (
    Object.values(v.title).some((s) => s?.trim()) ||
    Object.values(v.excerpt).some((s) => s?.trim()) ||
    v.content.length > 0 ||
    v.tags.length > 0 ||
    Boolean(v.place || v.relatedCommunity || v.imageAssetId)
  );
}
