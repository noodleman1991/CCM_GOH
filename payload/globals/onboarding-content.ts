import type { Field, GlobalConfig, GroupField } from "payload";
import { isAnyone, isEditor } from "@/payload/access";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";

/**
 * Mirrors sanity/schemas/documents/onboarding-content.ts — an 850-line bag of
 * localized UI copy driving the whole onboarding flow: step titles, field
 * labels, placeholders, hints, validation messages. Verified against
 * production_2 (2026-09-03): **4 documents**, one per language
 * (`ar/en/es/fr`), 0 drafts. Lane A, so they collapse into locales.
 *
 * The field list is not invented here. It is
 * `lib/content/onboarding.ts`'s `OnboardingContent` interface and the GROQ
 * projection beside it — the contract Phase 3 has to keep serving — checked
 * field-by-field against the Sanity schema and against what the four real
 * documents populate. Every one of the 48 top-level fields in that interface
 * is present below, and every one is *present by name* on all 4 documents
 * except `communityInfoTitle`/`communityInfoDescription`/
 * `communityInfoFieldHints` (0/4 — declared by the schema and read by the
 * interface, never authored; kept for parity) and `slug` (1/4, dropped: a
 * global has no slug).
 *
 * ## One shape, six globals — why the split
 *
 * This was **one** global, and as one global it could not be read at all.
 * Flattened, its copy is 194 localized columns; Payload's Postgres adapter
 * reads a localized table through `json_agg(json_build_array(<every
 * column>))` and Postgres caps any function at 100 arguments
 * (`FUNC_MAX_ARGS`, a compile-time constant, not a setting). Every
 * `findGlobal`, `updateGlobal`, `/admin` render and Phase-3 `getGlobal` on it
 * failed with SQLSTATE 54023 (task-12-report.md).
 *
 * The homepage solved the same problem by de-localizing its presentation
 * fields. That is not available here: **194 of the 197 columns are varchar**
 * — genuinely translatable UI strings, every one of them. So the fix is
 * structural. The copy is split along the flow's own steps, one global per
 * step, each far below the cap:
 *
 *   onboardingContent     17 localized columns   welcome, redirect, navigation
 *   onboardingBasicInfo   39                     step 1
 *   onboardingWorkInfo    36                     step 2 (+ community selection)
 *   onboardingRecentWork  29                     step 3
 *   onboardingPrivacy     35                     step 4
 *   onboardingReview      38                     step 5
 *
 * **The field shape is unchanged.** `fieldLabels` and `validationMessages`
 * are containers whose sub-groups belong to different steps, so each step's
 * global declares that container holding only its own sub-group —
 * `fieldLabels.basicInfo.firstName` still lives at exactly that path.
 * `ONBOARDING_CONTENT_FIELDS` is the six lists merged back into the single
 * declared tree (the importer fills against it, so what the import considers
 * "unplaced" is unchanged by the split), and `composeOnboardingContent` is
 * the run-time counterpart Phase 3's `getOnboardingContent(locale)` uses to
 * hand its callers one object. Storage is six globals; the shape the app
 * consumes is one.
 *
 * ## Present by name is not present by shape — and the stored values are dead
 *
 * Six fields carry a **scalar** in `production_2` where both the Sanity
 * schema and these globals declare a container, on all 4 documents:
 *
 *   - `basicInfoFieldHints`, `workInfoFieldHints`, `recentWorkFieldHints`,
 *     `privacyFieldHints`, `visibilityOptions` — a plain string, not the
 *     object of named sub-labels declared for them.
 *   - `welcomeSteps` — a plain string, not a list (see "The one shape change"
 *     below for the array-of-`{ step }` form it is declared as here).
 *
 * **None of those six stored values is imported, and nothing is lost by that.**
 * They are already unreachable in production: every consumer reaches through
 * the container for a named member, e.g.
 * `components/onboarding/panels/basic-info-panel.tsx:184`
 *
 *     content?.basicInfoFieldHints?.usernameHint || t("usernameHint")
 *
 * A string has no `usernameHint` property, so that read has always been
 * `undefined` and the flow has always fallen through to the i18n translation.
 * The copy users actually see comes from `messages/*.json`, not from these
 * documents.
 *
 * So these globals deliberately keep the **declared container shape** — the
 * shape the components actually ask for — rather than degrading to the scalar
 * that happens to be stored. Authoring these fields in Payload will therefore
 * work, and take effect on the page, in a way it never did in Sanity.
 *
 * ## Localization
 *
 * Every field is localized at the top level — scalars via
 * `localizedText`/`localizedTextarea`, groups and arrays via `localized:
 * true` on the container. The nested labels inside a localized group are
 * plain `text`: Payload 3.88 strips `localized` from any field whose parent
 * is localized, so declaring it twice would be noise that reads as meaning
 * something.
 *
 * ## The one shape change against the Sanity *schema*
 *
 * (Distinct from the stored-data divergences above.) `welcomeSteps` is
 * `array of string` in Sanity. Payload has no scalar array, so it becomes an
 * array of `{ step }` — the same treatment `moderationSettings`' wordlists
 * get. `welcomeFeatures` was already an array of objects and is unchanged.
 */

