import { describe, expect, it } from "vitest";
import { alignByType, planPageSections } from "@/scripts/pages/plan";

const hero = (title: string) => ({ id: `h-${title}`, blockType: "hero1", title });
const cards = (title: string) => ({ id: `g-${title}`, blockType: "gridRow", title, columns: [] });
const text = (title: string) => ({ id: `s-${title}`, blockType: "splitRow", splitColumns: [{ blockType: "splitContent", title }] });
const heading = (title: string) => ({ id: `sh-${title}`, blockType: "sectionHeader", title });

describe("alignByType", () => {
  it("keeps order and skips what doesn't line up", () => {
    expect(alignByType(["hero1", "gridRow"], ["hero1", "splitRow"])).toEqual([0, null]);
    expect(alignByType(["hero1", "hero1", "logoCloud1"], ["sectionHeader", "hero1", "hero1", "logoCloud1"])).toEqual([1, 2, 3]);
    expect(alignByType(["gridRow", "splitRow"], ["splitRow", "gridRow"])).toEqual([1, null]);
  });
});

describe("planPageSections", () => {
  it("keeps every language's text on a page whose languages match", () => {
    const p = planPageSections({ slug: "feedback", blocks: { en: [hero("Feedback")], es: [hero("Opiniones")], fr: [hero("Avis")], ar: [hero("ملاحظات")] } });
    expect(p.mode).toBe("shared");
    expect(p.sections[0]).toMatchObject({ blockType: "hero1", title: { en: "Feedback", es: "Opiniones", fr: "Avis", ar: "ملاحظات" } });
    expect(p.leftOut).toEqual([]);
  });

  it("takes English's layout where languages differ, keeping text that lines up and listing what's left out", () => {
    const p = planPageSections({ slug: "research-and-action/toolkits", blocks: { en: [hero("Toolkits"), cards("")], es: [hero("Herramientas"), text("A")], ar: [hero("أدوات"), text("B")] } });
    expect(p.mode).toBe("aligned");
    expect(p.sections.map((s) => s.blockType)).toEqual(["hero1", "gridRow"]);
    expect(p.sections[0].title).toEqual({ en: "Toolkits", es: "Herramientas", ar: "أدوات" });
    expect(p.leftOut).toEqual([{ lang: "es", blockType: "splitRow", index: 1 }, { lang: "ar", blockType: "splitRow", index: 1 }]);
  });

  it("keeps About's journey heading in every language", () => {
    const p = planPageSections({
      slug: "about",
      blocks: { en: [hero("Project"), hero("Hub")], es: [heading("El Viaje"), hero("Proyecto"), hero("Hub ES")], ar: [heading("رحلة"), hero("مشروع"), hero("مركز")] },
    });
    expect(p.sections[0]).toMatchObject({ blockType: "sectionHeader", title: { en: "The Connecting Climate Minds Journey", es: "El Viaje", ar: "رحلة" } });
    expect(p.sections[1].title).toEqual({ en: "Project", es: "Proyecto", ar: "مشروع" });
    expect(p.leftOut).toEqual([]);
    expect(p.notes).toContain("About: the journey heading is kept in every language (English added).");
  });

  it("shares English's sections when a language has no list at all", () => {
    const p = planPageSections({ slug: "x", blocks: { en: [hero("Only English")] } });
    expect(p.sections[0].title).toEqual({ en: "Only English" });
  });
});
