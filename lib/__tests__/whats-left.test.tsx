// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import { WhatsLeft, requiredLeft, type WhatsLeftItem } from "@/components/forms/errors/whats-left";
import { fieldId } from "@/components/forms/errors/field-id";

afterEach(() => cleanup());

const items: WhatsLeftItem[] = [
  { id: "title", label: "Add a title", done: true, target: "title.en", severity: "required" },
  { id: "where", label: "Add where this took place", done: false, target: "location", severity: "required" },
  { id: "pin", label: "Add a specific place to appear on the map", done: false, target: "location", severity: "nudge" },
];

function mount(list = items) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ forms: en.forms }}>
      <WhatsLeft items={list} actions={<button type="button">Submit</button>} />
    </NextIntlClientProvider>,
  );
}

describe("WhatsLeft", () => {
  it("counts only required items as left", () => {
    expect(requiredLeft(items)).toBe(1);
  });

  it("community alone satisfies location: a nudge never counts as left", () => {
    expect(requiredLeft(items.map((i) => (i.id === "where" ? { ...i, done: true } : i)))).toBe(0);
  });

  it("jumps to the field when an item is tapped", () => {
    const target = document.createElement("input");
    target.id = fieldId("location");
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);
    mount();
    fireEvent.click(screen.getAllByRole("button", { name: "Add where this took place" })[0]);
    expect(document.activeElement).toBe(target);
  });

  it("says when everything is ready", () => {
    mount(items.map((i) => ({ ...i, done: true })));
    expect(screen.getAllByText("Everything's ready to send").length).toBeGreaterThan(0);
  });
});
