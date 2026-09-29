import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ draftMode: async () => ({ isEnabled: false }) }));
const q = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => q(d), queryPreviewable: (d: unknown) => q(d) }));
import { findPage } from "@/lib/content/internal/payload/pages";
beforeEach(() => q.mockReset());

const row = (over: Record<string, unknown> = {}) => ({ id: "p1", slug: "about", title: { en: "About" }, blocks: { en: [{ id: "old", blockType: "hero1", title: "Old" }] }, ...over });

describe("pages on sections", () => {
  it("renders the shared Sections list in the visitor's language when it has any", async () => {
    q.mockResolvedValue({ docs: [row({ sections: [{ id: "s", blockType: "hero1", title: { en: "New", ar: "جديد" } }] })] });
    const p = await findPage("about", "ar");
    expect((p!.blocks as Array<{ title: string }>)[0].title).toBe("جديد");
    expect(p).toMatchObject({ _id: "p1", fromSections: true });
  });
  it("shows English for a language the shared section doesn't cover", async () => {
    q.mockResolvedValue({ docs: [row({ sections: [{ id: "s", blockType: "hero1", title: { en: "New" } }] })] });
    expect(((await findPage("about", "fr"))!.blocks as Array<{ title: string }>)[0].title).toBe("New");
  });
  it("uses the language's own list when the page has one layout per language", async () => {
    q.mockResolvedValue({
      docs: [row({ layoutPerLanguage: true, sections: [], sectionsByLanguage: { en: [{ id: "e", blockType: "hero1", title: "EN" }], es: [{ id: "x", blockType: "hero1", title: "ES" }] } })],
    });
    expect(((await findPage("about", "es"))!.blocks as Array<{ title: string }>)[0].title).toBe("ES");
    expect(((await findPage("about", "fr"))!.blocks as Array<{ title: string }>)[0].title).toBe("EN");
  });
  it("finds the page in every language once it has sections, even without an old list there", async () => {
    q.mockResolvedValue({ docs: [row({ title: { en: "About" }, blocks: { en: [] }, sections: [{ id: "s", blockType: "hero1", title: { en: "New" } }] })] });
    expect(await findPage("about", "es")).not.toBeNull();
  });
  it("falls back to the old per-language list while there are no sections", async () => {
    q.mockResolvedValue({ docs: [row({ sections: [] })] });
    const p = await findPage("about", "en");
    expect((p!.blocks as Array<{ title: string }>)[0].title).toBe("Old");
    expect(p).toMatchObject({ fromSections: false });
  });
});
