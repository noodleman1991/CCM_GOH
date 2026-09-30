import { z } from "zod";
import { LIMITS } from "@/lib/validation/limits";
import { ERROR_KEYS } from "@/lib/validation/error-keys";

/**
 * Validation for a member/project-suggested event. Messages are keys under
 * `forms.errors` (the human-friendly form system). The server forces status =
 * "pending" regardless of input.
 */
const placeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  text: z.string().trim().max(LIMITS.event.placeText, ERROR_KEYS.tooLong),
  precision: z.enum(["exact", "city", "country", "region"]),
  countryCode3: z.string().length(3).nullable().optional(),
});

export const eventSubmissionSchema = z
  .object({
    title: z.string().trim().min(3, ERROR_KEYS.titleTooShort).max(LIMITS.event.title, ERROR_KEYS.tooLong),
    // Present when submitting from a workspace (?workspace=) — the route
    // links the created event back as a workspace output.
    collaborationId: z.string().optional(),
    // Edit mode: the id of an existing pending/needs-changes event being
    // resubmitted. The route verifies the caller may edit it, then patches.
    editId: z.string().optional(),
    description: z.string().trim().max(LIMITS.event.description, ERROR_KEYS.tooLong).optional().or(z.literal("")),
    scope: z.enum(["community", "project"]).default("community"),
    startAt: z.string({ required_error: ERROR_KEYS.eventStartRequired }).datetime({ message: ERROR_KEYS.eventStartRequired }),
    endAt: z.string().datetime().optional().or(z.literal("")),
    mode: z.enum(["online", "in_person", "hybrid"]).default("online"),
    locationName: z.string().trim().max(LIMITS.event.locationName, ERROR_KEYS.tooLong).optional().or(z.literal("")),
    url: z.string().trim().url(ERROR_KEYS.eventWebsiteFormat).optional().or(z.literal("")),
    linkedProject: z.string().optional().or(z.literal("")),
    regionalCommunityId: z.string().optional().or(z.literal("")),
    origin: z.enum(["ccm", "external"]).default("ccm"),
    organiserName: z.string().trim().max(LIMITS.event.organiserName, ERROR_KEYS.tooLong).optional().or(z.literal("")),
    place: placeSchema.nullable().optional(),
  })
  .refine((d) => !d.endAt || new Date(d.endAt) >= new Date(d.startAt), {
    message: ERROR_KEYS.endBeforeStart,
    path: ["endAt"],
  })
  .refine((d) => d.origin !== "external" || Boolean(d.url), {
    message: ERROR_KEYS.eventWebsiteRequired,
    path: ["url"],
  });

export type EventSubmission = z.infer<typeof eventSubmissionSchema>;

/** The place picker's value → the event's `place` group. Payload's point is [longitude, latitude]. */
export function toEventPlace(place: EventSubmission["place"]) {
  if (!place) return null;
  return {
    text: place.text || null,
    point: place.precision === "region" ? null : ([place.lng, place.lat] as [number, number]),
    precision: place.precision,
    countryCode: place.countryCode3 ?? null,
  };
}

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