const text = (name: string): Field => ({ name, type: "text" });
const textarea = (name: string): Field => ({ name, type: "textarea" });

/** A localized group of plain single-line labels. */
function labelGroup(name: string, label: string, names: string[]): GroupField {
  return { name, type: "group", label, localized: true, fields: names.map(text) };
}

/** A localized group of plain multi-line hints. */
function hintGroup(name: string, label: string, names: string[]): GroupField {
  return { name, type: "group", label, localized: true, fields: names.map(textarea) };
}

/** A plain sub-group of one shared container (`fieldLabels.basicInfo`, …). */
function subGroup(name: string, names: string[]): GroupField {
  return { name, type: "group", fields: names.map(text) };
}

/**
 * `fieldLabels` / `validationMessages` — the two containers whose sub-groups
 * belong to different steps. Each step declares the container holding only
 * its own sub-group; the composed tree holds all of them.
 */
function fieldLabels(...groups: GroupField[]): GroupField {
  return {
    name: "fieldLabels",
    type: "group",
    label: "Form Field Labels and Placeholders",
    localized: true,
    fields: groups,
  };
}

function validationMessages(...groups: GroupField[]): GroupField {
  return {
    name: "validationMessages",
    type: "group",
    label: "Form Validation Messages",
    localized: true,
    fields: groups,
  };
}

/* ------------------------------------------------------------- the sections */
/* Functions, not consts: Payload's `sanitizeField` MUTATES field objects (it
 * deletes `localized` under a localized parent), so every global — and the
 * composed tree — must get its own copy. */

/** Welcome step, the redirect prompt, and the navigation buttons. */
function welcomeFields(): Field[] {
  return [
    localizedText("title", {
      label: "Content Title",
      admin: { description: 'Internal title for this content (e.g., "Onboarding Content")' },
    }),
    localizedText("welcomeTitle", { label: "Welcome Title" }),
    localizedTextarea("welcomeSubtitle", { label: "Welcome Subtitle" }),
    localizedTextarea("welcomeDescription", { label: "Welcome Description" }),
    {
      name: "welcomeFeatures",
      type: "array",
      label: "Welcome Features",
      localized: true,
      fields: [text("title"), textarea("description")],
    },
    {
      name: "welcomeSteps",
      type: "array",
      label: "What to Expect Steps",
      localized: true,
      admin: { description: "One step per row. Sanity stored these as bare strings; each is a `step` here." },
      fields: [text("step")],
    },
    localizedText("gettingStartedTitle", { label: "Getting Started Title" }),
    localizedTextarea("gettingStartedDescription", { label: "Getting Started Description" }),
    localizedText("getStartedText", { label: "Get Started Button Text" }),
    localizedText("timeEstimate", { label: "Time Estimate Text" }),
    localizedText("redirectDialogTitle", { label: "Redirect Dialog Title" }),
    localizedTextarea("redirectDialogMessage", { label: "Redirect Dialog Message" }),
    localizedText("proceedToOnboardingText", { label: "Proceed to Onboarding Button Text" }),
    localizedText("continueToHubText", { label: "Continue to Hub Button Text" }),
    localizedText("oneTimeWaiverText", { label: "One-time Waiver Text" }),
    labelGroup("navigationTexts", "Navigation Button Texts", ["continue", "back", "submit", "submitting"]),
  ];
}

