import { describe, expect, it } from "vitest";
import type { CollectionConfig, Field } from "payload";
import { isAnyone, isEditor, moderationApprovedOnly } from "@/payload/access";
import { Events } from "@/payload/collections/events";
import { Projects } from "@/payload/collections/projects";

/**
 * `event` and `project` hold zero Sanity documents but have live submission and
 * moderation code, so they are built now and imported never. With no data to
 * check against, these tests pin the schema itself.
 */

const named = (c: CollectionConfig, name: string): Field | undefined =>
  c.fields.find((f): f is Field & { name: string } => "name" in f && f.name === name);

describe("the empty-but-wired collections", () => {
  it.each([
    ["events", Events],
    ["projects", Projects],
  ])("%s carries a custom text id field, never a uuid", (_slug, collection) => {
    const id = named(collection, "id");
    expect(id).toBeDefined();
    expect(id).toMatchObject({ type: "text", required: true });
  });

  it.each([
    ["events", Events, "events"],
    ["projects", Projects, "projects"],
  ])("%s uses its expected slug", (_n, collection, slug) => {
    expect(collection.slug).toBe(slug);
  });

  describe("events", () => {
    it("names its moderation field moderationStatus, never status", () => {
      expect(named(Events, "moderationStatus")).toBeDefined();
      expect(named(Events, "status")).toBeUndefined();
    });

    it("offers exactly the four Sanity moderation values, defaulting to approved", () => {
      const field = named(Events, "moderationStatus") as { options: { value: string }[]; defaultValue: string };
      expect(field.options.map((o) => o.value)).toEqual(["pending", "rejected", "revision", "approved"]);
      expect(field.defaultValue).toBe("approved");
    });

    it("gates anonymous read on approval, not on publish state alone", () => {
      // lib/content/system.ts and lib/content/discovery.ts both filter
      // `_type == "event" && status == "approved"`. Anything looser than this
      // exposes pending submissions, which was a real finding earlier in this phase.
      expect(Events.access?.read).toBe(moderationApprovedOnly);
      expect(Events.access?.read).not.toBe(isAnyone);
    });

    it("keeps writes editor-only", () => {
      expect(Events.access?.create).toBe(isEditor);
      expect(Events.access?.update).toBe(isEditor);
      expect(Events.access?.delete).toBe(isEditor);
    });

    it("does not enable drafts, which is what makes any status-named field safe", () => {
      expect(Events.versions).toBeUndefined();
    });

    it("ports the reusable place geotag with all four of its parts", () => {
      const place = named(Events, "place") as { type: string; fields: { name: string }[] };
      expect(place.type).toBe("group");
      expect(place.fields.map((f) => f.name)).toEqual(["point", "text", "precision", "countryCode"]);
    });

    it("localizes the title but not the venue name", () => {
      expect(named(Events, "title")).toMatchObject({ localized: true });
      expect(named(Events, "locationName")).not.toHaveProperty("localized");
    });
  });

  describe("projects", () => {
    it("keeps status as a lifecycle field, distinct from events' moderationStatus", () => {
      const field = named(Projects, "status") as { options: { value: string }[] };
      expect(field).toBeDefined();
      expect(field.options.map((o) => o.value)).toEqual([
        "planning",
        "active",
        "completed",
        "on-hold",
        "cancelled",
      ]);
      expect(named(Projects, "moderationStatus")).toBeUndefined();
    });

    it("must not enable drafts while a field is named status", () => {
      // A Payload field named `status` collides with Payload's own `_status`
      // at the Postgres enum-type level once drafts are on. This pairing is
      // safe only while versions stays off; if this test ever fails, rename
      // the field before enabling drafts.
      expect(Projects.versions).toBeUndefined();
      expect(named(Projects, "status")).toBeDefined();
    });

    it("reads publicly, having no moderation field to gate on", () => {
      expect(Projects.access?.read).toBe(isAnyone);
    });

    it("maps Sanity's explicit four-language description object onto a localized field", () => {
      expect(named(Projects, "description")).toMatchObject({ type: "textarea", localized: true });
    });

    it("ports coverageArea as an array of located, named areas", () => {
      const area = named(Projects, "coverageArea") as { type: string; fields: { name: string }[] };
      expect(area.type).toBe("array");
      expect(area.fields.map((f) => f.name)).toEqual(["location", "name", "description"]);
    });
  });
});
