import { describe, expect, it } from "vitest";
import config from "@/payload.config";
import { assignDocumentId, documentIdField } from "@/payload/fields/document-id";

type HookArgs = Parameters<typeof assignDocumentId>[0];
const run = (args: Partial<HookArgs>) => assignDocumentId(args as HookArgs);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("assignDocumentId", () => {
  it("mints an id for a document created without one", () => {
    expect(run({ operation: "create", value: undefined })).toMatch(UUID);
    expect(run({ operation: "create", value: "" })).toMatch(UUID);
    expect(run({ operation: "create", value: "   " })).toMatch(UUID);
  });

  it("keeps an id supplied on create, so Sanity imports stay idempotent", () => {
    expect(run({ operation: "create", value: "tag-farmers" })).toBe("tag-farmers");
  });

  it("replaces the source id when duplicating", () => {
    const id = run({ operation: "create", value: "news-1", originalDoc: { id: "news-1" } });
    expect(id).toMatch(UUID);
  });

  it("never touches an existing document's id", () => {
    expect(run({ operation: "update", value: "news-1", originalDoc: { id: "news-1" } })).toBe("news-1");
  });
});

describe("every collection with a custom id", () => {
  it("assigns ids through the shared hook", async () => {
    const resolved = await config;
    const custom = resolved.collections.flatMap((collection) => {
      const idField = collection.fields.find((field) => "name" in field && field.name === "id");
      return idField ? [{ slug: collection.slug, idField }] : [];
    });

    expect(custom.map((c) => c.slug)).toEqual(
      expect.arrayContaining(["newsPosts", "authors", "events", "media", "files"]),
    );
    const missing = custom
      .filter(({ idField }) => !(idField as { hooks?: { beforeValidate?: unknown[] } }).hooks?.beforeValidate?.includes(assignDocumentId))
      .map((c) => c.slug);
    expect(missing).toEqual([]);
    expect(documentIdField.hooks?.beforeValidate).toContain(assignDocumentId);
  });
});
