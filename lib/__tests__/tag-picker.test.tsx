// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import { TagPicker } from "@/components/forms/case-study/tag-picker";

afterEach(() => cleanup());
const tags = [
  { _id: "t1", label: { en: "Water Access" }, category: "topic" },
  { _id: "t2", label: { en: "Farmers" }, category: "audience" },
  { _id: "t3", label: { en: "Sub-Saharan Africa" }, category: "location" },
  { _id: "t4", label: { en: "Storms" }, category: "topic" },
];

function mount(selected: string[] = [], onChange = vi.fn()) {
  render(
    <NextIntlClientProvider locale="en" messages={{ caseStudySubmission: en.caseStudySubmission }}>
      <TagPicker tags={tags} selected={selected} onChange={onChange} inputId="field-tags" />
    </NextIntlClientProvider>,
  );
  return onChange;
}

describe("TagPicker", () => {
  it("groups tags under plain headings and hides region tags", () => {
    mount();
    expect(screen.getByText("Themes")).toBeTruthy();
    expect(screen.getByText("Who it affects")).toBeTruthy();
    expect(screen.queryByText("Sub-Saharan Africa")).toBeNull();
  });

  it("filters across groups as you type", () => {
    mount();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "sto" } });
    expect(screen.getByRole("button", { name: "Storms" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Farmers" })).toBeNull();
  });

  it("adds in pick order and marks the main theme", () => {
    const onChange = mount(["t2", "t4"]);
    expect(screen.getByText("Main theme")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Water Access" }));
    expect(onChange).toHaveBeenCalledWith(["t2", "t4", "t1"]);
  });
});
