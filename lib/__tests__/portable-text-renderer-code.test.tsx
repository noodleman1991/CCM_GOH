// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { PortableText } from "@portabletext/react";

// The renderer module pulls in the locale-aware Link and the cookie-consent
// gate; neither is exercised by a code block, so stub them out.
vi.mock("@/i18n/navigation", () => ({ Link: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/components/cookie-consent/youtube-consent-gate", () => ({ YouTubeConsentGate: () => null }));
// The real CopyButton needs next-intl context; this stand-in records the text it would copy.
vi.mock("@/components/ui/copy-button", () => ({
  CopyButton: ({ code }: { code: unknown }) => <button data-code={JSON.stringify(code)} />,
}));

import { portableTextComponents } from "@/components/portable-text-renderer";

describe("published page code rendering", () => {
  it("renders an empty code block (no `code` field) without crashing", () => {
    const { container } = render(
      <PortableText value={[{ _type: "code", _key: "c1" }]} components={portableTextComponents()} />,
    );
    expect(container.querySelector("pre")).not.toBeNull();
    expect(container.querySelector("button")?.getAttribute("data-code")).toBe('""');
  });

  it("renders the code text and an inline code mark", () => {
    const { container } = render(
      <PortableText
        value={[
          { _type: "code", _key: "c2", code: "print('hi')", language: "python" },
          {
            _type: "block",
            _key: "b1",
            style: "normal",
            markDefs: [],
            children: [{ _type: "span", _key: "s1", text: "x = 1", marks: ["code"] }],
          },
        ]}
        components={portableTextComponents()}
      />,
    );
    expect(container.querySelector("pre")?.textContent).toContain("print('hi')");
    expect(container.querySelector("p code")?.textContent).toBe("x = 1");
  });
});
