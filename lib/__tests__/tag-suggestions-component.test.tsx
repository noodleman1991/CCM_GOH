// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TagSuggestions } from "@/components/forms/tag-suggestions";
import en from "@/messages/en.json";

/**
 * The "suggest a tag" box (2026-09-20). Typing something close to an existing
 * tag offers that tag and refuses to add a duplicate; a genuinely new term
 * can be added, up to the limit. The submission forms are behind sign-in, so
 * this is the check a rendered pass cannot give.
 */
const TAGS = [
  { id: "t-cc", label: { en: "Climate Change", ar: "تغير المناخ" }, value: "climate-change" },
  { id: "t-ad", label: { en: "Adaptation" }, value: "adaptation" },
];

function mount(props: Partial<React.ComponentProps<typeof TagSuggestions<(typeof TAGS)[number]>>> = {}) {
  const onPickExisting = vi.fn();
  const onChange = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={{ forms: en.forms, common: en.common }}>
      <TagSuggestions availableTags={TAGS} selectedTagIds={[]} onPickExisting={onPickExisting} value={[]} onChange={onChange} {...props} />
    </NextIntlClientProvider>,
  );
  return { onPickExisting, onChange, input: screen.getByLabelText("Suggest a tag") as HTMLInputElement, add: screen.getByRole("button", { name: /Add/ }) };
}
afterEach(() => cleanup());

describe("TagSuggestions", () => {
  it("offers the existing tag for a near-duplicate and refuses to add it", () => {
    const { input, add, onPickExisting, onChange } = mount();
    fireEvent.change(input, { target: { value: "climat change" } });
    expect(screen.getByText("Did you mean:")).toBeTruthy();
    expect(screen.getByText("That tag already exists — pick it above.")).toBeTruthy();
    expect((add as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Climate Change" }));
    expect(onPickExisting).toHaveBeenCalledWith("t-cc");
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe("");
  });

  it("adds a genuinely new term, trimmed, and on Enter", () => {
    const { input, onChange } = mount();
    fireEvent.change(input, { target: { value: "  Eco-anxiety  " } });
    expect(screen.queryByText("Did you mean:")).toBeNull();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["Eco-anxiety"]);
  });

  it("stops at the limit and lets a suggestion be removed", () => {
    const { input, onChange } = mount({ value: ["Eco-anxiety", "Solastalgia", "Climate grief"] });
    expect(input.disabled).toBe(true);
    expect(screen.getByText("You've suggested 3 tags, the maximum.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove suggestion Solastalgia" }));
    expect(onChange).toHaveBeenCalledWith(["Eco-anxiety", "Climate grief"]);
  });
});
