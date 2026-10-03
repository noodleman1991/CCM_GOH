import "server-only";
import { getEditableEventDoc } from "@/lib/content/discovery";
import { prisma, safeQuery } from "@/lib/prisma";

/**
 * X7 tail: load an event the current user may edit, mapped to the submit
 * form's field shape (loadEditableCaseStudy pattern).
 *
 * May edit = the original submitter, OR a member of a workspace that lists
 * the doc as an output. Only draft/pending/revision docs are editable —
 * approved content changes go through the editorial team.
 */
export type EditableEvent = {
  status: string;
  reviewNotes: string | null;
  _sanityId: string;
  title: string;
  description: string;
  scope: "community" | "project";
  startAt: string;
  endAt: string;
  mode: "online" | "in_person" | "hybrid";
  locationName: string;
  url: string;
  origin: "ccm" | "external";
  organiserName: string;
  regionalCommunityId: string;
  /** The place picker's value, rebuilt from the stored place. */
  place: { lat: number; lng: number; text: string; precision: "exact" | "city" | "country" | "region"; countryCode3: string | null } | null;
};

export async function loadEditableEvent(
  sanityId: string,
  userId: string
): Promise<EditableEvent | null> {
  const id = sanityId.replace(/^drafts\./, "");
  // Raw perspective: drafts.* docs are invisible to the public read client,
  // and edit mode is exactly about reopening drafts.
  const doc = await getEditableEventDoc(id);
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

  return {
    _sanityId: doc._id,
    status: doc.status ?? "draft",
    reviewNotes: doc.reviewNotes ?? null,
    title: doc.title ?? "",
    description: doc.description ?? "",
    scope: doc.scope === "project" ? "project" : "community",
    startAt: doc.startAt ?? "",
    endAt: doc.endAt ?? "",
    mode: doc.mode === "in_person" || doc.mode === "hybrid" ? doc.mode : "online",
    locationName: doc.locationName ?? "",
    url: doc.url ?? "",
    origin: doc.origin === "external" ? "external" : "ccm",
    organiserName: doc.organiserName ?? "",
    regionalCommunityId: doc.regionalCommunityId ?? "",
    place:
      doc.place?.point && doc.place.text
        ? {
            lng: doc.place.point[0],
            lat: doc.place.point[1],
            text: doc.place.text,
            precision: (["exact", "city", "country", "region"].includes(doc.place.precision ?? "") ? doc.place.precision : "city") as "exact" | "city" | "country" | "region",
            countryCode3: doc.place.countryCode ?? null,
          }
        : null,
  };
}
