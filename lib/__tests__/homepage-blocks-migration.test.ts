import { describe, it, expect } from "vitest";
import { blocksFromFields } from "@/lib/homepage/blocks-from-fields";

describe("blocksFromFields", () => {
  it("maps populated fixed fields to ordered blocks with _type + _key", () => {
    const hp = {
      heroWelcome: { _type: "hero-1", tagLine: "hi" },
      news: { _type: "grid-row", mode: "dynamic-recent" },
      partnerLogos: { _type: "logo-cloud-1", images: [] },
    };
    const blocks = blocksFromFields(hp);
    expect(blocks.map((b) => b._type)).toEqual(["hero-1", "grid-row", "logo-cloud-1"]);
    expect(blocks.every((b) => typeof b._key === "string" && b._key.length > 0)).toBe(true);
  });

  it("skips empty/absent fields", () => {
    expect(blocksFromFields({})).toEqual([]);
    expect(blocksFromFields({ heroWelcome: null })).toEqual([]);
  });

  it("preserves the field value on the block", () => {
    const hp = { heroWelcome: { _type: "hero-1", tagLine: "x" } };
    expect(blocksFromFields(hp)[0]).toMatchObject({ _type: "hero-1", tagLine: "x" });
  });

  it("emits blocks in the §4.1 field order regardless of input key order", () => {
    const hp = {
      partnerLogos: { _type: "logo-cloud-1" },
      heroWelcome: { _type: "hero-1" },
    };
    expect(blocksFromFields(hp).map((b) => b._type)).toEqual(["hero-1", "logo-cloud-1"]);
  });
});
