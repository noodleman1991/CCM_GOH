// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
vi.mock("server-only", () => ({}));
vi.mock("@/components/blocks", () => ({
  default: ({ blocks }: { blocks: Array<{ _type: string }> }) => <div data-testid="blocks">{blocks.map((b) => b._type).join(",")}</div>,
}));
vi.mock("@/components/blocks/hero/hero-1", () => ({ default: () => <div data-testid="legacy-hero" /> }));
vi.mock("@/components/blocks/split/split-row", () => ({ default: () => null }));
vi.mock("@/components/blocks/grid/grid-row", () => ({ default: () => null }));
vi.mock("@/components/blocks/carousel/carousel-2", () => ({ default: () => null }));
vi.mock("@/components/blocks/carousel/lived-experiences-carousel", () => ({ default: () => null }));
vi.mock("@/components/blocks/cta/cta-1", () => ({ default: () => null }));
vi.mock("@/components/blocks/logo-cloud/logo-cloud-1", () => ({ default: () => null }));
vi.mock("@/i18n/navigation", () => ({ Link: () => null }));
vi.mock("@/lib/content/pages", () => ({ getHomepageAgendas: vi.fn(), getHomepageNews: vi.fn() }));
vi.mock("@/lib/content/homepage-lived-experiences", () => ({ resolveLivedExperiencesSection: async () => ({ mode: "hidden" }) }));
import Homepage from "@/components/pages/homepage";

afterEach(cleanup);

describe("Homepage", () => {
  it("renders the sections through the shared renderer", async () => {
    render(await Homepage({ homepage: { sections: [{ _type: "hero-1", _key: "a" }], heroWelcome: {} } as never, locale: "en" }));
    expect(screen.getByTestId("blocks").textContent).toBe("hero-1");
    expect(screen.queryByTestId("legacy-hero")).toBeNull();
  });
  it("falls back to the old template while there are no sections", async () => {
    render(await Homepage({ homepage: { sections: [], heroWelcome: {} } as never, locale: "en" }));
    expect(screen.getByTestId("legacy-hero")).toBeTruthy();
  });
});
