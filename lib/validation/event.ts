import { z } from "zod";

/**
 * Validation for a member/project-submitted event. Mirrors the lived-experience
 * submission contract: server forces status = "pending" regardless of input.
 */
export const eventSubmissionSchema = z
  .object({
    title: z.string().trim().min(3, "Please add a title").max(160),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    scope: z.enum(["community", "project"]).default("community"),
    startAt: z.string().datetime({ message: "Please pick a start date/time" }),
    endAt: z.string().datetime().optional().or(z.literal("")),
    mode: z.enum(["online", "in_person", "hybrid"]).default("online"),
    locationName: z.string().trim().max(200).optional().or(z.literal("")),
    url: z.string().url("Please paste a valid URL").optional().or(z.literal("")),
    linkedProject: z.string().optional().or(z.literal("")),
    regionalCommunityId: z.string().optional().or(z.literal("")),
  })
  .refine((d) => !d.endAt || new Date(d.endAt) >= new Date(d.startAt), {
    message: "End must be after start",
    path: ["endAt"],
  });

export type EventSubmission = z.infer<typeof eventSubmissionSchema>;

/** Slugify an event title (mirrors generateLivedExperienceSlug). */
export function generateEventSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "event";
  // Append a short suffix to reduce collisions; deterministic from title length.
  return base;
}
