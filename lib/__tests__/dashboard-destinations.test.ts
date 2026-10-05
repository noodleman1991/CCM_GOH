import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The dashboard's Quick Actions grid is gone (no repeats): each place it led to
// must still be one click away from the sidebar, the account menu or the header.
const read = (p: string) => readFileSync(p, "utf8");
const nav = [read("components/sidebar-quick-actions.tsx"), read("components/user-menu-card.tsx"), read("components/app-sidebar.tsx")].join("\n");
const header = read("components/dashboard/greeting.tsx") + read("app/[locale]/(main)/dashboard/page-client.tsx");

describe("everything the old Quick Actions offered is still reachable", () => {
  it.each(["/collaborate?tab=people", "/dashboard/settings", "/dashboard\"", "/messages", "/collaborations"])("%s is in the sidebar or account menu", (href) => {
    expect(nav).toContain(href.replace('"', ""));
  });
  it("your profile is a click away from the header, and sharing work from Your week / contributions", () => {
    expect(header).toContain("profileHref");
    expect(read("components/dashboard/your-week.tsx")).toContain("/dashboard/submissions");
  });
  it("the grid itself is gone", () => {
    expect(read("app/[locale]/(main)/dashboard/page-client.tsx")).not.toContain("t('quickActions')");
  });
});
