import "server-only";
import { queryLive } from "@/lib/content/internal/payload-source";
import { draftToContribution, toContribution, type Contribution, type ContributionKind } from "@/lib/contributions/model";

type Row = Record<string, unknown>;
const SOURCES: Array<{ kind: ContributionKind; collection: "caseStudies" | "livedExperiences" | "researchOutputs" | "events" }> = [
  { kind: "caseStudy", collection: "caseStudies" },
  { kind: "livedExperience", collection: "livedExperiences" },
  { kind: "researchOutput", collection: "researchOutputs" },
  { kind: "event", collection: "events" },
];
const SELECT = { title: true, slug: true, moderationStatus: true, reviewNotes: true, createdAt: true } as const;

/** One kind's rows; a failure is logged and leaves that kind out. */
async function rows(collection: string, where: Row, select: Record<string, true>): Promise<Row[]> {
  try {
    const result = await queryLive<{ docs?: Row[] }>({ type: "find", collection: collection as never, where: where as never, pagination: false, locale: "all", depth: 0, select: select as never });
    return result?.docs ?? [];
  } catch (error) {
    console.error(`[my-contributions] ${collection} read failed`, error);
    return [];
  }
}

export async function readMyContributions(clerkUserId: string, locale: string): Promise<Contribution[]> {
  const [sent, drafts] = await Promise.all([
    Promise.all(
      SOURCES.map(async ({ kind, collection }) =>
        (await rows(collection, { submittedBy: { equals: clerkUserId } }, kind === "caseStudy" ? { ...SELECT, submittedAt: true } : SELECT))
          .map((r) => toContribution(kind, r, locale)),
      ),
    ),
    rows("caseStudyDrafts", { userId: { equals: clerkUserId } }, { title: true, lastSaved: true, updatedAt: true }),
  ]);
  return [...sent.flat(), ...drafts.map((r) => draftToContribution(r, locale))].filter((c): c is Contribution => c !== null);
}
