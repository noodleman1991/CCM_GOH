// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { cleanup, createEvent, fireEvent, render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => k, useLocale: () => "en" }));
import { ModernContentArea } from "@/components/onboarding/modern-content-area";

afterEach(cleanup);

function Wizard({ onSubmit }: { onSubmit: () => void }) {
  const [step, setStep] = useState(5); // the step before review, of 7
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <ModernContentArea currentStep={step} totalSteps={7} onNextAction={() => setStep((s) => s + 1)} onPreviousAction={() => setStep((s) => s - 1)} isSubmitting={false} canGoNext canGoPrevious>
        <p>step {step}</p>
      </ModernContentArea>
    </form>
  );
}

describe("onboarding's Next button", () => {
  // The button that says Next on the step before review turns into the submit
  // button in the same click — the browser then submitted the whole form, so
  // review was skipped and Complete sent it a second time (found 2026-10-08).
  it("opens the review step without sending anything", () => {
    const onSubmit = vi.fn();
    render(<Wizard onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: /next/ }));
    expect(screen.getByRole("button", { name: /completeOnboarding/ })).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("never lets the browser act on a Next click — in a real browser the button is already the submit button by then", () => {
    render(<Wizard onSubmit={vi.fn()} />);
    const next = screen.getByRole("button", { name: /next/ });
    const click = createEvent.click(next);
    fireEvent(next, click);
    expect(click.defaultPrevented).toBe(true);
  });

  it("sends once when the member completes it", () => {
    const onSubmit = vi.fn();
    render(<Wizard onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: /next/ }));
    fireEvent.click(screen.getByRole("button", { name: /completeOnboarding/ }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
