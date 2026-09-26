import { describe, expect, it } from "vitest";
import regionalCommunityPage from "@/sanity/schemas/documents/regional-community-page";
import hero1 from "@/sanity/schemas/blocks/hero/hero-1";
import cta1 from "@/sanity/schemas/blocks/cta/cta-1";

const fieldNamed = (name: string) =>
  (regionalCommunityPage.fields as Array<{ name: string; type: string }>).find(
    (f) => f.name === name,
  );

describe("regionalCommunityPage schema", () => {
  /**
   * whyJoinCTA is declared hero-1 while every stored document carries
   * _type: "cta-1". The DECLARATION is correct: the stored field set is hero-1's,
   * including `image` (24 docs) and `imagePosition` (20 docs), neither of which
   * cta-1 declares. Redeclaring this as cta-1 hides those fields in the Studio and
   * Sanity strips them on the next save.
   *
   * The stored _type is normalised in the Payload importer, not here. See
   * docs/superpowers/specs/2026-09-02-sanity-to-payload-migration-design.md §7.1.
   */
  it("declares whyJoinCTA as hero-1, matching the stored field set", () => {
    expect(fieldNamed("whyJoinCTA")?.type).toBe("hero-1");
  });

  it("declares welcomeHero as hero-1", () => {
    expect(fieldNamed("welcomeHero")?.type).toBe("hero-1");
  });

  it("hero-1 still declares the fields the stored data depends on", () => {
    // image (24 of 28 docs) and imagePosition (20 of 28) live in stored
    // whyJoinCTA objects. cta-1 declares neither. If hero-1 ever stops
    // declaring them, that data becomes unreachable in the Studio and is
    // stripped on the next save — so pin them here, not just the field type.
    const hero1Fields = (hero1.fields as Array<{ name: string }>).map((f) => f.name);
    expect(hero1Fields).toContain("image");
    expect(hero1Fields).toContain("imagePosition");
  });

  it("cta-1 does NOT declare those fields, which is why the swap is unsafe", () => {
    const cta1Fields = (cta1.fields as Array<{ name: string }>).map((f) => f.name);
    expect(cta1Fields).not.toContain("image");
    expect(cta1Fields).not.toContain("imagePosition");
  });
});
