// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FilterRow } from "@/components/atlas/atlas-filters";
import { FilterChip } from "@/components/ui/filter-chip";

afterEach(cleanup);

const chips = (activeIndex = -1) =>
  Array.from({ length: 10 }, (_, i) => <FilterChip key={i} label={`Tag ${i}`} active={i === activeIndex} onClick={() => {}} />);
const collapse = { limit: 4, more: (n: number) => `+${n} more`, less: "Show less" };

describe("a filter row", () => {
  it("shows the first few chips and a '+N more' chip that opens the rest", () => {
    render(<FilterRow label="Themes" collapse={collapse}>{chips()}</FilterRow>);
    expect(screen.getAllByRole("button", { name: /^Tag/ })).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: "+6 more" }));
    expect(screen.getAllByRole("button", { name: /^Tag/ })).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.getAllByRole("button", { name: /^Tag/ })).toHaveLength(4);
  });

  it("always keeps a selected chip visible, even past the limit", () => {
    render(<FilterRow label="Themes" collapse={collapse}>{chips(8)}</FilterRow>);
    expect(screen.getByRole("button", { name: "Tag 8" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "+5 more" })).toBeTruthy();
  });

  it("doesn't collapse short rows or rows without a limit", () => {
    render(<FilterRow label="Region">{chips()}</FilterRow>);
    expect(screen.getAllByRole("button", { name: /^Tag/ })).toHaveLength(10);
    expect(screen.queryByRole("button", { name: /more/ })).toBeNull();
  });

  it("puts the label above the chips on phones, beside them from sm up", () => {
    render(<FilterRow label="Communities">{chips()}</FilterRow>);
    const label = screen.getByText("Communities");
    expect(label.parentElement?.className).toContain("flex-col");
    expect(label.parentElement?.className).toContain("sm:flex-row");
  });
});
