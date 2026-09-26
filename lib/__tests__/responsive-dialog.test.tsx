// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import en from "@/messages/en.json";

/**
 * Slice 13d (audit P4). Per the mobile-UX directive — drawers, not shrunk
 * desktop dialogs — one primitive renders the native Drawer below `sm` and
 * the Dialog above, both capped at 92dvh with the safe-area padded, so a
 * landscape phone can always reach the last button (the cookie banner's
 * Save was unreachable at 640×360).
 */
function mockViewport(matches: boolean) {
  const listeners = new Set<() => void>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

const mount = () =>
  render(
    <NextIntlClientProvider locale="en" messages={{ common: en.common }}>
      <ResponsiveDialog open onOpenChange={() => {}} title="Cookie preferences" description="Choose what runs.">
        <p>Body text</p>
      </ResponsiveDialog>
    </NextIntlClientProvider>,
  );

beforeEach(() => {
  // jsdom lacks these; vaul's drawer and Radix's dialog call them on open.
  Element.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.setPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
});
afterEach(() => cleanup());

describe("ResponsiveDialog", () => {
  it("renders the bottom drawer below sm, capped and safe-area padded", () => {
    mockViewport(true);
    mount();
    const content = document.querySelector('[data-slot="drawer-content"]');
    expect(content, "drawer content should mount").not.toBeNull();
    const scroller = document.querySelector('[data-slot="responsive-dialog-body"]');
    expect(scroller?.className).toMatch(/max-h-\[92dvh\]/);
    expect(scroller?.className).toMatch(/overflow-y-auto/);
    expect(scroller?.className).toMatch(/safe-area-inset-bottom/);
    expect(screen.getByRole("dialog").getAttribute("aria-labelledby")).toBeTruthy();
    expect(screen.getByText("Body text")).toBeTruthy();
  });

  it("renders the centred dialog at sm and above, with the same cap", () => {
    mockViewport(false);
    mount();
    expect(document.querySelector('[data-slot="drawer-content"]')).toBeNull();
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toMatch(/max-h-\[92dvh\]/);
    expect(dialog.className).toMatch(/overflow-y-auto/);
    expect(screen.getByText("Cookie preferences")).toBeTruthy();
  });
});
