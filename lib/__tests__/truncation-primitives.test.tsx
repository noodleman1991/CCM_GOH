// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";
import { FilterChip, RemovableChip } from "@/components/ui/filter-chip";
import { TitleRow } from "@/components/ui/title-row";
import { QueryEcho } from "@/components/ui/query-echo";
import en from "@/messages/en.json";

/**
 * Slice 13b (audit P1). ~25 flex children holding member or CMS text could
 * push past their container: chips with a 200-character tag label, a
 * 100-character display name next to an Edit button, a search echo of a
 * 300-character token. jsdom has no layout, so these pin the contract — the
 * classes that make the browser clip, and a `title` so the clipped text is
 * still reachable.
 */
afterEach(() => cleanup());
const long = "x".repeat(200);
const wrap = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={{ common: en.common }}>
    {ui}
  </NextIntlClientProvider>
);

describe("chips and badges clip long labels and keep them reachable", () => {
  it("FilterChip", () => {
    render(<FilterChip label={long} active={false} onClick={() => {}} />);
    const label = screen.getByText(long);
    expect(label.className).toMatch(/truncate/);
    expect(label.className).toMatch(/max-w-/);
    expect(screen.getByRole("button").getAttribute("title")).toBe(long);
  });

  it("RemovableChip", () => {
    render(wrap(<RemovableChip label={long} onRemove={() => {}} />));
    const label = screen.getByText(long);
    expect(label.className).toMatch(/truncate/);
    expect(label.closest("span[title]")?.getAttribute("title")).toBe(long);
  });

  it("Badge", () => {
    render(<Badge>{long}</Badge>);
    const label = screen.getByText(long);
    expect(label.className).toMatch(/truncate/);
    expect(label.parentElement?.className).toMatch(/max-w-full/);
  });
});

describe("TitleRow", () => {
  it("clamps the title to two lines, lets it shrink, and keeps the trailing slot rigid", () => {
    render(
      <TitleRow as="h1" trailing={<button>Edit</button>}>
        {long}
      </TitleRow>,
    );
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.className).toMatch(/min-w-0/);
    expect(h1.className).toMatch(/line-clamp-2/);
    expect(h1.className).toMatch(/break-words/);
    expect(h1.parentElement?.className).toMatch(/min-w-0/);
    expect(screen.getByText("Edit").parentElement?.className).toMatch(/shrink-0/);
  });
});

describe("QueryEcho", () => {
  it("wraps an unbroken token anywhere and isolates its direction", () => {
    render(<QueryEcho>{long}</QueryEcho>);
    const el = screen.getByText(long);
    expect(el.tagName).toBe("BDI");
    expect(el.className).toMatch(/break-words/);
    expect(el.className).toMatch(/overflow-wrap:anywhere/);
  });
});
