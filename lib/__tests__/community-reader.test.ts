import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const q = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => q(d), queryPreviewable: (d: unknown) => q(d) }));
import { findCommunity } from "@/lib/content/internal/payload/community";

beforeEach(() => q.mockReset());

const rec = (over: Record<string, unknown> = {}) => ({
  id: "rc1",
  slug: "oceania",
  name: { en: "Oceania", fr: "Océanie" },
  meta_title: { en: "O" },
  noindex: false,
  sections: [{ id: "s1", blockType: "faqs", faqs: [{ id: "q", title: { en: "Q", fr: "QF" } }], chapter: { kind: "overview", label: null } }],
  ...over,
});

describe("findCommunity", () => {
  it("returns the shared sections in the visitor's language, keeping chapters", async () => {
    q.mockResolvedValue({ docs: [rec()] });
    const c = await findCommunity("oceania", "fr");
    expect(c).toMatchObject({ id: "rc1", slug: "oceania", name: "Océanie" });
    expect(c!.sections[0]).toMatchObject({ _type: "faqs", chapter: { kind: "overview", label: null } });
    expect((c!.sections[0] as { faqs: Array<{ title: string }> }).faqs[0].title).toBe("QF");
  });

  it("keeps a custom chapter label in the visitor's language", async () => {
    q.mockResolvedValue({ docs: [rec({ sections: [{ id: "s", blockType: "faqs", faqs: [], chapter: { kind: "custom", label: { en: "Friends", fr: "Amis" } } }] })] });
    expect((await findCommunity("oceania", "fr"))!.sections[0]).toMatchObject({ chapter: { kind: "custom", label: "Amis" } });
  });

  it("falls back to English per field", async () => {
    q.mockResolvedValue({ docs: [rec()] });
    expect((await findCommunity("oceania", "ar"))!.name).toBe("Oceania");
  });

  it("uses the language's own list when the per-language switch is on", async () => {
    q.mockResolvedValue({ docs: [rec({ layoutPerLanguage: true, sectionsByLanguage: { en: [{ id: "e", blockType: "faqs", faqs: [] }], es: [] } })] });
    expect((await findCommunity("oceania", "es"))!.sections).toHaveLength(1);
  });

  it("is null for an unknown community", async () => {
    q.mockResolvedValue({ docs: [] });
    expect(await findCommunity("nowhere", "en")).toBeNull();
  });

  it("has no sections when none are set (the old page then renders)", async () => {
    q.mockResolvedValue({ docs: [rec({ sections: [] })] });
    expect((await findCommunity("oceania", "en"))!.sections).toEqual([]);
  });

  it("reads only what the page needs, so the answer stays small enough to cache", async () => {
    q.mockResolvedValue({ docs: [rec()] });
    await findCommunity("oceania", "en");
    const descriptor = q.mock.calls[0][0] as { depth: number; select: Record<string, true> };
    expect(descriptor.depth).toBe(2);
    expect(Object.keys(descriptor.select).sort()).toEqual(
      ["layoutPerLanguage", "leadIds", "meta_description", "region", "meta_title", "name", "noindex", "ogImage", "sections", "sectionsByLanguage", "slug"].sort(),
    );
  });
});
