import { z } from "zod";

/**
 * Validation messages, keyed so they can be localized at the call site. The
 * default (English) map keeps the server route + tests working unchanged; the
 * client form passes a localized map built from the `livedExperienceSubmission`
 * translation namespace so users see errors in their language.
 */
export type LEValidationMessages = {
  titleMin: string;
  descriptionMin: string;
  issueMin: string;
  videoUrl: string;
};

export const LE_DEFAULT_MESSAGES: LEValidationMessages = {
  titleMin: "Please add a title",
  descriptionMin: "Please describe the experience",
  issueMin: "What issue does this speak to?",
  videoUrl: "Please paste a valid video link",
};

/**
 * Build the lived-experience submission schema with the given messages.
 * Validation for a user-submitted lived experience: a video link + the person's
 * own words about themselves and the issue, plus optional region/tags.
 */
export function makeLivedExperienceSchema(m: LEValidationMessages = LE_DEFAULT_MESSAGES) {
  return z.object({
    title: z.string().trim().min(3, m.titleMin).max(160),
    description: z.string().trim().min(10, m.descriptionMin).max(800),
    issue: z.string().trim().min(5, m.issueMin).max(400),
    personContext: z.string().trim().max(400).optional().or(z.literal("")),
    videoLink: z.string().url(m.videoUrl),
    regionalCommunityId: z.string().optional().or(z.literal("")),
    tagIds: z.array(z.string()).max(6).optional().default([]),
    language: z.enum(["en", "es", "fr", "ar"]).default("en"),
  });
}

/** Default (English) schema — used by the API route and tests. */
export const livedExperienceSubmissionSchema = makeLivedExperienceSchema();

export type LivedExperienceSubmission = z.infer<typeof livedExperienceSubmissionSchema>;

/** A URL-safe slug from the title (+ a short random suffix for uniqueness). */
export function generateLivedExperienceSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "lived-experience"}-${suffix}`;
}
