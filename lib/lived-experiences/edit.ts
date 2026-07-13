import "server-only";
import { writeClient } from "@/sanity/lib/write-client";
import { prisma, safeQuery } from "@/lib/prisma";

/**
 * X7 tail: load a lived experience the current user may edit, mapped to the
 * submission form's field shape (loadEditableCaseStudy pattern). Localized
 * fields collapse to the doc's submission language, which the form re-wraps
 * on resubmit.
 *
 * May edit = the original submitter, OR a member of a workspace that lists
 * the doc as an output. Only draft/pending/revision docs are editable —
 * approved content changes go through the editorial team.
 */
export type EditableLivedExperience = {
  status: string;
  reviewNotes: string | null;
  _sanityId: string;
  language: "en" | "es" | "fr" | "ar";
  title: string;
  description: string;
  issue: string;
  personContext: string;
  videoSource: "youtube" | "vimeo" | "upload";
  videoLink: string;
  body: unknown[];
  regionalCommunityId: string;
  tagIds: string[];
  /** An uploaded video already exists — the form doesn't require a new file. */
  hasVideoFile: boolean;
};

export async function loadEditableLivedExperience(
  sanityId: string,
  userId: string
): Promise<EditableLivedExperience | null> {
  const id = sanityId.replace(/^drafts\./, "");
  // Token client with a raw perspective: drafts.* docs are invisible to the
  // public read client, and edit mode is exactly about reopening drafts.
  const doc = await writeClient.withConfig({ perspective: "raw" }).fetch(
    `*[_type == "livedExperience" && (_id == $id || _id == "drafts." + $id)][0]{
      _id, language, title, description, issue, personContext,
      videoSource, videoLink, body, submittedBy, status, reviewNotes,
      "regionalCommunityId": relatedCommunity._ref,
      "tagIds": tags[]._ref,
      "hasVideoFile": defined(videoFile.asset)
    }`,
    { id }
  );
  if (!doc) return null;
  if (!["pending", "revision", "draft", null, undefined].includes(doc.status)) return null;

  let allowed = doc.submittedBy === userId;
  if (!allowed) {
    const membership = await safeQuery(() =>
      prisma.workspaceOutput.findFirst({
        where: {
          sanityId: { in: [id, `drafts.${id}`] },
          collaboration: { members: { some: { userId } } },
        },
        select: { id: true },
      })
    );
    allowed = membership.success && !!membership.data;
  }
  if (!allowed) return null;

  const lang: EditableLivedExperience["language"] = ["en", "es", "fr", "ar"].includes(doc.language)
    ? doc.language
    : "en";
  // Localized object → the submission language's string (fall back to any).
  const text = (v: Record<string, string> | undefined) =>
    v?.[lang] ?? v?.en ?? Object.values(v ?? {})[0] ?? "";

  return {
    _sanityId: doc._id,
    status: doc.status ?? "draft",
    reviewNotes: doc.reviewNotes ?? null,
    language: lang,
    title: text(doc.title),
    description: text(doc.description),
    issue: text(doc.issue),
    personContext: text(doc.personContext),
    videoSource: doc.videoSource === "vimeo" || doc.videoSource === "upload" ? doc.videoSource : "youtube",
    videoLink: doc.videoLink ?? "",
    body: Array.isArray(doc.body) ? doc.body : [],
    regionalCommunityId: doc.regionalCommunityId ?? "",
    tagIds: Array.isArray(doc.tagIds) ? doc.tagIds.filter(Boolean) : [],
    hasVideoFile: !!doc.hasVideoFile,
  };
}
