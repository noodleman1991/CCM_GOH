import { describe, expect, it } from "vitest";
import config from "@/payload.config";
import { sanityUpdatedAt } from "@/payload/fields/sanity-timestamps";
import {
  documentTargets,
  IMPORTED_COLLECTION_SLUGS,
  type SanityDoc,
  type TransformContext,
} from "@/scripts/payload-import/lib/transform";

/**
 * Sanity's `_updatedAt` must survive the import.
 *
 * Payload's own `updatedAt` cannot carry it —
 * `payload/dist/collections/operations/utilities/update.js` ends every update
 * with an unconditional `dataToUpdate.updatedAt = new Date().toISOString()` —
 * so the importer writes a dedicated `sanityUpdatedAt` column instead
 * (`payload/fields/sanity-timestamps.ts`). Three things have to hold together
 * for that to be worth anything, and each is asserted below:
 *
 *   1. every collection the importer writes declares the field;
 *   2. the transform puts Sanity's `_updatedAt` in it, and stops writing the
 *      `updatedAt` that gets discarded;
 *   3. the field is a real, indexed date column, not a string.
 *
 * `verifyImport`'s `timestamps/sanity-updated-at` check covers the fourth: the
 * value actually read back out of Postgres.
 */

function context(): TransformContext {
  return { assets: new Map(), known: new Set() };
}

const AGENDA: SanityDoc = {
  _id: "agenda-1",
  _type: "agenda",
  _createdAt: "2025-10-09T08:00:00.000Z",
  _updatedAt: "2025-11-12T14:32:07.000Z",
  title: { en: "An agenda" },
  slug: { _type: "slug", current: "an-agenda" },
  agendaType: "annual",
  publishDate: "2025-10-09",
  year: 2025,
  files: [],
};

describe("sanityUpdatedAt", () => {
  it("is declared on every collection the importer writes", async () => {
    const resolved = await config;
    const missing = IMPORTED_COLLECTION_SLUGS.filter((slug) => {
      const collection = resolved.collections.find((c) => c.slug === slug);
      return !collection?.fields.some((f) => "name" in f && f.name === "sanityUpdatedAt");
    });

    expect(missing).toEqual([]);
    // A guard on the guard: if `IMPORTED_COLLECTION_SLUGS` ever came back
    // empty, the assertion above would pass while checking nothing.
    expect(IMPORTED_COLLECTION_SLUGS.length).toBe(18);
  });

  it("is an indexed date column, so an ORDER BY over a whole collection is cheap", () => {
    expect(sanityUpdatedAt).toMatchObject({ name: "sanityUpdatedAt", type: "date", index: true });
  });

  it("carries Sanity's _updatedAt, and no longer writes the updatedAt Payload discards", () => {
    const { targets } = documentTargets([AGENDA], context());
    const target = targets.find((t) => t.slug === "agendas")!;

    expect(target.data.en?.sanityUpdatedAt).toBe("2025-11-12T14:32:07.000Z");
    expect(target.data.en?.createdAt).toBe("2025-10-09T08:00:00.000Z");
    // Writing this is what made the field vanish: Payload overwrites it after
    // hooks run, so the value never reached a column.
    expect(target.data.en).not.toHaveProperty("updatedAt");
  });

  it("is a collection-only trailer — globals keep Payload's own updatedAt", () => {
    const announcement: SanityDoc = {
      _id: "siteAnnouncement",
      _type: "siteAnnouncement",
      _createdAt: "2025-10-09T08:00:00.000Z",
      _updatedAt: "2025-11-12T14:32:07.000Z",
      enabled: false,
    };
    const { targets } = documentTargets([announcement], context());
    const global = targets.find((t) => t.kind === "global");

    expect(global?.data.en).not.toHaveProperty("sanityUpdatedAt");
    expect(global?.data.en).not.toHaveProperty("updatedAt");
  });
});
