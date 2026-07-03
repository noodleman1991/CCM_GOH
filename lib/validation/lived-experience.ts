import { z } from "zod";
import { youtubeId } from "@/lib/youtube";
import { vimeoId } from "@/lib/vimeo";

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
  youtubeUrl: string;
  vimeoUrl: string;
};

export const LE_DEFAULT_MESSAGES: LEValidationMessages = {
  titleMin: "Please add a title",
  descriptionMin: "Please describe the experience",
  issueMin: "What issue does this speak to?",
  videoUrl: "Please paste a valid video link",
  youtubeUrl: "Please paste a valid YouTube link",
  vimeoUrl: "Please paste a valid Vimeo link",
};

/** Upload cap for directly uploaded videos (client + server enforced). */
export const LE_VIDEO_MAX_BYTES = 100 * 1024 * 1024; // 100MB
export const LE_VIDEO_MIME_TYPES = ["video/mp4", "video/webm"];

/**
 * Build the lived-experience submission schema with the given messages.
 * Validation for a user-submitted lived experience: a video (YouTube/Vimeo
 * link or a direct upload) + the person's own words about themselves and the
 * issue, an optional long-form body, plus optional region/tags.
 *
 * `videoSource` steers the video rules:
 *  - "youtube" / "vimeo" → videoLink must parse as that platform's URL,
 *  - "upload" → no link needed (the file itself is validated by the route),
 *  - absent (legacy clients) → videoLink must simply be a valid URL.
 */
export function makeLivedExperienceSchema(m: LEValidationMessages = LE_DEFAULT_MESSAGES) {
  return z
    .object({
      title: z.string().trim().min(3, m.titleMin).max(160),
      // Present when submitting from a workspace (?workspace=) — the route
      // links the created doc back as a workspace output.
      collaborationId: z.string().optional(),
      description: z.string().trim().min(10, m.descriptionMin).max(800),
      issue: z.string().trim().min(5, m.issueMin).max(400),
      personContext: z.string().trim().max(400).optional().or(z.literal("")),
      videoSource: z.enum(["youtube", "vimeo", "upload"]).optional(),
      videoLink: z.string().trim().optional().or(z.literal("")),
      // Portable Text body from the shared editor (blog-post feel). Validated
      // structurally by the editor; kept open here like the case-study flow.
      body: z.array(z.any()).optional(),
      regionalCommunityId: z.string().optional().or(z.literal("")),
      tagIds: z.array(z.string()).max(6).optional().default([]),
      language: z.enum(["en", "es", "fr", "ar"]).default("en"),
    })
    .superRefine((data, ctx) => {
      const link = data.videoLink || "";
      switch (data.videoSource) {
        case "upload":
          // The file travels outside JSON (multipart); the route enforces
          // its presence, type and the 100MB cap.
          return;
        case "youtube":
          if (!youtubeId(link)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["videoLink"], message: m.youtubeUrl });
          }
          return;
        case "vimeo":
          if (!vimeoId(link)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["videoLink"], message: m.vimeoUrl });
          }
          return;
        default:
          // Legacy clients (no videoSource): any valid URL, as before.
          if (!z.string().url().safeParse(link).success) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["videoLink"], message: m.videoUrl });
          }
      }
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
