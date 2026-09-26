/**
 * Converts each case study's retired `topic` into a theme tag, placed first in
 * its tags so it becomes the main theme, and re-files the "Vulnerable
 * Populations" tag from `location` to `audience`. Dry run by default;
 * `--execute` writes.
 *
 *   pnpm exec tsx scripts/case-studies/topic-to-tags.ts                          # dev dry run
 *   pnpm exec tsx scripts/case-studies/topic-to-tags.ts --execute                # dev write
 *   pnpm exec tsx scripts/case-studies/topic-to-tags.ts --production [--execute] # PRODUCTION (user only)
 *
 * The mapping lives in `lib/case-studies/topic-tag-map.ts` as retired topic →
 * theme tag SLUG (the tag's `value`, which page links filter by); this script
 * resolves each slug to the tag's id before writing it into `tags`.
 *
 * Production runs are the user's, with the prod env (see
 * docs/migration/payload-production-runbook.md). `--production` (or the
 * repo-wide `--allow-production`) is the only way past the dev-database guard.
 */

export interface TopicOption {
  value: string;
  label: string;
}

export interface TagRow {
  id: string;
  /** The tag's slug. */
  value: string;
  /** English label. */
  label: string;
  category: string | null;
}

export interface TopicProposal {
  topic: string;
  topicLabel: string;
  tagSlug: string | null;
  tagLabel: string | null;
  /** Best overlap found, even when too weak to propose. */
  score: number;
  /** The closest theme tag, shown for a human even when below the threshold. */
  closestLabel: string | null;
}

/** Below this share of overlapping words, the row is left for a human. */
export const PROPOSAL_THRESHOLD = 0.34;

const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/&/g, " ")
      .split(/[^a-z]+/)
      .filter((w) => w.length > 2),
  );

/**
 * Proposes, for each retired topic, the theme tag (category `topic`) whose
 * English label shares the most words with the topic's label. A best match
 * under {@link PROPOSAL_THRESHOLD} is returned with `tagSlug: null` — "needs
 * your decision".
 */
export function proposeTopicMapping(topics: TopicOption[], tags: TagRow[]): TopicProposal[] {
  const themes = tags.filter((t) => t.category === "topic");
  return topics.map((topic) => {
    const a = words(topic.label);
    let best: { tag: TagRow; score: number } | null = null;
    for (const tag of themes) {
      const b = words(tag.label);
      const shared = [...a].filter((w) => b.has(w)).length;
      const score = shared / Math.max(a.size, b.size, 1);
      if (!best || score > best.score) best = { tag, score };
    }
    const ok = best !== null && best.score >= PROPOSAL_THRESHOLD;
    return {
      topic: topic.value,
      topicLabel: topic.label,
      tagSlug: ok ? best!.tag.value : null,
      tagLabel: ok ? best!.tag.label : null,
      score: best?.score ?? 0,
      closestLabel: best && best.score > 0 ? best.tag.label : null,
    };
  });
}

/**
 * For each case study with a mapped topic, its tag ids before and after the
 * conversion: the mapped tag goes first (moved there if already attached,
 * never duplicated). Case studies with no topic, an unmapped topic, or a
 * mapped slug that matches no tag are left out.
 */
export function planConversion(
  caseStudies: Array<{ id: string; topic: string | null; tags: string[] }>,
  mapping: Record<string, string>,
  slugToId: Record<string, string>,
): Array<{ id: string; before: string[]; after: string[] }> {
  return caseStudies.flatMap((cs) => {
    const slug = cs.topic ? mapping[cs.topic] : undefined;
    const tagId = slug ? slugToId[slug] : undefined;
    if (!tagId) return [];
    const after = [tagId, ...cs.tags.filter((t) => t !== tagId)];
    return [{ id: cs.id, before: cs.tags, after }];
  });
}

/** The "Vulnerable Populations" tag, found by its English label. */
export function findVulnerablePopulationsTag(tags: TagRow[]): TagRow | null {
  return tags.find((t) => t.label.trim().toLowerCase() === "vulnerable populations") ?? null;
}

/**
 * True when a case study's newest version is an unpublished draft saved after
 * its main row whose tags differ from the tags the row will hold after the
 * conversion (`expectedTags`): publishing that draft later would overwrite
 * the converted tags. A draft that already carries them (Payload saves one
 * alongside every update of a draft row) is not a risk.
 */
