import { z } from "zod";

/**
 * Validation for a member/project-submitted research output (report, toolkit,
 * dataset brief or guideline). Mirrors the case-study/LE submission contract:
 * the server forces status = "pending" regardless of input.
 *
 * Downloadable documents travel outside JSON as multipart files named
 * `version-<i>`, described positionally by `newVersions[i]` (kind + lang).
 * In edit mode `keptVersionKeys` lists the existing versions to keep.
 */

export const RO_OUTPUT_TYPES = ["report", "toolkit", "dataset-brief", "guideline"] as const;
export const RO_VERSION_KINDS = ["summary", "full", "brief", "deck"] as const;
export const RO_LANGS = ["en", "es", "fr", "ar"] as const;
export const RO_REGIONS = ["ssa", "nawa", "csa", "esea", "lac", "oce", "enam"] as const;

/** Upload cap per document (client + server enforced). */
export const RO_DOC_MAX_BYTES = 50 * 1024 * 1024; // 50MB
export const RO_DOC_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export const researchOutputSubmissionSchema = z.object({
  title: z.string().trim().min(3, "Please add a title").max(200),
  outputType: z.enum(RO_OUTPUT_TYPES).default("report"),
  excerpt: z.string().trim().max(600).optional().or(z.literal("")),
  // Portable Text body from the shared editor. Optional — a research output
  // may be documents-only.
  body: z.array(z.record(z.unknown())).optional(),
  region: z.enum(RO_REGIONS).optional().or(z.literal("")),
  themes: z.array(z.string()).max(8).optional().default([]),
  tagIds: z.array(z.string()).max(6).optional().default([]),
  communityIds: z.array(z.string()).max(7).optional().default([]),
  // New documents: one entry per multipart `version-<i>` file, in order.
  newVersions: z
    .array(z.object({ kind: z.enum(RO_VERSION_KINDS), lang: z.enum(RO_LANGS) }))
    .max(8)
    .optional()
    .default([]),
  // X7 edit mode: _key values of existing version items to keep.
  keptVersionKeys: z.array(z.string()).optional().default([]),
  language: z.enum(RO_LANGS).default("en"),
  // Present when submitting from a workspace (?workspace=) — the route
  // links the created doc back as a workspace output.
  collaborationId: z.string().optional(),
  // X7 edit mode: the Sanity _id of an existing draft/pending doc being
  // resubmitted. The route verifies the caller may edit it, then patches.
  editId: z.string().optional(),
});

export type ResearchOutputSubmission = z.infer<typeof researchOutputSubmissionSchema>;

/** A URL-safe slug from the title (unicode-aware, random suffix — the
 *  generateCaseStudySlug recipe). */
export function generateResearchOutputSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 96)
    .replace(/^-+|-+$/g, "");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
  return base ? `${base}-${suffix}` : suffix;
}
