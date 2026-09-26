// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import { OriginalLanguageNote } from "@/components/case-studies/original-language-note";

afterEach(() => cleanup());
const mount = (contentLanguage: string | null) =>
  render(<NextIntlClientProvider locale="en" messages={{ caseStudies: en.caseStudies }}><OriginalLanguageNote contentLanguage={contentLanguage as never} locale="en" /></NextIntlClientProvider>);

describe("OriginalLanguageNote", () => {
  it("names the original language when it differs", () => {
    mount("ar");
    expect(screen.getByText("Originally written in Arabic")).toBeTruthy();
  });
  it("says nothing when it matches", () => {
    mount("en");
    expect(screen.queryByText(/Originally written/)).toBeNull();
  });
});