/** Step 1 — name, username, headline, bio, location. */
function basicInfoFields(): Field[] {
  return [
    localizedText("basicInfoTitle", { label: "Basic Info Step Title" }),
    localizedTextarea("basicInfoDescription", { label: "Basic Info Step Description" }),
    hintGroup("basicInfoFieldHints", "Basic Info Field Hints", [
      "usernameHint",
      "headlineHint",
      "bioHint",
      "motivationHint",
      "languageHint",
    ]),
    fieldLabels(
      subGroup("basicInfo", [
        "firstName",
        "lastName",
        "username",
        "headline",
        "headlinePlaceholder",
        "bio",
        "bioPlaceholder",
        "motivation",
        "motivationPlaceholder",
        "ageGroup",
        "selectAge",
        "under18",
        "above18",
        "country",
        "city",
        "preferredLanguage",
        "firstNamePlaceholder",
        "lastNamePlaceholder",
        "usernamePlaceholder",
        "countryPlaceholder",
        "cityPlaceholder",
      ]),
    ),
    validationMessages(
      subGroup("basicInfo", [
        "firstNameRequired",
        "firstNameTooLong",
        "lastNameRequired",
        "lastNameTooLong",
        "usernameRequired",
        "usernameTooShort",
        "usernameTooLong",
        "usernameInvalidFormat",
        "bioTooLong",
        "countryRequired",
        "cityRequired",
      ]),
    ),
  ];
}

/** Step 2 — work types, expertise, organization, links, and the community picker. */
function workInfoFields(): Field[] {
  return [
    localizedText("workInfoTitle", { label: "Work Info Step Title" }),
    localizedTextarea("workInfoDescription", { label: "Work Info Step Description" }),
    hintGroup("workInfoFieldHints", "Work Info Field Hints", [
      "workTypesDescription",
      "expertiseDescription",
      "workBioHint",
      "socialLinksDescription",
      "communitiesDescription",
    ]),
    localizedText("communityInfoTitle", { label: "Community Selection Step Title" }),
    localizedTextarea("communityInfoDescription", { label: "Community Selection Step Description" }),
    hintGroup("communityInfoFieldHints", "Community Selection Field Hints", [
      "communitiesDescription",
      "communitiesHint",
      "optionalNote",
    ]),
    fieldLabels(
      subGroup("workInfo", [
        "workTypes",
        "expertiseAreas",
        "regionalCommunities",
        "regionalCommunitiesHint",
        "organization",
        "organizationPlaceholder",
        "position",
        "positionPlaceholder",
        "workBio",
        "workBioPlaceholder",
        "socialLinks",
        "linkedin",
        "linkedinPlaceholder",
        "otherLinks",
        "otherLinksHint",
        "website",
        "websitePlaceholder",
      ]),
    ),
    validationMessages(
      subGroup("workInfo", [
        "workTypesRequired",
        "expertiseAreasRequired",
        "workBioTooLong",
        "invalidLinkedInUrl",
        "invalidWebsiteUrl",
        "invalidSocialLinkUrl",
        "socialLinkPlatformRequired",
      ]),
    ),
  ];
}

/** Step 3 — the recent-work list and its editor. */
function recentWorkFields(): Field[] {
  return [
    localizedText("recentWorkTitle", { label: "Recent Work Step Title" }),
    localizedTextarea("recentWorkDescription", { label: "Recent Work Step Description" }),
    hintGroup("recentWorkFieldHints", "Recent Work Field Hints", [
      "workLinkHint",
      "isOngoingHint",
      "noWorkDescription",
    ]),
    fieldLabels(
      subGroup("recentWork", [
        "yourWork",
        "addWork",
        "editWork",
        "updateWork",
        "workTitle",
        "workTitlePlaceholder",
        "description",
        "descriptionPlaceholder",
        "projectLink",
        "startDate",
        "endDate",
        "ongoingProject",
        "ongoing",
        "viewProject",
        "cancel",
        "noWorkAdded",
        "addWorkHint",
      ]),
    ),
    validationMessages(
      subGroup("recentWork", [
        "titleRequired",
        "titleTooLong",
        "descriptionRequired",
        "descriptionTooLong",
        "invalidUrl",
        "startDateRequired",
        "endDateRequired",
      ]),
    ),
  ];
}

