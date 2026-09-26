import { afterEach, describe, expect, it, vi } from "vitest";
import {
  findTagReferences,
  flushSearchSync,
  scheduleTagReindex,
  type PayloadReader,
  type SearchSyncDeps,
} from "@/payload/hooks/search-sync";

/**
 * Tag audit, 2026-09-17. A tag's labels live inside every search record of
 * the content carrying it, so renaming a tag must re-index that content. The
 * fan-out asks each indexed collection which documents reference the tag and
 * queues one ordinary sync per document.
 */
function reader(rows: Record<string, string[]>): PayloadReader & { find: ReturnType<typeof vi.fn> } {
  return {
    find: vi.fn(async (args: Record<string, unknown>) => ({
      docs: (rows[String(args.collection)] ?? []).map((id) => ({ id })),
    })),
  } as never;
}

afterEach(async () => {
  await flushSearchSync();
});

describe("findTagReferences", () => {
  it("asks the three indexed collections for documents whose tags include the id", async () => {
    const payload = reader({ caseStudies: ["cs-1", "cs-2"], newsPosts: [], agendas: ["ag-1"] });
    const refs = await findTagReferences(payload, "tag-heat");
    expect(refs).toEqual([
      { collection: "caseStudies", id: "cs-1" },
      { collection: "caseStudies", id: "cs-2" },
      { collection: "agendas", id: "ag-1" },
    ]);
    for (const call of payload.find.mock.calls) {
      expect(call[0]).toMatchObject({ where: { tags: { in: ["tag-heat"] } }, select: { id: true }, depth: 0 });
    }
  });
});

describe("scheduleTagReindex", () => {
  it("queues one sync per referencing document, after the tag's write", async () => {
    const payload = reader({ caseStudies: ["cs-1"], newsPosts: ["n-1"], agendas: [] });
    const deleteObject = vi.fn(async () => undefined);
    const deps: SearchSyncDeps = {
      index: { saveObjects: vi.fn(async () => undefined), deleteObject } as never,
      // A null re-read means "gone", which the plan answers with a delete —
      // enough to prove each referencing document was visited.
      resolve: async () => null,
      indexNameFor: (c) => `idx-${c}`,
    };
    scheduleTagReindex("tag-heat", payload, { deps });
    expect(deleteObject).not.toHaveBeenCalled(); // nothing ran synchronously
    await flushSearchSync();
    expect(deleteObject).toHaveBeenCalledTimes(2);
    expect(deleteObject).toHaveBeenCalledWith({ indexName: "idx-caseStudies", objectID: "cs-1" });
    expect(deleteObject).toHaveBeenCalledWith({ indexName: "idx-newsPosts", objectID: "n-1" });
  });

  it("does nothing without a Payload instance", async () => {
    expect(() => scheduleTagReindex("tag-heat", undefined)).not.toThrow();
    await flushSearchSync();
  });
});
