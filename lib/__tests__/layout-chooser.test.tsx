// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import { LayoutChooser } from "@/components/forms/case-study/layout-chooser";

afterEach(cleanup);

describe("LayoutChooser", () => {
  it("offers Story, Feature and Report as radios, each with a small drawing of the result", () => {
    const onChange = vi.fn();
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={en}>
        <LayoutChooser value="story" onChange={onChange} />
      </NextIntlClientProvider>,
    );
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("aria-checked"))).toEqual(["true", "false", "false"]);
    expect(screen.getByRole("radio", { name: /Feature/ }).textContent).toContain("A visual, image-led showcase");

    const thumbs = [...container.querySelectorAll("[data-thumbnail]")];
    expect(thumbs.map((el) => el.getAttribute("data-thumbnail"))).toEqual(["story", "feature", "report"]);
    for (const el of thumbs) expect(el.getAttribute("aria-hidden")).toBe("true");

    fireEvent.click(screen.getByRole("radio", { name: /Report/ }));
    expect(onChange).toHaveBeenCalledWith("report");
  });
});
