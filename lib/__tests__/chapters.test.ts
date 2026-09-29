import { describe, expect, it } from "vitest";
import { groupIntoChapters } from "@/lib/content/chapters";
import { withChapter } from "@/payload/blocks/chapter";
import { faqs } from "@/payload/blocks";

const label = (k: string) => `L:${k}`;
const b = (id: string, chapter?: { kind: string; label?: string }) => ({ id, chapter: chapter ?? null });

describe("groupIntoChapters", () => {
  it("starts a chapter at each section that names one; the rest join the chapter above", () => {
    const out = groupIntoChapters([b("a", { kind: "overview" }), b("b"), b("c", { kind: "news" }), b("d")], label);
    expect(out.map((c) => [c.id, c.label, c.blocks.map((x) => x.id)])).toEqual([
      ["overview", "L:overview", ["a", "b"]],
      ["news", "L:news", ["c", "d"]],
    ]);
  });

  it("keeps sections before the first chapter in an unnamed group", () => {
    const out = groupIntoChapters([b("a"), b("b", { kind: "agendas" })], label);
    expect(out[0]).toMatchObject({ id: null, label: null });
    expect(out[0].blocks.map((x) => x.id)).toEqual(["a"]);
  });

  it("uses a custom label and makes an anchor from it", () => {
    const out = groupIntoChapters([b("a", { kind: "custom", label: "Our Partners & Friends" })], label);
    expect(out[0]).toMatchObject({ id: "our-partners-friends", label: "Our Partners & Friends" });
  });

  it("gives repeated chapters distinct anchors", () => {
    const out = groupIntoChapters([b("a", { kind: "news" }), b("b", { kind: "news" })], label);
    expect(out.map((c) => c.id)).toEqual(["news", "news-2"]);
  });

  it("treats 'none' or an empty custom label as no chapter", () => {
    const out = groupIntoChapters([b("a", { kind: "overview" }), b("b", { kind: "none" }), b("c", { kind: "custom", label: "" })], label);
    expect(out).toHaveLength(1);
    expect(out[0].blocks.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
});

describe("withChapter", () => {
  it("adds a collapsed 'Page menu' group without touching the original", () => {
    const withIt = withChapter(faqs);
    const last = withIt.fields[withIt.fields.length - 1] as unknown as {
      type: string;
      label: string;
      fields: Array<{ name: string; fields: Array<{ name: string; label?: string; localized?: boolean }> }>;
    };
    expect(last).toMatchObject({ type: "collapsible", label: "Page menu" });
    const group = last.fields[0];
    expect(group.name).toBe("chapter");
    expect(group.fields.map((f) => f.name)).toEqual(["kind", "label"]);
    expect(group.fields[0].label).toBe("Show in the page menu as");
    expect(group.fields[1].localized).toBe(true);
    expect(faqs.fields.some((f) => "name" in f && f.name === "chapter")).toBe(false);
  });
});
