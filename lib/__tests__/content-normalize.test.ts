import { describe, expect, it } from "vitest";
import { toRegion, toTag } from "@/lib/content/internal/normalize";

describe("toTag", () => {
  it("maps a fully-populated raw tag", () => {
    expect(toTag({ _id: "t1", label: { en: "Anxiety", fr: "Anxiété" }, value: "anxiety", color: "#ff0000" })).toEqual({
      id: "t1",
      label: { en: "Anxiety", fr: "Anxiété" },
      value: "anxiety",
      color: "#ff0000",
    });
  });

  it("defaults label to an empty object when missing", () => {
    expect(toTag({ _id: "t1" })).toEqual({
      id: "t1",
      label: {},
      value: undefined,
      color: undefined,
    });
  });

  it("handles a value-less, color-less raw tag without throwing", () => {
    expect(() => toTag({ _id: "t1", label: undefined })).not.toThrow();
    expect(toTag({ _id: "t1", label: undefined })).toEqual({
      id: "t1",
      label: {},
      value: undefined,
      color: undefined,
    });
  });
});

describe("toRegion", () => {
  it("maps a fully-populated raw region", () => {
    expect(toRegion({ _id: "r1", name: { en: "Oceania", ar: "أوقيانوسيا" }, slug: "oceania" })).toEqual({
      id: "r1",
      name: { en: "Oceania", ar: "أوقيانوسيا" },
      slug: "oceania",
    });
  });

  it("defaults name to an empty object and slug to an empty string when missing", () => {
    expect(toRegion({ _id: "r1" })).toEqual({
      id: "r1",
      name: {},
      slug: "",
    });
  });

  it("handles explicit null/undefined fields without throwing", () => {
    expect(() => toRegion({ _id: "r1", name: undefined, slug: undefined })).not.toThrow();
    expect(toRegion({ _id: "r1", name: undefined, slug: undefined })).toEqual({
      id: "r1",
      name: {},
      slug: "",
    });
  });
});