/** Step 4 — searchability, profile visibility, and per-field privacy toggles. */
function privacyFields(): Field[] {
  return [
    localizedText("privacyTitle", { label: "Privacy Settings Title" }),
    localizedTextarea("privacyDescription", { label: "Privacy Settings Description" }),
    localizedText("searchabilityTitle", { label: "Searchability Section Title" }),
    localizedTextarea("searchabilityDescription", { label: "Searchability Description" }),
    localizedTextarea("searchabilityHint", { label: "Searchability Toggle Hint" }),
    localizedText("visibilityTitle", { label: "Profile Visibility Title" }),
    localizedTextarea("visibilityDescription", { label: "Profile Visibility Description" }),
    {
      name: "visibilityOptions",
      type: "group",
      label: "Visibility Options Explanations",
      localized: true,
      fields: [
        text("publicTitle"),
        textarea("publicDescription"),
        text("membersTitle"),
        textarea("membersDescription"),
        text("privateTitle"),
        textarea("privateDescription"),
      ],
    },
    localizedText("profileInfoTitle", { label: "Profile Information Visibility Title" }),
    localizedTextarea("profileInfoDescription", { label: "Profile Information Visibility Description" }),
    hintGroup("privacyFieldHints", "Privacy Field Hints", [
      "emailHint",
      "phoneHint",
      "workHint",
      "socialHint",
      "locationHint",
    ]),
    labelGroup("privacyFieldLabels", "Privacy Settings Field Labels", [
      "allowSearch",
      "searchHint",
      "showEmail",
      "emailHint",
      "showPhone",
      "phoneHint",
      "showWork",
      "workHint",
      "showSocial",
      "socialHint",
      "showLocation",
      "locationHint",
    ]),
    labelGroup("visibilityLabels", "Profile Visibility Labels", ["public", "members", "private"]),
  ];
}

/** Step 5 — the review summary and the submit button. */
function reviewFields(): Field[] {
  return [
    localizedText("reviewTitle", { label: "Review Step Title" }),
    localizedTextarea("reviewDescription", { label: "Review Step Description" }),
    localizedText("reviewReadyTitle", { label: "Ready to Submit Title" }),
    localizedTextarea("reviewReadyDescription", { label: "Ready to Submit Description" }),
    localizedText("completeOnboardingText", { label: "Complete Onboarding Button Text" }),
    fieldLabels(
      subGroup("review", [
        "basicInfo",
        "workInfo",
        "recentWork",
        "privacySettings",
        "name",
        "username",
        "location",
        "language",
        "ageGroup",
        "bio",
        "workTypes",
        "expertiseAreas",
        "regionalCommunities",
        "organization",
        "position",
        "workBio",
        "socialLinks",
        "profileVisibility",
        "searchable",
        "showEmail",
        "showPhone",
        "showWork",
        "showSocial",
        "showLocation",
        "yes",
        "no",
        "under18",
        "above18",
        "readyToSubmit",
        "submissionNote",
      ]),
    ),
    validationMessages(subGroup("general", ["pleaseCompleteRequired", "validationError", "submissionError"])),
  ];
}

/* -------------------------------------------------------------- the globals */

function onboardingGlobal(slug: string, label: string, description: string, fields: Field[]): GlobalConfig {
  return {
    slug,
    label,
    access: {
      // The onboarding flow reads this for signed-out visitors mid-signup.
      read: isAnyone,
      update: isEditor,
    },
    admin: { description, group: "Settings" },
    fields,
  };
}

/**
 * The shell: the welcome step, the redirect prompt, and the copy every step
 * shows. It **keeps the original `onboardingContent` slug** — it is the part
 * that is not owned by any one step, and keeping it makes the split a pure
 * narrowing of `onboarding_content_locales` (194 columns to 17) with five new
 * tables beside it, rather than a table swap.
 */
