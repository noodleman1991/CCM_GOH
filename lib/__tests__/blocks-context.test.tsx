// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@/components/blocks/block-reveal", () => ({ BlockReveal: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/components/blocks/registry", () => ({
  componentMap: {
    probe: ({ communityId, communitySlug }: { communityId?: string; communitySlug?: string }) => (
      <div data-testid="p">{`${communityId}|${communitySlug}`}</div>
    ),
  },
}));
import Blocks from "@/components/blocks";

afterEach(cleanup);

describe("Blocks context", () => {
  it("passes the page's community to every section", () => {
    render(<Blocks blocks={[{ _type: "probe", _key: "a" }]} locale="en" context={{ communityId: "c1", communitySlug: "oceania" }} />);
    expect(screen.getByTestId("p").textContent).toBe("c1|oceania");
  });

  it("passes nothing outside a community page", () => {
    render(<Blocks blocks={[{ _type: "probe", _key: "a" }]} locale="en" />);
    expect(screen.getByTestId("p").textContent).toBe("undefined|undefined");
  });
});
