// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
vi.mock("server-only", () => ({}));
const staff = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: async () => ({}), isStaff: () => staff() }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (k: string) => `t:${k}` }));
import { StaffEditLink } from "@/components/cms/staff-edit-link";
afterEach(cleanup);

describe("staff edit link", () => {
  it("links staff to the document in the admin, with the way back", async () => {
    staff.mockReturnValue(true);
    render((await StaffEditLink({ collection: "newsPosts", id: "n1", from: "/en/news/x" }))!);
    expect(screen.getByRole("link").getAttribute("href")).toBe("/admin/collections/newsPosts/n1?from=%2Fen%2Fnews%2Fx");
    expect(screen.getByRole("link").textContent).toContain("t:editPage");
  });
  it("shows nothing to visitors", async () => {
    staff.mockReturnValue(false);
    expect(await StaffEditLink({ collection: "newsPosts", id: "n1", from: "/en/news/x" })).toBeNull();
  });
});
