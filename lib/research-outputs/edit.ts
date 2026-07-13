import "server-only";
import { writeClient } from "@/sanity/lib/write-client";
import { prisma, safeQuery } from "@/lib/prisma";

/**
 * X7 pattern: load a research output the current user may edit, mapped to the
 * submission form's field shape. Localized fields collapse to English (the
 * required key) with any-language fallback; the form re-wraps on resubmit.
 *
 * May edit = the original submitter, OR a member of a workspace that lists
 * the doc as an output. Only draft/pending/revision docs are editable —
 * approved content changes go through the editorial team.
 */
export type EditableResearchOutput = {
  _sanityId: string;
  language: "en" | "es" | "fr" | "ar";
  title: string;
  outputType: string;
  excerpt: string;
  body: unknown[];
  region: string;
  themes: string[];
  tagIds: string[];
  communityIds: string[];
  /** Existing downloadable documents — the form lists them as keep/remove. */
  versions: { _key: string; kind: string; lang: string; fileName: string | null }[];
};

export async function loadEditableResearchOutput(
  sanityId: string,
  userId: string
): Promise<EditableResearchOutput | null> {
  const id = sanityId.replace(/^drafts\./, "");
  // Token client with a raw perspective: drafts.* docs are invisible to the
  // public read client, and edit mode is exactly about reopening drafts.
  const doc = await writeClient.withConfig({ perspective: "raw" }).fetch(
    `*[_type == "researchOutput" && (_id == $id || _id == "drafts." + $id)][0]{
      _id, title, outputType, excerpt, body, region, themes,
      submittedBy, status,
      "tagIds": tags[]._ref,
      "communityIds": relatedCommunities[]._ref,
      "versions": versions[]{ _key, kind, lang, "fileName": file.asset->originalFilename }
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

  // English is the schema-required key, so it's the edit language of record;
  // fall back to whichever localization exists.
  const text = (v: Record<string, string> | undefined) =>
    v?.en ?? Object.values(v ?? {}).find(Boolean) ?? "";

  return {
    _sanityId: doc._id,
    language: "en",
    title: text(doc.title),
    outputType: doc.outputType ?? "report",
    excerpt: text(doc.excerpt),
    body: Array.isArray(doc.body) ? doc.body : [],
    region: doc.region ?? "",
    themes: Array.isArray(doc.themes) ? doc.themes : [],
    tagIds: Array.isArray(doc.tagIds) ? doc.tagIds.filter(Boolean) : [],
    communityIds: Array.isArray(doc.communityIds) ? doc.communityIds.filter(Boolean) : [],
    versions: Array.isArray(doc.versions)
      ? doc.versions.map((v: { _key: string; kind?: string; lang?: string; fileName?: string }) => ({
          _key: v._key,
          kind: v.kind ?? "full",
          lang: v.lang ?? "en",
          fileName: v.fileName ?? null,
        }))
      : [],
  };
}
