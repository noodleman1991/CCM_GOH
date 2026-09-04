/**
 * Which Payload fields are localized — read off the collection and global
 * configs themselves, never restated here.
 *
 * `transform.ts` needs this to answer one question: **may this field hold a
 * different value in `es` than it does in `en`?** Only a `localized: true`
 * field may. Writing `null` into any other field while updating the `es` lane
 * would clear it for every locale at once, because an unlocalized column lives
 * on the parent table and has exactly one value.
 *
 * ## Why only the scalar-ish types
 *
 * `array`, `blocks`, `group` and `tabs` are *containers*. A localized array is
 * one value per locale — the whole list — and Payload has no per-row fallback,
 * so a row whose text Sanity never translated must still carry the English
 * text or it renders blank. Containers are therefore written whole, exactly as
 * before; only leaves are eligible for the per-field decision. `SCALAR_TYPES`
 * is the list of what counts as a leaf.
 *
 * ## Why `required` is carried
 *
 * A required localized field cannot be cleared: Payload's `beforeChange`
 * validates the incoming value for the operation's locale (`promise.ts`
 * validates `siblingData[field.name]` directly), and `text`/`textarea`/
 * `richText` all reject `required && !value`. Only `array`/`blocks` get a
 * validation skip for a null in a non-default locale. So a required localized
 * leaf that Sanity never translated keeps the English fallback, and that
 * exception is recorded rather than hidden — see `buildTarget`.
 */

import type { Field, GlobalConfig } from "payload";

import { Agendas } from "@/payload/collections/agendas";
import { Authors } from "@/payload/collections/authors";
import { CaseStudies } from "@/payload/collections/case-studies";
import { CaseStudyDrafts } from "@/payload/collections/case-study-drafts";
import { DocsChapters } from "@/payload/collections/docs-chapters";
import { ExpertiseAreas } from "@/payload/collections/expertise-areas";
import { ExternalSources } from "@/payload/collections/external-sources";
import { LivedExperiences } from "@/payload/collections/lived-experiences";
import { NewsPosts } from "@/payload/collections/news-posts";
import { Organizations } from "@/payload/collections/organizations";
import { Pages } from "@/payload/collections/pages";
import { ProfilePrompts } from "@/payload/collections/profile-prompts";
import { RegionalCommunities } from "@/payload/collections/regional-communities";
import { RegionalCommunityPages } from "@/payload/collections/regional-community-pages";
import { ResearchOutputs } from "@/payload/collections/research-outputs";
import { Tags } from "@/payload/collections/tags";
import { Testimonials } from "@/payload/collections/testimonials";
import { WorkTypes } from "@/payload/collections/work-types";
import { Homepage, SiteAnnouncement } from "@/payload/globals";
import { ONBOARDING_CONTENT_FIELDS } from "@/payload/globals/onboarding-content";

/** A localized leaf: a field that may differ per locale and is not a container. */
export interface LocalizedField {
  /** Dot path from the document root, through `group`s only. */
  path: string;
  type: string;
  /** Required fields cannot be nulled — see the module comment. */
  required: boolean;
}

/**
 * The field types that hold one value, as opposed to a list of rows.
 * `relationship`/`upload` are single ids at this level (`hasMany` lists are
 * still one column, replaced whole, which is the same all-or-nothing shape).
 */
const SCALAR_TYPES = new Set([
  "text",
  "textarea",
  "richText",
  "number",
  "date",
  "email",
  "code",
  "json",
  "point",
  "select",
  "radio",
  "checkbox",
  "relationship",
  "upload",
]);

/** Field types whose children are addressable by a dot path from the root. */
const TRANSPARENT_TYPES = new Set(["group", "row", "collapsible", "tabs", "tab"]);

interface WalkState {
  /** Inside an `array`/`blocks` row: those are written whole, never per leaf. */
  inRow: boolean;
  /** Payload strips `localized` from any field under a localized parent. */
  parentLocalized: boolean;
}

function walk(fields: Field[], prefix: string, state: WalkState, out: Map<string, LocalizedField>): void {
  for (const raw of fields) {
    const field = raw as Field & { name?: string; localized?: boolean; required?: boolean; fields?: Field[] };
    const named = typeof field.name === "string" && field.name.length > 0;
    const path = named ? (prefix ? `${prefix}.${field.name}` : field.name!) : prefix;
    const localized = field.localized === true;

    if (localized && named && !state.inRow && !state.parentLocalized && SCALAR_TYPES.has(String(field.type))) {
      out.set(path, { path, type: String(field.type), required: field.required === true });
    }

    if (Array.isArray(field.fields)) {
      // Anything that is not a transparent container (`array`, `blocks`) puts
      // its children inside rows, which are written whole — recursed into only
      // so a nested container cannot smuggle a leaf back out.
      const transparent = TRANSPARENT_TYPES.has(String(field.type)) || !named;
      walk(
        field.fields,
        path,
        { inRow: state.inRow || !transparent, parentLocalized: state.parentLocalized || localized },
        out,
      );
    }
    const tabs = (field as { tabs?: { name?: string; fields?: Field[] }[] }).tabs;
    if (Array.isArray(tabs)) {
      for (const tab of tabs) {
        if (!Array.isArray(tab.fields)) continue;
        walk(tab.fields, tab.name ? (path ? `${path}.${tab.name}` : tab.name) : path, state, out);
      }
    }
  }
}

/** The localized leaves of one field list, keyed by dot path. */
export function localizedLeaves(fields: Field[]): Map<string, LocalizedField> {
  const out = new Map<string, LocalizedField>();
  walk(fields, "", { inRow: false, parentLocalized: false }, out);
  return out;
}

/**
 * Slug -> its localized leaves.
 *
 * `onboardingContent` is registered with the **merged** field list of all six
 * onboarding globals: `transform.ts` builds one unsplit payload and
 * `splitTarget` partitions it afterwards, so the locale decision has to be
 * made against the whole tree.
 */
const BY_SLUG: Map<string, ReadonlyMap<string, LocalizedField>> = new Map(
  (
    [
      Tags,
      WorkTypes,
      ExpertiseAreas,
      Organizations,
      RegionalCommunities,
      DocsChapters,
      ProfilePrompts,
      Authors,
      Agendas,
      CaseStudies,
      LivedExperiences,
      ResearchOutputs,
      NewsPosts,
      Testimonials,
      ExternalSources,
      CaseStudyDrafts,
      Pages,
      RegionalCommunityPages,
      Homepage as unknown as GlobalConfig,
      SiteAnnouncement as unknown as GlobalConfig,
    ] as { slug: string; fields: Field[] }[]
  ).map((config) => [config.slug, localizedLeaves(config.fields)] as const),
);
BY_SLUG.set("onboardingContent", localizedLeaves(ONBOARDING_CONTENT_FIELDS));

/**
 * The localized leaves of a collection or global, or an empty map for a slug
 * this module does not know — which makes the caller fall back to the old
 * whole-document behaviour rather than guess.
 */
export function localizedFieldsFor(slug: string): ReadonlyMap<string, LocalizedField> {
  return BY_SLUG.get(slug) ?? EMPTY;
}

const EMPTY: ReadonlyMap<string, LocalizedField> = new Map();
