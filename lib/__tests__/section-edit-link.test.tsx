// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SectionEditLink } from "@/components/blocks/section-edit-link";
import { StaffEditPill } from "@/components/cms/staff-edit-pill";

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

  it("floats over the section's corner and only shows on hover or keyboard focus, taking no space", () => {
    render(<SectionEditLink href="/admin/globals/homepage#sections-row-2" label="Edit this section" />);
    const link = screen.getByRole("link", { name: "Edit this section" });
    expect(link.parentElement?.className).toContain("absolute");
    expect(link.parentElement?.className).not.toContain("-mb-");
    expect(link.className).toContain("opacity-0");
    expect(link.className).toContain("group-hover/section:opacity-100");
    expect(link.className).toContain("focus-visible:opacity-100");
  });
});

describe("StaffEditPill", () => {
  it("is one floating pill, clear of the breadcrumbs and above Report a problem", () => {
    render(<StaffEditPill href="/admin/collections/newsPosts/n1?from=%2Fen%2Fnews%2Fx" label="Edit this page" />);
    const link = screen.getByRole("link", { name: "Edit this page" });
    expect(link.getAttribute("href")).toBe("/admin/collections/newsPosts/n1?from=%2Fen%2Fnews%2Fx");
    expect(link.className).toContain("fixed");
    expect(link.className).toContain("end-4");
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

  it("adds one floating Edit this page pill when the page link is given", async () => {
    vi.resetModules();
    vi.doMock("@/components/blocks/registry", () => ({ componentMap: { "hero-1": () => <div>hero</div> } }));
    vi.doMock("@/components/blocks/block-reveal", () => ({ BlockReveal: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
    const { default: Blocks } = await import("@/components/blocks");
    render(
      <Blocks
        blocks={[{ _type: "hero-1", _key: "a" }, { _type: "hero-1", _key: "b" }]}
        locale="en"
        editHref={(i) => `/admin/globals/homepage#sections-row-${i}`}
        editLabel="Edit this section"
        pageEdit={{ href: "/admin/globals/homepage?from=%2Fen", label: "Edit this page" }}
      />,
    );
    expect(screen.getAllByRole("link", { name: "Edit this page" })).toHaveLength(1);
  });
});
