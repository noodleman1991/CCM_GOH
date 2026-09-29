/** The site's "Waiting for review" list: submissions and held comments in one shape. Pure. */
import { MODERATION_WORKFLOWS, type ModeratedCollection, type ModerationAction } from "@/payload/moderation/workflows";
import type { QueueItem } from "@/lib/comments/moderation-queue";

export type ReviewItem =
  | {
      kind: "submission";
      key: string;
      collection: ModeratedCollection;
      id: string;
      title: string;
      summary: string | null;
      imageUrl: string | null;
      sender: string | null;
      createdAt: string;
      actions: ModerationAction[];
      notesRequired: ModerationAction[];
      adminHref: string;
    }
  | { kind: "comment"; key: string; comment: QueueItem; createdAt: string };

type Row = Record<string, unknown>;
const isRow = (v: unknown): v is Row => typeof v === "object" && v !== null && !Array.isArray(v);

/** A plain or `{ en, … }` text value in `locale`, else English. */
function text(v: unknown, locale: string): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (isRow(v)) return text(v[locale], locale) ?? (locale === "en" ? null : text(v.en, "en"));
  return null;
}

function imageOf(doc: Row): string | null {
  for (const key of ["coverImage", "image", "thumbnail"]) {
    const v = doc[key];
    if (!isRow(v)) continue;
    if (typeof v.url === "string") return v.url;
    if (isRow(v.asset) && typeof v.asset.url === "string") return v.asset.url;
  }
  return null;
}

function senderOf(doc: Row): string | null {
  const by = doc.submittedBy;
  if (isRow(by)) return text(by.name, "en") ?? text(by.email, "en");
  return text(by, "en") ?? text(doc.submitterName, "en");
}

export function toSubmissionItem(collection: ModeratedCollection, doc: Row, locale: string): ReviewItem {
  const workflow = MODERATION_WORKFLOWS[collection];
  const actions = (Object.keys(workflow.actions) as ModerationAction[]).filter((a) => workflow.actions[a].visibleWhen.includes("pending"));
  const id = String(doc.id ?? "");
  return {
    kind: "submission",
    key: `${collection}:${id}`,
    collection,
    id,
    title: text(doc.title, locale) ?? "(untitled)",
    summary: text(doc.summary, locale) ?? text(doc.description, locale) ?? text(doc.excerpt, locale),
    imageUrl: imageOf(doc),
    sender: senderOf(doc),
    createdAt: typeof doc.createdAt === "string" ? doc.createdAt : new Date(0).toISOString(),
    actions,
    notesRequired: actions.filter((a) => workflow.actions[a].requiresNotes),
    adminHref: `/admin/collections/${collection}/${encodeURIComponent(id)}`,
  };
}

export function commentItem(comment: QueueItem): ReviewItem {
  return { kind: "comment", key: `comment:${comment.id}`, comment, createdAt: comment.createdAt };
}

/** One list, newest first. */
export function mergeReviewItems(...lists: ReviewItem[][]): ReviewItem[] {
  return lists.flat().sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}
