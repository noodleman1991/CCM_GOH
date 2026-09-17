// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import { CharCounter } from "@/components/ui/char-counter";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

/**
 * Slice 13a. The counter under every capped input: shows count / max, turns
 * clay at 90% and destructive at the cap, and is announced for screen
 * readers in the member's language. The forms it sits in are behind
 * sign-in, so this is the check a rendered pass could not give.
 */
afterEach(() => cleanup());

function mount(value: string, max: number, locale: "en" | "ar" = "en") {
  const messages = { common: (locale === "en" ? en : ar).common };
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CharCounter value={value} max={max} />
    </NextIntlClientProvider>,
  );
}

describe("CharCounter", () => {
  it("shows the count against the cap and stays neutral well below it", () => {
    mount("hello", 160);
    const visible = screen.getByText("5 / 160");
    expect(visible.parentElement?.className).toContain("text-muted-foreground");
    expect(screen.getByText("5 of 160 characters").className).toContain("sr-only");
  });

  it("turns clay at 90% and destructive at the cap", () => {
    mount("x".repeat(144), 160);
    expect(screen.getByText("144 / 160").parentElement?.className).toContain("text-ccm-clay");
    cleanup();
    mount("x".repeat(160), 160);
    expect(screen.getByText("160 / 160").parentElement?.className).toContain("text-destructive");
  });

  it("announces politely, in Arabic when the locale is Arabic", () => {
    mount("سلام", 120, "ar");
    const live = screen.getByText("4 / 120").parentElement;
    expect(live?.getAttribute("aria-live")).toBe("polite");
    expect(screen.getByText("4 من 120 حرفًا")).toBeTruthy();
  });
});
