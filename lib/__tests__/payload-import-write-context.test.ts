import { describe, expect, it, vi } from "vitest";
import { IMPORT_WRITE_CONTEXT } from "@/scripts/payload-import/lib/runtime";
import { payloadDocumentClient } from "@/scripts/payload-import/documents";
import { payloadDraftClient } from "@/scripts/payload-import/drafts";
import { payloadUploadClient } from "@/scripts/payload-import/assets";
import { SKIP_MODERATION_SIDE_EFFECTS } from "@/payload/hooks/moderation";
import { SKIP_CONTENT_REVALIDATION } from "@/payload/hooks/revalidate-content";
import {
  SKIP_SEARCH_SYNC,
  flushSearchSync,
  searchSyncAfterChange,
  searchSyncAfterDelete,
  type SearchSyncDeps,
} from "@/payload/hooks/search-sync";

/**
 * The import scripts write through Payload's Local API, and Payload runs every
 * collection hook on a Local API write exactly as it would on an admin save.
 * Until 2026-09-16 the three scripts passed no `context`, so an import into
 * the DEV database:
 *
 *   - scheduled an Algolia write for every case study, news post and agenda
 *     it created — against the LIVE indices, because no environment sets
 *     `ALGOLIA_INDEX_PREFIX`;
 *   - ran the moderation side effects for every imported `approved` document
 *     whose archive row had no `notifiedStatus` — a real approval email to the
 *     real submitter.
 *
 * Both hooks already honour a per-write `context` flag. These tests pin that
 * every import write carries both flags, so a re-import can only ever touch
 * the database it was pointed at.
 */

type Call = { method: string; args: Record<string, unknown> };

function recordingPayload() {
  const calls: Call[] = [];
  const record =
    (method: string) =>
    async (args: Record<string, unknown>): Promise<Record<string, unknown>> => {
      calls.push({ method, args });
      return { id: (args as { id?: unknown }).id ?? (args.data as { id?: unknown } | undefined)?.id ?? "minted" };
    };
  const payload = {
    create: record("create"),
    update: record("update"),
    updateGlobal: record("updateGlobal"),
    find: async () => ({ docs: [] }),
    findVersions: async () => ({ docs: [] }),
    findGlobal: async () => null,
    collections: {},
  };
  return { payload: payload as never, calls };
}

describe("IMPORT_WRITE_CONTEXT", () => {
  it("names all three hooks' skip flags, by their own exported keys", () => {
    expect(IMPORT_WRITE_CONTEXT).toEqual({
      [SKIP_SEARCH_SYNC]: true,
      [SKIP_MODERATION_SIDE_EFFECTS]: true,
      [SKIP_CONTENT_REVALIDATION]: true,
    });
  });
});

describe("every import write carries the context", () => {
  it("documents: create, update and updateGlobal", async () => {
    const { payload, calls } = recordingPayload();
    const client = payloadDocumentClient(payload);
    await client.create({ collection: "caseStudies", data: { id: "cs-1" }, locale: "en" });
    await client.update({ collection: "caseStudies", id: "cs-1", data: {}, locale: "fr" });
    await client.updateGlobal({ slug: "homepage", data: {}, locale: "en" });
    expect(calls.map((c) => c.method)).toEqual(["create", "update", "updateGlobal"]);
    for (const call of calls) {
      expect(call.args.context, call.method).toEqual(IMPORT_WRITE_CONTEXT);
    }
  });

  it("drafts: createDraft and updateDraft", async () => {
    const { payload, calls } = recordingPayload();
    const client = payloadDraftClient(payload);
    await client.createDraft({ collection: "livedExperiences", id: "le-1", data: {}, locale: "en" });
    await client.updateDraft({ collection: "livedExperiences", id: "le-1", data: {}, locale: "en" });
    expect(calls.map((c) => c.method)).toEqual(["create", "update"]);
    for (const call of calls) {
      expect(call.args.context, call.method).toEqual(IMPORT_WRITE_CONTEXT);
      expect(call.args.draft, "drafts stay drafts").toBe(true);
    }
  });

  it("assets: create", async () => {
    const { payload, calls } = recordingPayload();
    const client = payloadUploadClient(payload);
    await client.create({
      collection: "media",
      data: { id: "image-1", sanityAssetId: "image-1" },
      file: { data: Buffer.alloc(0), mimetype: "image/png", name: "a.png", size: 0 },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].args.context).toEqual(IMPORT_WRITE_CONTEXT);
  });
});

describe("the hooks honour it", () => {
  it("search sync schedules nothing for a write that carries the context", async () => {
    const saveObjects = vi.fn(async () => undefined);
    const deleteObject = vi.fn(async () => undefined);
    const resolve = vi.fn(async () => ({ published: true, doc: { _id: "cs-1", title: "x" } }) as never);
    const deps: SearchSyncDeps = {
      index: { saveObjects, deleteObject } as never,
      indexNameFor: () => "t_case_studies",
      resolve,
      onError: vi.fn(),
    };
    const req = { context: IMPORT_WRITE_CONTEXT, payload: undefined } as never;
    await searchSyncAfterChange("caseStudies", deps)({ doc: { id: "cs-1" }, req, operation: "create" } as never);
    await searchSyncAfterDelete("caseStudies", deps)({ doc: { id: "cs-1" }, id: "cs-1", req } as never);
    await flushSearchSync();
    expect(resolve).not.toHaveBeenCalled();
    expect(saveObjects).not.toHaveBeenCalled();
    expect(deleteObject).not.toHaveBeenCalled();
  });
});
