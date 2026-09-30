// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/en/research-and-action/case-studies" }));
vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => `t:${k}` }));
import { FilterBar } from "@/components/filters/filter-bar";
afterEach(() => { cleanup(); push.mockReset(); });

const options = { regions: [{ value: "oce", label: "Oceania", count: 3 }], communities: [{ value: "youth", label: "Youth", count: 2 }], themes: [] };
const active = { regions: [], communities: [], themes: [], when: null, q: "" };

describe("filter bar", () => {
  it("shows a row per axis that has options, with counts", () => {
    render(<FilterBar options={options} active={active} />);
    expect(screen.getByText("t:region")).toBeTruthy();
    expect(screen.getByText("t:communities")).toBeTruthy();
    expect(screen.queryByText("t:themes")).toBeNull();
    expect(screen.getByRole("button", { name: /Youth/ }).textContent).toContain("2");
  });
  it("adds a choice to the URL, keeping the others", () => {
    render(<FilterBar options={options} active={{ ...active, regions: ["oce"] }} />);
    fireEvent.click(screen.getByRole("button", { name: /Youth/ }));
    expect(push).toHaveBeenCalledWith("/en/research-and-action/case-studies?region=oce&communities=youth", { scroll: false });
  });
  it("offers Clear filters only when something is chosen", () => {
    const { rerender } = render(<FilterBar options={options} active={active} />);
    expect(screen.queryByText("t:clear")).toBeNull();
    rerender(<FilterBar options={options} active={{ ...active, communities: ["youth"] }} />);
    fireEvent.click(screen.getByText("t:clear"));
    expect(push).toHaveBeenCalledWith("/en/research-and-action/case-studies", { scroll: false });
  });
});
