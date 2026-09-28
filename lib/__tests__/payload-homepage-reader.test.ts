import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { toHomepage } from "@/lib/content/internal/payload/homepage";

const hero = (title: unknown, id = "h1") => ({ id, blockType: "hero1", title });
type Mapped = Array<{ _type: string; title: unknown }>;

describe("homepage sections", () => {
  it("renders the shared list in the visitor's language", () => {
    const home = toHomepage({ sections: [hero({ en: "Welcome", es: "Bienvenida" })] }, "es");
    expect((home.sections as Mapped)[0]).toMatchObject({ _type: "hero-1", title: "Bienvenida" });
  });
  it("shows English for a field with no translation", () => {
    const home = toHomepage({ sections: [hero({ en: "Welcome" })] }, "ar");
    expect((home.sections as Mapped)[0].title).toBe("Welcome");
  });
  it("uses the language's own list when the per-language switch is on, English's when that is empty", () => {
    const global = { layoutPerLanguage: true, sections: [hero("Shared")], sectionsByLanguage: { en: [hero("EN own")], fr: [hero("FR own", "h2")], es: [] } };
    expect((toHomepage(global, "fr").sections as Mapped)[0].title).toBe("FR own");
    expect((toHomepage(global, "es").sections as Mapped)[0].title).toBe("EN own");
  });
  it("is an empty list when nothing is set (the old template then renders)", () => {
    expect(toHomepage({}, "en").sections).toEqual([]);
  });
});
