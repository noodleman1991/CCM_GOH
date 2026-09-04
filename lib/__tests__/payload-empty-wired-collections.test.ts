import { describe, expect, it } from "vitest";
import type { CollectionConfig, Field } from "payload";
import { isAnyone, isEditor, isEditorField, moderationApprovedOnly } from "@/payload/access";
import { Events } from "@/payload/collections/events";
import { Projects } from "@/payload/collections/projects";
import { urlValidate } from "@/payload/fields/validation";

type WithValidate = { name?: string; validate?: (v: unknown, o: never) => string | true };

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

    it("gates the submitter id and the review notes at field level", () => {
      // The collection gate decides which DOCUMENTS are public; it does not
      // stop an approved event from carrying a Clerk user id and internal
      // editorial feedback in its own body. No public GROQ projection selects
      // either field (only the gated getEditableEventDoc does), so
      // /payload-api must not return them to an anonymous caller.
      for (const name of ["submittedBy", "reviewNotes"]) {
        expect((named(Events, name) as { access?: { read?: unknown } }).access?.read).toBe(isEditorField);
      }
    });

    it("keeps writes editor-only", () => {
      expect(Events.access?.create).toBe(isEditor);
      expect(Events.access?.update).toBe(isEditor);
      expect(Events.access?.delete).toBe(isEditor);
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

    it("keeps Sanity's slug maxLength of 96", () => {
      expect(named(Events, "slug")).toMatchObject({ maxLength: 96 });
    });

    it("keeps Sanity's url rules on both link fields", () => {
      expect((named(Events, "url") as WithValidate).validate).toBe(urlValidate);
      expect((named(Events, "recordingUrl") as WithValidate).validate).toBe(urlValidate);
    });

    it("rejects an end before its start, and lets everything else through", () => {
      const validate = (named(Events, "endAt") as WithValidate).validate!;
      const run = (endAt: string | null, startAt: string | null) =>
        validate(endAt, { data: { startAt }, siblingData: { startAt } } as never);
      expect(run("2026-01-02T10:00:00Z", "2026-01-01T10:00:00Z")).toBe(true);
      expect(run("2026-01-01T10:00:00Z", "2026-01-01T10:00:00Z")).toBe(true);
      expect(run("2025-12-31T10:00:00Z", "2026-01-01T10:00:00Z")).toBe("End should be after start.");
      // Sanity's rule is optional on both sides — an unset value is not an error.
      expect(run(null, "2026-01-01T10:00:00Z")).toBe(true);
      expect(run("2026-01-02T10:00:00Z", null)).toBe(true);
    });

    it("keeps the ISO alpha-3 rule on place.countryCode", () => {
      const place = named(Events, "place") as { fields: WithValidate[] };
      const validate = place.fields.find((f) => f.name === "countryCode")!.validate!;
      expect(validate("KEN", {} as never)).toBe(true);
      expect(validate(undefined, {} as never)).toBe(true);
      expect(validate("ken", {} as never)).toBe("Use a 3-letter ISO code (e.g. KEN)");
      expect(validate("KE", {} as never)).toBe("Use a 3-letter ISO code (e.g. KEN)");
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

    it("does not enable drafts, which is what makes any status-named field safe", () => {
      // A Payload field named `status` collides with Payload's own `_status`
      // at the Postgres enum-type level once drafts are on. This pairing is
      // safe only while versions stays off; if this test ever fails, rename
      // the field before enabling drafts.
      //
      // This belongs to `projects` and only to `projects`. It used to be
      // asserted against `Events` too, where it could not fail for its stated
      // reason — events' moderation field is `moderationStatus`, so there is
      // no name to collide. Worse, it forbade something Phase 3 may want:
      // `lib/content/discovery.ts:783`'s getEditableEventDoc matches
      // `_id == $id || _id == "drafts." + $id`, a genuinely drafts-visible
      // event read, so `versions: { drafts: true }` on events is a legitimate
      // Phase 3 option and nothing here should stand in its way.
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

    it("keeps Sanity's slug maxLength of 96 and its url rule on website", () => {
      expect(named(Projects, "slug")).toMatchObject({ maxLength: 96 });
      expect((named(Projects, "website") as WithValidate).validate).toBe(urlValidate);
    });

    it("caps tags at six — hard, because Payload cannot express Sanity's warning", () => {
      // sanity/schemas/documents/project.ts:194 is `Rule.max(6).warning(…)`, a
      // soft hint. Payload's Validate returns `string | true` only, so the cap
      // is enforced instead of hinted. Pinned here so the divergence is a
      // recorded decision rather than a silent one.
      expect(named(Projects, "tags")).toMatchObject({ maxRows: 6 });
    });
  });
});
