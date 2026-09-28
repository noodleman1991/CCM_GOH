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
});
