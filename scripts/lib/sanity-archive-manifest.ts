export interface ManifestDoc {
  _id: string;
  _type: string;
}

export interface Manifest {
  generatedAt: string;
  dataset: string;
  totals: { documents: number; published: number; drafts: number };
  byType: Record<string, { published: number; drafts: number }>;
  /** Filled in by the export runner once the archive exists on disk. */
  archive?: { file: string; bytes: number; sha256: string };
}

/** Assets and Sanity's internal bookkeeping are not content and are excluded. */
const isContent = (type: string) =>
  !type.startsWith("sanity.") && !type.startsWith("system.");

export function buildManifest(docs: ManifestDoc[], dataset: string): Manifest {
  const byType: Manifest["byType"] = {};
  let published = 0;
  let drafts = 0;

  for (const doc of docs) {
    if (!isContent(doc._type)) continue;
    const isDraft = doc._id.startsWith("drafts.");
    byType[doc._type] ??= { published: 0, drafts: 0 };
    if (isDraft) {
      byType[doc._type].drafts++;
      drafts++;
    } else {
      byType[doc._type].published++;
      published++;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    dataset,
    totals: { documents: published + drafts, published, drafts },
    byType,
  };
}
