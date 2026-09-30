import { describe, expect, it } from "vitest";
import { Events } from "@/payload/collections/events";
import { EventSuggestions } from "@/payload/globals/event-suggestions";
import { globals } from "@/payload/globals";
import { CHAPTER_OPTIONS } from "@/payload/blocks/chapter";

const field = (name: string) => Events.fields.find((f) => "name" in f && f.name === name) as Record<string, unknown> | undefined;

describe("the event record", () => {
  it("says who runs it, defaulting to CCM", () => {
    expect(field("origin")).toMatchObject({ type: "select", defaultValue: "ccm", label: "Who runs it" });
    expect(field("organiser")).toMatchObject({ type: "relationship", relationTo: "organizations" });
    expect(field("organiserName")).toMatchObject({ type: "text" });
  });
  it("carries tags for the filters, and hidden outcome bookkeeping", () => {
    expect(field("tags")).toMatchObject({ type: "relationship", relationTo: "tags", hasMany: true });
    expect(field("notifiedStatus")).toMatchObject({ type: "text", admin: expect.objectContaining({ hidden: true }) });
  });
  it("calls the link the Event website", () => {
    expect(field("url")).toMatchObject({ label: "Event website" });
  });
});

describe("event suggestions settings", () => {
  it("are open by default, in Settings, and registered", () => {
    const open = EventSuggestions.fields.find((f) => "name" in f && f.name === "open");
    expect(open).toMatchObject({ type: "checkbox", defaultValue: true });
    expect(EventSuggestions.admin?.group).toBe("Settings");
    expect(globals.map((g) => g.slug)).toContain("eventSuggestions");
  });
});

describe("the community page menu", () => {
  it("offers Events", () => {
    expect(CHAPTER_OPTIONS.map((o) => o.value)).toContain("events");
  });
});