export const OnboardingContent = onboardingGlobal(
  "onboardingContent",
  "Welcome & navigation",
  "The welcome step, the redirect prompt, and the buttons shown on every step.",
  welcomeFields(),
);

export const OnboardingBasicInfo = onboardingGlobal(
  "onboardingBasicInfo",
  "Step 1: Basic info",
  "Step 1: name, username, headline, bio and location — labels, hints and validation messages.",
  basicInfoFields(),
);

export const OnboardingWorkInfo = onboardingGlobal(
  "onboardingWorkInfo",
  "Step 2: Work & communities",
  "Step 2: work types, expertise, organization, links and the community picker.",
  workInfoFields(),
);

export const OnboardingRecentWork = onboardingGlobal(
  "onboardingRecentWork",
  "Step 3: Recent work",
  "Step 3: the recent-work list and the form that adds to it.",
  recentWorkFields(),
);

export const OnboardingPrivacy = onboardingGlobal(
  "onboardingPrivacy",
  "Step 4: Privacy & visibility",
  "Step 4: searchability, profile visibility and the per-field privacy toggles.",
  privacyFields(),
);

export const OnboardingReview = onboardingGlobal(
  "onboardingReview",
  "Step 5: Review & submit",
  "Step 5: the review summary labels and the submit button.",
  reviewFields(),
);

/** The six globals the onboarding copy is stored in, in flow order. */
export const ONBOARDING_GLOBALS: GlobalConfig[] = [
  OnboardingContent,
  OnboardingBasicInfo,
  OnboardingWorkInfo,
  OnboardingRecentWork,
  OnboardingPrivacy,
  OnboardingReview,
];

/** Their slugs, in the same order — the read order Phase 3 composes in. */
export const ONBOARDING_GLOBAL_SLUGS: readonly string[] = ONBOARDING_GLOBALS.map((g) => g.slug);

/* ------------------------------------------------- one shape, six documents */

/**
 * The six field lists merged back into the single declared tree — the shape
 * `lib/content/onboarding.ts`'s `OnboardingContent` interface describes and
 * the importer fills against. Two entries with the same name are merged only
 * when both are groups (`fieldLabels`, `validationMessages`); anything else
 * appearing twice would be a modelling mistake and throws.
 */
export const ONBOARDING_CONTENT_FIELDS: Field[] = mergeFieldLists([
  welcomeFields(),
  basicInfoFields(),
  workInfoFields(),
  recentWorkFields(),
  privacyFields(),
  reviewFields(),
]);

function mergeFieldLists(lists: Field[][]): Field[] {
  const out: Field[] = [];
  const byName = new Map<string, GroupField>();
  for (const list of lists) {
    for (const field of list) {
      const name = "name" in field ? field.name : undefined;
      if (!name) {
        out.push(field);
        continue;
      }
      const seen = byName.get(name);
      if (!seen) {
        if (field.type === "group") byName.set(name, field);
        else byName.set(name, field as unknown as GroupField);
        out.push(field);
        continue;
      }
      if (seen.type !== "group" || field.type !== "group") {
        throw new Error(`onboarding globals declare "${name}" twice and it is not a group`);
      }
      seen.fields = mergeFieldLists([seen.fields, field.fields]);
    }
  }
  return out;
}

/**
 * Composes what the six globals return into the single object the onboarding
 * components read — Phase 3's `getOnboardingContent(locale)` is this over six
 * `payload.findGlobal` calls. `fieldLabels` and `validationMessages` arrive
 * from several parts and are merged rather than overwritten; every other key
 * comes from exactly one part.
 */
export function composeOnboardingContent(
  parts: readonly (Record<string, unknown> | null | undefined)[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const part of parts) {
    if (!part) continue;
    for (const [key, value] of Object.entries(part)) {
      const existing = out[key];
      out[key] = isPlainObject(existing) && isPlainObject(value)
        ? composeOnboardingContent([existing, value])
        : value;
    }
  }
  return out;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
