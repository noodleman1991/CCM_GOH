import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Slice 3a of the 2026-09-16 hardening plan: surfaces with no callers were
 * live public endpoints, duplicate pages, or modules nobody imported. Git
 * keeps them; this test keeps them from coming back by accident.
 */
const root = path.resolve(__dirname, "../..");
const gone = [
  // Routes with zero callers; the first had an IDOR on `targetUserId`.
  "app/api/sync/clerk",
  "app/api/user/me",
  "app/api/community",
  "app/api/communities",
  "app/api/search/counts",
  "app/api/profile/work",
  // Pages: an unconditional redirect, a duplicate of the public profile page
  // that read Prisma directly, and the add-work pages that could not succeed.
  "app/[locale]/(main)/profiles/page.tsx",
  "app/[locale]/(main)/dashboard/profile/[username]",
  "app/[locale]/(main)/dashboard/profile/edit/work",
  // Modules with zero importers.
  "lib/user-sync.ts",
  "lib/services/community.service.ts",
  "lib/utils/sanity-prisma-sync.ts",
  "lib/types/sanity-prisma.ts",
  "hooks/use-search-counts.ts",
  "hooks/useReadMore.ts",
  "components/footer.tsx",
  "components/header",
  "components/nav-user.tsx",
  "components/auth-nav-user.tsx",
  "components/ui/calendar.tsx",
  "components/ui/progress.tsx",
  "components/case-studies/case-studies-listing.tsx",
  // (search-error-boundary.tsx stays: grouped-search imports it relatively.)
  "components/search/content-search-filters.tsx",
  "components/search/content-search-results.tsx",
  "components/search/custom-search-box.tsx",
  "components/search/search-filters.tsx",
  "components/search/search-hits-reporter.tsx",
  "components/search/search-interface.tsx",
  "components/search/search-results.tsx",
  "components/search/search-stats.tsx",
];

describe("dead surfaces stay gone", () => {
  it.each(gone)("%s does not exist", (rel) => {
    expect(existsSync(path.join(root, rel))).toBe(false);
  });

  it("the proxy no longer exempts routes that do not exist", () => {
    const proxy = readFileSync(path.join(root, "proxy.ts"), "utf8");
    expect(proxy).not.toContain("/api/communities");
    expect(proxy).not.toContain("/api/search/counts");
  });

  it("nothing links to the removed add-work pages; the edit form's tab is the destination", () => {
    // The dashboard no longer shows recent work (it lives on the profile — dashboard spec D2).
    const files = [
      "app/[locale]/(main)/profiles/[username]/page.tsx",
      "components/blocks/profile/recent-work-block.tsx",
    ];
    for (const rel of files) {
      const src = readFileSync(path.join(root, rel), "utf8");
      expect(src, rel).not.toContain("/dashboard/profile/edit/work");
      expect(src, rel).toContain("/dashboard/profile/edit?tab=recentWork");
    }
  });

  it("the sitemap and the profile not-found page no longer point at the removed directory redirect", () => {
    expect(readFileSync(path.join(root, "app/sitemap.ts"), "utf8")).not.toMatch(/["'`]\/profiles["'`]/);
    expect(readFileSync(path.join(root, "app/[locale]/(main)/profiles/[username]/not-found.tsx"), "utf8")).not.toMatch(
      /href=["'`]\/profiles["'`]/,
    );
  });

  it("the recent-work actions keep only the exports that have callers", () => {
    const src = readFileSync(path.join(root, "lib/actions/recent-work.ts"), "utf8");
    for (const dead of ["createRecentWork", "updateRecentWork", "deleteRecentWork", "getUserRecentWork"]) {
      expect(src, dead).not.toMatch(new RegExp(`export async function ${dead}\\b`));
    }
    expect(src).toMatch(/export async function toggleRecentWorkHidden\b/);
    expect(src).toMatch(/export async function setRecentWorkPinned\b/);
  });
});
