// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CarouselTrack, type TrackCard } from "@/components/blocks/community-carousel/carousel-track";

vi.mock("@/i18n/navigation", () => ({ Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));

const cards: TrackCard[] = Array.from({ length: 7 }, (_, i) => ({
  slug: `c${i}`,
  code: "oce",
  name: `Community ${i}`,
  tagline: i === 0 ? "Islands, oceans, us." : null,
  counts: [`${i} members`],
  faces: [],
  moreFaces: null,
  latest: [`New story: S${i}`, `Welcome, M${i}`],
  visitLabel: `Visit Community ${i}`,
  slideLabel: `${i + 1} of 7`,
  goToLabel: `Show Community ${i}`,
}));
const labels = { region: "Our regional communities", previous: "Previous community", next: "Next community" };

let reduced = false;
beforeEach(() => {
  vi.useFakeTimers();
  reduced = false;
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({ matches: q.includes("reduce") ? reduced : false, addEventListener: () => {}, removeEventListener: () => {} })) as never;
  Element.prototype.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const current = () => screen.getAllByRole("group").find((g) => g.getAttribute("aria-current") === "true")?.getAttribute("aria-label");

describe("the community carousel track", () => {
  it("labels itself and every card for screen readers", () => {
    render(<CarouselTrack cards={cards} labels={labels} autoplay speed="calm" />);
    expect(screen.getByRole("region", { name: "Our regional communities" })).toBeTruthy();
    expect(screen.getAllByRole("group")).toHaveLength(7);
    expect(screen.getAllByRole("group")[2].getAttribute("aria-label")).toBe("3 of 7");
    expect(screen.getByRole("button", { name: "Next community" })).toBeTruthy();
  });

  it("moves by itself, and stops for good after the visitor uses the arrows", () => {
    render(<CarouselTrack cards={cards} labels={labels} autoplay speed="calm" />);
    act(() => vi.advanceTimersByTime(6100));
    expect(current()).toBe("2 of 7");
    fireEvent.click(screen.getByRole("button", { name: "Next community" }));
    expect(current()).toBe("3 of 7");
    act(() => vi.advanceTimersByTime(30000));
    expect(current()).toBe("3 of 7");
  });

  it("never moves for visitors who ask for less motion", () => {
    reduced = true;
    render(<CarouselTrack cards={cards} labels={labels} autoplay speed="calm" />);
    act(() => vi.advanceTimersByTime(30000));
    expect(current()).toBe("1 of 7");
    expect(screen.getAllByText("New story: S0")).toHaveLength(1);
  });

  it("stops once keyboard focus enters it", () => {
    render(<CarouselTrack cards={cards} labels={labels} autoplay speed="calm" />);
    fireEvent.focusIn(screen.getAllByRole("link")[0]);
    act(() => vi.advanceTimersByTime(30000));
    expect(current()).toBe("1 of 7");
  });

  it("stays put when the editor turned movement off", () => {
    render(<CarouselTrack cards={cards} labels={labels} autoplay={false} speed="calm" />);
    act(() => vi.advanceTimersByTime(30000));
    expect(current()).toBe("1 of 7");
  });
});
