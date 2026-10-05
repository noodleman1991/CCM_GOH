// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ChoiceChips } from "@/components/profile/choice-chips";

afterEach(cleanup);
const options = [{ value: "en", label: "English" }, { value: "ar", label: "العربية" }];

describe("choice chips", () => {
  it("toggles a choice on and off", () => {
    const onChange = vi.fn();
    const { rerender } = render(<ChoiceChips label="Languages" options={options} value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(onChange).toHaveBeenLastCalledWith(["en"]);
    rerender(<ChoiceChips label="Languages" options={options} value={["en"]} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "English" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("adds a choice of the member's own once, and shows ones not on the list so they can be removed", () => {
    const onChange = vi.fn();
    render(<ChoiceChips label="Languages" options={options} value={["Swahili"]} onChange={onChange} other={{ placeholder: "Another language", addLabel: "Add", maxLength: 40 }} />);
    expect(screen.getByRole("button", { name: /Swahili/ }).getAttribute("aria-pressed")).toBe("true");
    const input = screen.getByPlaceholderText("Another language");
    fireEvent.change(input, { target: { value: " swahili " } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "Tagalog" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith(["Swahili", "Tagalog"]);
  });

  it("stops at the most a member can pick", () => {
    const onChange = vi.fn();
    render(<ChoiceChips label="Looking for" options={options} value={["en"]} onChange={onChange} max={1} />);
    expect((screen.getByRole("button", { name: "العربية" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
