// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SectionEditLink } from "@/components/blocks/section-edit-link";

vi.mock("server-only", () => ({}));
vi.mock("@/i18n/navigation", () => ({ Link: () => null, useRouter: () => ({}), usePathname: () => "/", redirect: () => null }));

afterEach(cleanup);

describe("SectionEditLink", () => {
  it("links staff to the section in the admin, with a clear name and a 44px target", () => {
    render(<SectionEditLink href="/admin/globals/homepage#sections-row-2" label="Edit this section" />);
    const link = screen.getByRole("link", { name: "Edit this section" });
    expect(link.getAttribute("href")).toBe("/admin/globals/homepage#sections-row-2");
    expect(link.className).toContain("min-h-11");
  });
});

describe("Blocks with edit links", () => {
  it("adds an edit link before each section only when asked", async () => {
    vi.resetModules();
    vi.doMock("@/components/blocks/registry", () => ({ componentMap: { "hero-1": () => <div>hero</div> } }));
    vi.doMock("@/components/blocks/block-reveal", () => ({ BlockReveal: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
    const { default: Blocks } = await import("@/components/blocks");
    const blocks = [{ _type: "hero-1", _key: "a" }, { _type: "hero-1", _key: "b" }];
    const { unmount } = render(<Blocks blocks={blocks} locale="en" />);
    expect(screen.queryAllByRole("link", { name: "Edit this section" })).toHaveLength(0);
    unmount();
    render(<Blocks blocks={blocks} locale="en" editHref={(i) => `/admin/globals/homepage#sections-row-${i}`} editLabel="Edit this section" />);
    expect(screen.getAllByRole("link", { name: "Edit this section" }).map((a) => a.getAttribute("href"))).toEqual([
      "/admin/globals/homepage#sections-row-0",
      "/admin/globals/homepage#sections-row-1",
    ]);
  });
});
