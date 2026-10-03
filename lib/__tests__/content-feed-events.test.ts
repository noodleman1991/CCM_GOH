import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const query = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => query(d) }));

import { fetchFeedCards } from "@/lib/content/internal/payload/feeds";
import type { FeedFilters } from "@/lib/content/feeds/types";

const NO_FILTERS: FeedFilters = { regions: [], communityIds: [], audienceTagIds: [], tagIds: [], organizationIds: [], featuredOnly: false, upcomingOnly: false };
const event = (over: Record<string, unknown> = {}) => ({ id: "e1", slug: "reef", title: { en: "Reef" }, startAt: "2026-11-02T10:00:00Z", origin: "ccm", url: null, ...over });

beforeEach(() => {
  query.mockReset();
  query.mockResolvedValue({ docs: [] });
});

describe("events in a content feed", () => {
  it("an upcoming feed asks for the soonest first, keeping events that haven't ended", async () => {
    await fetchFeedCards(["events"], { ...NO_FILTERS, upcomingOnly: true }, { locale: "en", now: new Date("2026-11-01T00:00:00Z") }, 3);
    const d = query.mock.calls[0][0];
    expect(d).toMatchObject({ collection: "events", sort: ["startAt", "id"], limit: 3 });
    expect(JSON.stringify(d.where)).toContain('"endAt":{"greater_than_equal":"2026-11-01T00:00:00.000Z"}');
  });

  it("any other events feed stays newest first", async () => {
    await fetchFeedCards(["events"], NO_FILTERS, { locale: "en" }, 3);
    expect(query.mock.calls[0][0]).toMatchObject({ sort: ["-startAt", "id"] });
  });

  it("an outside event's card opens its website in a new tab", async () => {
    query.mockResolvedValue({ docs: [event({ origin: "external", url: "https://reef.example" })] });
    const [card] = await fetchFeedCards(["events"], NO_FILTERS, { locale: "en" }, 3);
    expect(card.card).toMatchObject({ href: "https://reef.example", external: true });
  });

  it("a CCM event, or an outside one without a usable website, opens its hub page", async () => {
    query.mockResolvedValue({ docs: [event({ url: "https://ccm.example" }), event({ id: "e2", slug: "walk", origin: "external", url: "javascript:alert(1)" })] });
    const cards = await fetchFeedCards(["events"], NO_FILTERS, { locale: "en" }, 3);
    expect(cards.map((c) => [c.card.href, c.card.external ?? false])).toEqual([
      ["/events/reef", false],
      ["/events/walk", false],
    ]);
  });
});
