import { describe, expect, it } from "vitest";
import type { CollectionConfig, Field } from "payload";
import { Tags } from "@/payload/collections/tags";
import { WorkTypes } from "@/payload/collections/work-types";
import { ExpertiseAreas } from "@/payload/collections/expertise-areas";
import { Authors } from "@/payload/collections/authors";
import { Organizations } from "@/payload/collections/organizations";
import { RegionalCommunities } from "@/payload/collections/regional-communities";

const collections: CollectionConfig[] = [
  Tags,
  WorkTypes,
  ExpertiseAreas,
  Authors,
  Organizations,
  RegionalCommunities,
];

function findField(fields: Field[], name: string): Field | undefined {
  return fields.find((f) => "name" in f && f.name === name);
}

describe("payload taxonomy collections", () => {
  it("defines exactly the six taxonomy collection slugs", () => {
    const slugs = collections.map((c) => c.slug).sort();
    expect(slugs).toEqual([
      "authors",
      "expertiseAreas",
      "organizations",
      "regionalCommunities",
      "tags",
      "workTypes",
    ]);
  });

  it("has no duplicate slugs", () => {
    const slugs = collections.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every collection a hidden, required, text 'id' field at the root of fields — Sanity's _id, preserved verbatim so import is idempotent", () => {
    for (const c of collections) {
      const idField = findField(c.fields, "id");
      expect(idField, `${c.slug} is missing a root-level 'id' field`).toBeTruthy();
      expect(idField).toMatchObject({
        name: "id",
        type: "text",
        required: true,
        admin: { hidden: true },
      });
    }
  });

  it("never sets idType: 'uuid' anywhere — 310 of 446 Sanity ids are slug-like, not UUIDs", () => {
    for (const c of collections) {
      // Payload's CollectionConfig has no idType option itself (that lives on
      // buildConfig()), but guard against a stray custom 'id' field type that
      // isn't 'text'.
      const idField = findField(c.fields, "id");
      expect((idField as { type?: string } | undefined)?.type).toBe("text");
    }
  });

  it("authors carries the cross-system tie: a text 'id' field authors keep exactly, since Prisma's User.sanityPersonId references it", () => {
    const idField = findField(Authors.fields, "id");
    expect(idField).toMatchObject({ name: "id", type: "text", required: true });
  });

  it("tags and authors enable drafts (production_2 has real Sanity drafts: 1 tag, 4 authors)", () => {
    expect(Tags.versions).toMatchObject({ drafts: true });
    expect(Authors.versions).toMatchObject({ drafts: true });
  });

  it("workTypes, expertiseAreas, organizations have no Sanity drafts and don't enable them", () => {
    for (const c of [WorkTypes, ExpertiseAreas, Organizations]) {
      expect(c.versions).toBeFalsy();
    }
  });

  it("regionalCommunities enables drafts since it holds its community's page (CMS project 3)", () => {
    expect(RegionalCommunities.versions).toMatchObject({ drafts: expect.anything() });
  });

  it("tags stores tag.value as plain text, not the Sanity slug object — production_2's tag.value is {_type:'slug', current:'...'}", () => {
    const value = findField(Tags.fields, "value");
    expect(value).toMatchObject({ name: "value", type: "text" });
  });

  it("tags stores color as free text, not a select constrained to the 6 curated hex values — 41/68 real tags store a legacy hex value outside that list", () => {
    const color = findField(Tags.fields, "color");
    expect(color).toMatchObject({ name: "color", type: "text" });
  });

  it("workTypes and expertiseAreas key each collection by a unique, required 'key' text field matching the Prisma enum", () => {
    for (const c of [WorkTypes, ExpertiseAreas]) {
      const key = findField(c.fields, "key");
      expect(key).toMatchObject({ name: "key", type: "text", required: true, unique: true });
    }
  });
});
