import { z } from "zod";

/**
 * Validation for a user-submitted lived experience. Kept intentionally light:
 * a video link + the person's own words about themselves and the issue, plus
 * optional region/tags. The submitter writes the person/issue content.
 */
export const livedExperienceSubmissionSchema = z.object({
  // Title + the three short narrative fields (in the submitter's language; other
  // locales are filled by editors / translation later).
  title: z.string().trim().min(3, "Please add a title").max(160),
  description: z.string().trim().min(10, "Please describe the experience").max(800),
  issue: z.string().trim().min(5, "What issue does this speak to?").max(400),
  personContext: z.string().trim().max(400).optional().or(z.literal("")),

  // External video (YouTube / Vimeo / …).
  videoLink: z.string().url("Please paste a valid video link"),

  // Optional metadata.
  regionalCommunityId: z.string().optional().or(z.literal("")),
  tagIds: z.array(z.string()).max(6).optional().default([]),

  // The locale the submitter wrote in (so we know which field to populate).
  language: z.enum(["en", "es", "fr", "ar"]).default("en"),
});

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
