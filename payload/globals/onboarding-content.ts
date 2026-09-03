import type { Field, GlobalConfig, GroupField } from "payload";
import { isAnyone, isEditor } from "@/payload/access";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";

/**
 * Mirrors sanity/schemas/documents/onboarding-content.ts — an 850-line bag of
 * localized UI copy driving the whole onboarding flow: step titles, field
 * labels, placeholders, hints, validation messages. Verified against
 * production_2 (2026-09-03): **4 documents**, one per language
 * (`ar/en/es/fr`), 0 drafts. Lane A, so they collapse into one global with
 * four locales.
 *
 * The field list is not invented here. It is
 * `lib/content/onboarding.ts`'s `OnboardingContent` interface and the GROQ
 * projection beside it — the contract Phase 3 has to keep serving — checked
 * field-by-field against the Sanity schema and against what the four real
 * documents populate. Every one of the 48 top-level fields in that interface
 * is present below, and every one is populated on all 4 documents except
 * `communityInfoTitle`/`communityInfoDescription`/`communityInfoFieldHints`
 * (0/4 — declared by the schema and read by the interface, never authored;
 * kept for parity) and `slug` (1/4, dropped: a global has no slug).
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
 * ## The one shape change
 *
 * `welcomeSteps` is `array of string` in Sanity. Payload has no scalar array,
 * so it becomes an array of `{ step }` — the same treatment
 * `moderationSettings`' wordlists get. `welcomeFeatures` was already an array
 * of objects and is unchanged.
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

export const OnboardingContent: GlobalConfig = {
  slug: "onboardingContent",
  label: "Onboarding Content",
  access: {
    // The onboarding flow reads this for signed-out visitors mid-signup.
    read: isAnyone,
    update: isEditor,
  },
  admin: {
    description: "Every piece of copy the onboarding flow shows, in all four languages.",
  },
  fields: [
    localizedText("title", {
      label: "Content Title",
      admin: { description: 'Internal title for this content (e.g., "Onboarding Content")' },
    }),

    // ── 1. Welcome step ──────────────────────────────────────────────────
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

    // ── 2. Step intros and field hints ───────────────────────────────────
    localizedText("basicInfoTitle", { label: "Basic Info Step Title" }),
    localizedTextarea("basicInfoDescription", { label: "Basic Info Step Description" }),
    hintGroup("basicInfoFieldHints", "Basic Info Field Hints", [
      "usernameHint",
      "headlineHint",
      "bioHint",
      "motivationHint",
      "languageHint",
    ]),
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
    localizedText("recentWorkTitle", { label: "Recent Work Step Title" }),
    localizedTextarea("recentWorkDescription", { label: "Recent Work Step Description" }),
    hintGroup("recentWorkFieldHints", "Recent Work Field Hints", [
      "workLinkHint",
      "isOngoingHint",
      "noWorkDescription",
    ]),

    // ── 3. Privacy step ──────────────────────────────────────────────────
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

    // ── 4. Review & submit ───────────────────────────────────────────────
    localizedText("reviewTitle", { label: "Review Step Title" }),
    localizedTextarea("reviewDescription", { label: "Review Step Description" }),
    localizedText("reviewReadyTitle", { label: "Ready to Submit Title" }),
    localizedTextarea("reviewReadyDescription", { label: "Ready to Submit Description" }),
    localizedText("completeOnboardingText", { label: "Complete Onboarding Button Text" }),

    // ── 5. Redirect prompt ───────────────────────────────────────────────
    localizedText("redirectDialogTitle", { label: "Redirect Dialog Title" }),
    localizedTextarea("redirectDialogMessage", { label: "Redirect Dialog Message" }),
    localizedText("proceedToOnboardingText", { label: "Proceed to Onboarding Button Text" }),
    localizedText("continueToHubText", { label: "Continue to Hub Button Text" }),
    localizedText("oneTimeWaiverText", { label: "One-time Waiver Text" }),

    // ── UI labels & messages ─────────────────────────────────────────────
    labelGroup("navigationTexts", "Navigation Button Texts", ["continue", "back", "submit", "submitting"]),
    {
      name: "validationMessages",
      type: "group",
      label: "Form Validation Messages",
      localized: true,
      fields: [
        {
          name: "basicInfo",
          type: "group",
          fields: [
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
          ].map(text),
        },
        {
          name: "workInfo",
          type: "group",
          fields: [
            "workTypesRequired",
            "expertiseAreasRequired",
            "workBioTooLong",
            "invalidLinkedInUrl",
            "invalidWebsiteUrl",
            "invalidSocialLinkUrl",
            "socialLinkPlatformRequired",
          ].map(text),
        },
        {
          name: "recentWork",
          type: "group",
          fields: [
            "titleRequired",
            "titleTooLong",
            "descriptionRequired",
            "descriptionTooLong",
            "invalidUrl",
            "startDateRequired",
            "endDateRequired",
          ].map(text),
        },
        {
          name: "general",
          type: "group",
          fields: ["pleaseCompleteRequired", "validationError", "submissionError"].map(text),
        },
      ],
    },
    {
      name: "fieldLabels",
      type: "group",
      label: "Form Field Labels and Placeholders",
      localized: true,
      fields: [
        {
          name: "basicInfo",
          type: "group",
          fields: [
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
          ].map(text),
        },
        {
          name: "workInfo",
          type: "group",
          fields: [
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
          ].map(text),
        },
        {
          name: "recentWork",
          type: "group",
          fields: [
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
          ].map(text),
        },
        {
          name: "review",
          type: "group",
          fields: [
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
          ].map(text),
        },
      ],
    },
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
  ],
};
