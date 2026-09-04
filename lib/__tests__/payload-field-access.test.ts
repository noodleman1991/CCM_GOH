import { describe, expect, it } from "vitest";
import type { Field, PayloadRequest, SanitizedCollectionConfig } from "payload";
import config from "@payload-config";
import { isAdmin, isEditor, isEditorField } from "@/payload/access";

/**
 * Field-level read access — the second half of the exposure fix this phase
 * started at document level.
 *
 * A collection gate decides which DOCUMENTS an anonymous caller sees. It does
 * nothing about what an approved, published document carries in its own body,
 * and `/payload-api` is a public REST surface by construction: without a field
 * gate, `GET /payload-api/events` hands every anonymous caller the submitter's
 * Clerk user id and the internal review notes written *about* them. Sanity
 * never did — its dataset is private, and no public GROQ projection renders
 * those values — so leaving them open would be a leak this migration
 * introduced rather than inherited.
 *
 * These tests walk the BUILT config, so a collection added later is covered
 * without anyone remembering to add it here.
 */

type NamedField = Field & { name: string; access?: { read?: unknown } };

/** Every named field in a collection, recursively, keyed by dotted path. */
function walkFields(fields: Field[], prefix = ""): Map<string, NamedField> {
  const out = new Map<string, NamedField>();
  for (const field of fields) {
    const named = "name" in field && typeof field.name === "string" ? (field as NamedField) : undefined;
    const path = named ? `${prefix}${named.name}` : prefix;
    if (named) out.set(path, named);
    const nestedPrefix = named ? `${path}.` : prefix;
    if ("fields" in field && Array.isArray(field.fields)) {
      for (const [k, v] of walkFields(field.fields, nestedPrefix)) out.set(k, v);
    }
    if ("tabs" in field && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        const tabPrefix = "name" in tab && typeof tab.name === "string" ? `${nestedPrefix}${tab.name}.` : nestedPrefix;
        for (const [k, v] of walkFields(tab.fields, tabPrefix)) out.set(k, v);
      }
    }
    if ("blocks" in field && Array.isArray(field.blocks)) {
      for (const block of field.blocks) {
        if (typeof block === "string") continue;
        for (const [k, v] of walkFields(block.fields, `${nestedPrefix}${block.slug}.`)) out.set(k, v);
      }
    }
  }
  return out;
}

const collections = async (): Promise<SanitizedCollectionConfig[]> => (await config).collections;

const asUser = (role: string | null) => ({ req: { user: role ? { role } : null } as unknown as PayloadRequest });

/**
 * Field names that hold internal review state, submitter identity or
 * moderation commentary. Any collection that grows one of these must gate it,
 * which is what makes this a regression net rather than a snapshot: it fails
 * for a field nobody has written yet.
 *
 * `email` is deliberately NOT here — `organizations.email` and
 * `regionalCommunities.contact.email` are published contact details that
 * `lib/content/pages.ts` selects in its public projections. The one internal
 * email (`caseStudies.authors[].email`, shown only in the editor review form
 * and the submitter's own form) is asserted by path below.
 */
const INTERNAL_FIELD_NAMES = [
  "submittedBy",
  "reviewNotes",
  "reviewedBy",
  "reviewedAt",
  "notifiedStatus",
  "userId",
  "clerkUserId",
  "clerkUsername",
  "clerkImageUrl",
  "addedBy",
  "addedAt",
];

/**
 * Collections whose DOCUMENT-level read already excludes anonymous callers
 * outright: `caseStudyDrafts` (`isEditor`) and `users` (`isAdmin`). Nothing
 * leaks from a document nobody can fetch, so a field gate would add nothing
 * there.
 */
const DOCUMENT_GATED_READ = new Set<unknown>([isEditor, isAdmin]);

describe("field-level read access", () => {
  it("isEditorField admits only team_editor and admin", () => {
    expect(isEditorField(asUser("admin"))).toBe(true);
    expect(isEditorField(asUser("team_editor"))).toBe(true);
    expect(isEditorField(asUser("community_editor"))).toBe(false);
    expect(isEditorField(asUser("community_member"))).toBe(false);
    expect(isEditorField(asUser(null))).toBe(false);
  });

  it("returns a plain boolean, never a Where — Payload only checks truthiness at field level", () => {
    // payload/dist/fields/hooks/afterRead/promise.js:234 does
    // `if (!canReadField) delete siblingDoc[field.name]`. A helper that
    // returned a Where object (ownerOrEditor, publishedAndApproved) would read
    // as `true` there and grant the field to everyone.
    expect(typeof isEditorField(asUser(null))).toBe("boolean");
    expect(typeof isEditorField(asUser("admin"))).toBe("boolean");
  });

  it("gates every internal/review/identity field in the whole config", async () => {
    const ungated: string[] = [];
    for (const collection of await collections()) {
      if (DOCUMENT_GATED_READ.has(collection.access?.read)) continue;
      for (const [path, field] of walkFields(collection.fields)) {
        const leaf = path.split(".").pop();
        if (!leaf || !INTERNAL_FIELD_NAMES.includes(leaf)) continue;
        if (field.access?.read !== isEditorField) ungated.push(`${collection.slug}.${path}`);
      }
    }
    expect(ungated).toEqual([]);
  });

  it("covers the fields this phase actually found, by exact path", async () => {
    // Named explicitly so the net above cannot pass by finding nothing at all
    // (a rename, a moved field, a collection dropped from the config).
    const expected: Record<string, string[]> = {
      events: ["submittedBy", "reviewNotes"],
      caseStudies: [
        "submittedBy",
        "reviewNotes",
        "reviewedBy",
        "reviewedAt",
        "notifiedStatus",
        "authors.userId",
        "authors.email",
        "authors.clerkUserId",
        "authors.clerkUsername",
        "authors.clerkImageUrl",
      ],
      livedExperiences: ["submittedBy", "reviewNotes"],
      researchOutputs: ["submittedBy", "reviewNotes"],
      authors: ["userId"],
      externalSources: ["addedBy", "addedAt"],
    };
    const all = await collections();
    for (const [slug, paths] of Object.entries(expected)) {
      const collection = all.find((c) => c.slug === slug);
      expect(collection, `collection ${slug} is missing from the config`).toBeDefined();
      const fields = walkFields(collection!.fields);
      for (const path of paths) {
        const field = fields.get(path);
        expect(field, `${slug}.${path} no longer exists`).toBeDefined();
        expect(field!.access?.read, `${slug}.${path} is anonymously readable`).toBe(isEditorField);
      }
    }
  });

  it("leaves the public byline and published contact details readable", async () => {
    // The gate is scoped, not a blanket sweep: an author's display name and an
    // organization's published contact email are rendered on public pages and
    // selected by public GROQ projections today.
    const all = await collections();
    const caseStudies = all.find((c) => c.slug === "caseStudies")!;
    expect(walkFields(caseStudies.fields).get("authors.name")?.access?.read).toBeUndefined();
    const organizations = all.find((c) => c.slug === "organizations")!;
    expect(walkFields(organizations.fields).get("email")?.access?.read).toBeUndefined();
  });
});
