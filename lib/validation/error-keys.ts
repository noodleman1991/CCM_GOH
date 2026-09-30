/** Message keys under `forms.errors` in messages/*.json. Schemas use these as zod messages. */
export const ERROR_KEYS = {
  titleRequired: "title.required",
  titleTooShort: "title.tooShort",
  summaryRequired: "summary.required",
  summaryTooShort: "summary.tooShort",
  englishTitleRequired: "englishTitle.required",
  englishSummaryTooShort: "englishSummary.tooShort",
  storyRequired: "story.required",
  authorsRequired: "authors.required",
  authorNameRequired: "author.nameRequired",
  authorEmail: "author.email",
  themeRequired: "tags.themeRequired",
  locationRequired: "location.required",
  endBeforeStart: "dates.endBeforeStart",
  tooLong: "generic.tooLong",
  uploadTooBig: "upload.tooBig",
  uploadWrongType: "upload.wrongType",
  /** The shared image upload route, which also takes GIF (stories, workspace docs). */
  uploadWrongTypeImage: "upload.wrongTypeImage",
  formFixBelow: "form.fixBelow",
  formGeneric: "form.generic",
  formRateLimited: "form.rateLimited",
  formNotAllowed: "form.notAllowed",
  formSignIn: "form.signIn",
  eventSuggestionsPaused: "events.paused",
  eventSuggestionsBlocked: "events.blocked",
  eventSuggestionsTooMany: "events.tooMany",
  eventWebsiteRequired: "events.websiteRequired",
  eventWebsiteFormat: "events.websiteFormat",
  eventStartRequired: "events.startRequired",
} as const;

export type ErrorKey = (typeof ERROR_KEYS)[keyof typeof ERROR_KEYS];
