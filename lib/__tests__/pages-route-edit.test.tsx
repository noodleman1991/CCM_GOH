// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
vi.mock("@/i18n/navigation", () => ({ redirect: () => { throw new Error("REDIRECT"); } }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (k: string) => `t:${k}` }));
const staff = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: async () => ({}), isStaff: () => staff(), getViewerUserId: async () => null }));
const getPage = vi.fn();
vi.mock("@/lib/content/pages", () => ({ getPageBySlug: (s: string, l: string) => getPage(s, l), getRegionalCommunityPage: async () => null }));
vi.mock("@/lib/content/metadata", () => ({ generatePageMetadata: () => ({}) }));
vi.mock("@/components/blocks", () => ({
  default: ({ editHref, editLabel }: { editHref?: (i: number) => string; editLabel?: string }) => (
    <div data-testid="blocks" data-href={editHref ? editHref(2) : ""} data-label={editLabel ?? ""} />
  ),
}));
import Page from "@/app/[locale]/(main)/[...slug]/page";

const params = Promise.resolve({ locale: "en", slug: ["about"] });
beforeEach(() => { staff.mockReset(); getPage.mockReset(); });
afterEach(cleanup);

describe("page route edit links", () => {
  it("gives staff an edit link per section on a page built from sections", async () => {
    staff.mockReturnValue(true);
    getPage.mockResolvedValue({ id: "p1", slug: "about", fromSections: true, blocks: [] });
    render(await Page({ params }));
    const blocks = screen.getByTestId("blocks");
    expect(blocks.dataset.href).toBe("/admin/collections/pages/p1?from=%2Fen%2Fabout#sections-row-2");
    expect(blocks.dataset.label).toBe("t:editSection");
  });

  it("gives visitors no edit link", async () => {
    staff.mockReturnValue(false);
    getPage.mockResolvedValue({ id: "p1", slug: "about", fromSections: true, blocks: [] });
    render(await Page({ params }));
    expect(screen.getByTestId("blocks").dataset.href).toBe("");
  });

  it("gives no edit link on a page still on its old per-language list", async () => {
    staff.mockReturnValue(true);
    getPage.mockResolvedValue({ id: "p1", slug: "about", blocks: [] });
    render(await Page({ params }));
    expect(screen.getByTestId("blocks").dataset.href).toBe("");
  });
});