export function isNewerUnpublishedDraft(
  mainUpdatedAt: string | null | undefined,
  latest: { status: string | null | undefined; updatedAt: string | null | undefined; tags?: string[] } | null,
  expectedTags?: string[],
): boolean {
  if (!latest || latest.status !== "draft" || !latest.updatedAt) return false;
  if (mainUpdatedAt && Date.parse(latest.updatedAt) <= Date.parse(mainUpdatedAt)) return false;
  if (expectedTags && latest.tags && latest.tags.join() === expectedTags.join()) return false;
  return true;
}

type Id = string | number;

async function main() {
  const { assertPayloadDatabase, getPayloadInstance, IMPORT_WRITE_CONTEXT, loadEnv } = await import(
    "../payload-import/lib/runtime"
  );
  const { LEGACY_TOPIC_TO_TAG } = await import("../../lib/case-studies/topic-tag-map");
  await loadEnv();
  const argv = process.argv.slice(2);
  const execute = argv.includes("--execute");
  const production = argv.includes("--production") || argv.includes("--allow-production");
  assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL, {
    action: execute ? "convert topics into tags" : "read topics and tags",
    ...(production ? { allowProduction: true } : {}),
  });
  const payload = await getPayloadInstance();

  const topicField = (
    payload.collections.caseStudies.config.fields as Array<{ name?: string; options?: TopicOption[] }>
  ).find((f) => f.name === "topic");
  if (!topicField) throw new Error("The case study `topic` field is gone; nothing to convert.");

  // Original ids (numbers on Postgres) are kept so writes send the same type back.
  const originalId = new Map<string, Id>();
  const keep = (id: unknown): string => {
    const key = String(id);
    originalId.set(key, id as Id);
    return key;
  };

  const tagDocs = (
    await payload.find({ collection: "tags", pagination: false, depth: 0, locale: "en", overrideAccess: true })
  ).docs as Array<{ id: Id; value?: string; label?: string; category?: string | null }>;
  const tags: TagRow[] = tagDocs.map((t) => ({
    id: keep(t.id),
    value: String(t.value ?? ""),
    label: String(t.label ?? ""),
    category: t.category ?? null,
  }));
  const slugToId = Object.fromEntries(tags.map((t) => [t.value, t.id]));
  const labelById = new Map(tags.map((t) => [t.id, t.label]));

  const proposal = proposeTopicMapping(topicField.options ?? [], tags);
  console.log("\nProposed retired topic → theme tag (confirm, then copy the slugs into lib/case-studies/topic-tag-map.ts):");
  console.table(
    proposal.map((p) => ({
      topic: p.topic,
      "topic label": p.topicLabel,
      "proposed tag": p.tagLabel ?? "— needs your decision —",
      "tag slug": p.tagSlug ?? "",
      score: p.score.toFixed(2),
      closest: p.tagSlug ? "" : (p.closestLabel ?? "(no overlap)"),
    })),
  );
  console.log(
    `${proposal.filter((p) => p.tagSlug).length} proposed, ${proposal.filter((p) => !p.tagSlug).length} need your decision.`,
  );

  // The main table (published and draft rows alike — `draft: false` is not
  // published-only), which is what an update without `draft` writes.
  const caseStudyDocs = (
    await payload.find({ collection: "caseStudies", pagination: false, depth: 0, overrideAccess: true })
  ).docs as Array<{ id: Id; topic?: string | null; tags?: unknown[] | null; updatedAt?: string | null }>;
  const docs = caseStudyDocs.map((d) => ({
    id: keep(d.id),
    topic: d.topic ?? null,
    tags: (d.tags ?? []).map((t) => keep(typeof t === "object" && t !== null ? (t as { id: Id }).id : t)),
  }));
  const topicCounts = new Map<string, number>();
  for (const d of docs) topicCounts.set(d.topic ?? "(none)", (topicCounts.get(d.topic ?? "(none)") ?? 0) + 1);
  console.log(`\nCase studies by retired topic (${docs.length} total):`);
  console.table([...topicCounts].map(([topic, count]) => ({ topic, count })));

  const mappedSlugs = Object.values(LEGACY_TOPIC_TO_TAG);
  const unknown = mappedSlugs.filter((slug) => !slugToId[slug]);
  if (unknown.length) console.warn(`Mapped slugs with no tag (skipped): ${unknown.join(", ")}`);

  const plan = planConversion(docs, LEGACY_TOPIC_TO_TAG, slugToId);
  const changing = plan.filter((p) => p.before.join() !== p.after.join());
  const name = (ids: string[]) => ids.map((id) => labelById.get(id) ?? id).join(", ");
  console.log(
    `\n${changing.length} case studies would change (${plan.length} have a mapped topic; mapping has ${mappedSlugs.length} entries):`,
  );
  console.table(changing.map((p) => ({ id: p.id, before: name(p.before), after: name(p.after) })));

  if (!execute) {
    // Preview only: what the proposed rows alone would do if confirmed as-is.
    const proposedMap = Object.fromEntries(proposal.filter((p) => p.tagSlug).map((p) => [p.topic, p.tagSlug!]));
    const preview = planConversion(docs, proposedMap, slugToId).filter((p) => p.before.join() !== p.after.join());
    console.log(`\nPreview — if only the proposed rows were confirmed as-is, ${preview.length} case studies would change:`);
    console.table(
      preview.map((p) => ({
        id: p.id,
        topic: docs.find((d) => d.id === p.id)?.topic ?? "",
        before: name(p.before),
        after: name(p.after),
      })),
    );
  }

  // Read-only: a newer unpublished draft in the version history would carry
  // the old tag order back when it is published (controller ruling 24).
  const draftWarnings: Array<{ id: string; topic: string; "main row saved": string; "draft saved": string; planned: string }> = [];
  for (const d of caseStudyDocs) {
    const versions = await payload.findVersions({
      collection: "caseStudies",
      where: { parent: { equals: d.id } },
      sort: "-updatedAt",
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const latest = versions.docs[0] as
      | { updatedAt?: string; version?: { _status?: string; tags?: unknown[] | null } }
      | undefined;
    const latestInfo = latest
      ? {
          status: latest.version?._status,
          updatedAt: latest.updatedAt,
          tags: (latest.version?.tags ?? []).map((t) => String(typeof t === "object" && t !== null ? (t as { id: Id }).id : t)),
        }
      : null;
    const expected = plan.find((p) => p.id === String(d.id))?.after ?? docs.find((x) => x.id === String(d.id))?.tags;
    if (isNewerUnpublishedDraft(d.updatedAt, latestInfo, expected)) {
      draftWarnings.push({
        id: String(d.id),
        topic: d.topic ?? "",
        "main row saved": d.updatedAt ?? "",
        "draft saved": latest?.updatedAt ?? "",
        planned: plan.some((p) => p.id === String(d.id)) ? "yes" : "no",
      });
    }
  }
  console.log(
    `\n${draftWarnings.length} case studies have an unpublished draft newer than the saved row, with different tags` +
      (draftWarnings.length ? " (publishing that draft later could undo the conversion; versions are not modified):" : "."),
  );
  if (draftWarnings.length) console.table(draftWarnings);

  const vulnerable = findVulnerablePopulationsTag(tags);
  console.log(
    vulnerable
      ? `\n"Vulnerable Populations" tag: id=${vulnerable.id} value (slug)="${vulnerable.value}" category="${vulnerable.category}"` +
          (vulnerable.category === "location" ? " → would be re-filed under audience." : " → already not under location; left alone.")
      : '\n"Vulnerable Populations" tag: not found.',
  );

  if (!execute) {
    console.log("\nDry run only — nothing was written. Re-run with --execute to write.");
    process.exit(0);
  }

  for (const p of changing) {
    await payload.update({
      collection: "caseStudies",
      id: originalId.get(p.id)!,
      data: { tags: p.after.map((id) => originalId.get(id)!) } as never,
      depth: 0,
      overrideAccess: true,
      context: IMPORT_WRITE_CONTEXT,
    });
  }
  console.log(`Updated ${changing.length} case studies.`);
  if (vulnerable && vulnerable.category === "location") {
    await payload.update({
      collection: "tags",
      id: originalId.get(vulnerable.id)!,
      data: { category: "audience" } as never,
      depth: 0,
      overrideAccess: true,
      context: IMPORT_WRITE_CONTEXT,
    });
    console.log("Re-filed 'Vulnerable Populations' under Who it affects (audience).");
  }
  console.log("Done.");
  process.exit(0);
}

if (process.argv[1]?.endsWith("topic-to-tags.ts")) void main();
