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

  it("adds page-specific rows (events: where, who runs it) that ride along in the URL", () => {
    const extras = [{ param: "mode", label: "Where", options: [{ value: "online", label: "Online", count: 2 }], value: null }];
    render(<FilterBar options={options} active={{ ...active, regions: ["oce"] }} extras={extras} whenOptions={[]} />);
    expect(screen.queryByText("t:when")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Online/ }));
    expect(push).toHaveBeenCalledWith("/en/research-and-action/case-studies?region=oce&mode=online", { scroll: false });
  });
  it("keeps an extra's choice when another filter changes, and clears it with Clear filters", () => {
    const extras = [{ param: "mode", label: "Where", options: [{ value: "online", label: "Online", count: 2 }], value: "online" }];
    render(<FilterBar options={options} active={active} extras={extras} />);
    fireEvent.click(screen.getByRole("button", { name: /Youth/ }));
    expect(push).toHaveBeenLastCalledWith("/en/research-and-action/case-studies?communities=youth&mode=online", { scroll: false });
    fireEvent.click(screen.getByText("t:clear"));
    expect(push).toHaveBeenLastCalledWith("/en/research-and-action/case-studies", { scroll: false });
  });
});
