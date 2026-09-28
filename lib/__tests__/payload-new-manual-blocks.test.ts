import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { pageBlocks } from "@/lib/content/internal/payload/blocks";
import { hero2, faqs, timelineRow, carousel1, submitStoryBanner, formNewsletter } from "@/payload/blocks";

const MEDIA = {
  id: "m1",
  url: "https://cdn.example/x.webp",
  mimeType: "image/webp",
  lqip: "data:image/webp;base64,AA",
  width: 1200,
  height: 800,
  sizes: {},
};

const one = (row: Record<string, unknown>) => {
  const out = pageBlocks([row]);
  expect(out).toHaveLength(1);
  return out![0] as Record<string, unknown>;
};

describe("new hand-written sections", () => {
  it("defines each with a plain name and group", () => {
    expect(
      [hero2, faqs, timelineRow, carousel1, submitStoryBanner, formNewsletter].map((b) => [
        b.slug,
        b.labels?.singular,
        b.admin?.group,
      ]),
    ).toEqual([
      ["hero2", "Hero with image", "Openings"],
      ["faqs", "FAQs", "Text & media"],
      ["timelineRow", "Timeline", "Text & media"],
      ["carousel1", "Image carousel", "Text & media"],
      ["submitStoryBanner", "Share-your-story banner", "Calls to action"],
      ["formNewsletter", "Newsletter signup", "Calls to action"],
    ]);
  });

  it("maps hero-2", () => {
    const b = one({ id: "h", blockType: "hero2", tagLine: "Tag", title: "Title", body: null, links: [], padding: null, background: null });
    expect(b._type).toBe("hero-2");
    expect(b.title).toBe("Title");
    expect(b.tagLine).toBe("Tag");
    expect(b.links).toBeNull();
  });

  it("maps faqs to {_id,title,body}", () => {
    const b = one({ id: "f", blockType: "faqs", faqs: [{ id: "q1", title: "Why?", body: null }], padding: null });
    expect(b._type).toBe("faqs");
    expect(b.faqs).toEqual([{ _id: "q1", title: "Why?", body: null }]);
  });

  it("maps timeline-row", () => {
    const b = one({ id: "t", blockType: "timelineRow", timelines: [{ id: "a", title: "2020", tagLine: "Start", body: null }], padding: null });
    expect(b._type).toBe("timeline-row");
    expect(b.timelines).toEqual([expect.objectContaining({ title: "2020", tagLine: "Start", body: null })]);
  });

  it("maps carousel-1 images to the component's asset shape", () => {
    const b = one({
      id: "c",
      blockType: "carousel1",
      title: null,
      description: null,
      size: "two",
      indicators: "dots",
      images: [{ id: "i", asset: MEDIA, alt: "A" }],
      padding: null,
      background: null,
    });
    expect(b._type).toBe("carousel-1");
    expect(b.size).toBe("two");
    expect(b.indicators).toBe("dots");
    const img = (b.images as Array<{ alt: string; asset: { url: string; metadata: { lqip: string; dimensions: { width: number } } } }>)[0];
    expect(img.alt).toBe("A");
    expect(img.asset.url).toBe(MEDIA.url);
    expect(img.asset.metadata.lqip).toBe(MEDIA.lqip);
    expect(img.asset.metadata.dimensions.width).toBe(1200);
  });

  it("drops a carousel image whose upload is gone", () => {
    const b = one({ id: "c2", blockType: "carousel1", images: [{ id: "i", asset: null, alt: "A" }] });
    expect(b.images).toBeNull();
  });

  it("maps submit-story-banner and form-newsletter", () => {
    const s = one({ id: "s", blockType: "submitStoryBanner", title: "Share", subtitle: "Tell us", ctaLabel: "Start", illustration: null, padding: null });
    expect(s).toMatchObject({ _type: "submit-story-banner", title: "Share", subtitle: "Tell us", ctaLabel: "Start" });
    const n = one({ id: "n", blockType: "formNewsletter", consentText: "OK?", buttonText: "Join", successMessage: "Thanks", padding: null });
    expect(n).toMatchObject({ _type: "form-newsletter", consentText: "OK?", buttonText: "Join", successMessage: "Thanks" });
  });

  it("an unfilled optional image is null, never an empty object", () => {
    expect(one({ id: "s2", blockType: "submitStoryBanner", title: "x", illustration: { asset: null } }).illustration).toBeNull();
  });
});
