import { describe, expect, it } from "vitest";
import { collapseLocales } from "@/lib/content/internal/localize";

describe("collapseLocales", () => {
  it("picks the language from every {en,es,fr,ar} value, however deep", () => {
    const v = { title: { en: "Hi", fr: "Salut" }, links: [{ title: { en: "Go", fr: "Aller" }, href: "/x" }] };
    expect(collapseLocales(v, "fr")).toEqual({ title: "Salut", links: [{ title: "Aller", href: "/x" }] });
  });
  it("falls back to English per field when the language is missing", () => {
    expect(collapseLocales({ title: { en: "Hi", ar: "" }, body: { en: "B" } }, "ar")).toEqual({ title: "Hi", body: "B" });
  });
  it("without fallback, a missing language is null", () => {
    expect(collapseLocales({ title: { en: "Hi" } }, "es", { fallback: false })).toEqual({ title: null });
  });
  it("leaves ordinary objects alone", () => {
    const v = { padding: { top: true, bottom: null }, root: { children: [] } };
    expect(collapseLocales(v, "fr")).toEqual(v);
  });

  it("leaves a populated document (an agenda on a card) in every language — its own projection picks one", () => {
    const agenda = { id: "a1", title: { en: "Agenda", fr: "Programme" }, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" };
    const section = { blockType: "gridRow", title: { en: "Cards", fr: "Cartes" }, columns: [{ blockType: "gridAgenda", agenda }] };
    expect(collapseLocales(section, "fr")).toEqual({ blockType: "gridRow", title: "Cartes", columns: [{ blockType: "gridAgenda", agenda }] });
  });
});
