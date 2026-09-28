import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const query = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => query(d), queryPreviewable: (d: unknown) => query(d) }));
import { findOrganization } from "@/lib/content/internal/payload/organizations";

beforeEach(() => query.mockReset());
const row = {
  id: "o1", name: "Wellcome", slug: "wellcome", acronym: null, type: "foundation", website: "https://wellcome.org",
  description: { en: "A charity", fr: "Une fondation" }, logo: null, place: { text: "London, UK" }, showOnSite: true,
  regionalCommunity: { name: { en: "Europe & North America" }, slug: "europe-and-north-america" },
};

describe("findOrganization", () => {
  it("reads a shown organisation in the visitor's language", async () => {
    query.mockResolvedValue({ docs: [row] });
    expect(await findOrganization("wellcome", "fr")).toMatchObject({
      name: "Wellcome", description: "Une fondation", place: "London, UK",
      community: { name: "Europe & North America", slug: "europe-and-north-america" },
    });
    expect(JSON.stringify(query.mock.calls[0][0].where)).toContain('"showOnSite":{"not_equals":false}');
  });
  it("is null for a hidden or missing organisation (the page 404s)", async () => {
    query.mockResolvedValue({ docs: [] });
    expect(await findOrganization("gone", "en")).toBeNull();
  });
  it("only accepts a website that is a web address", async () => {
    query.mockResolvedValue({ docs: [{ ...row, website: "javascript:alert(1)" }] });
    expect((await findOrganization("wellcome", "en"))!.website).toBeNull();
  });
});
