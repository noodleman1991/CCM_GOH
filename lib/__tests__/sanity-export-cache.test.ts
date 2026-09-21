import { describe, expect, it } from "vitest";
import { archiveCacheDir } from "@/scripts/payload-import/lib/sanity-export";

/**
 * Each archive unpacks into its own directory, so a newer export can never be
 * shadowed by an older extraction (which is how the 2026-09-21 production
 * import ran from the 2 September export).
 */
describe("archiveCacheDir", () => {
  it("keys the extraction on the archive name", () => {
    expect(archiveCacheDir("/cache", "/repo/backups/sanity-production_2-2026-09-21.tar.gz")).toBe(
      "/cache/sanity-production_2-2026-09-21",
    );
  });

  it("gives two archives two directories", () => {
    const a = archiveCacheDir("/cache", "backups/sanity-production_2-2026-09-02.tar.gz");
    const b = archiveCacheDir("/cache", "backups/sanity-production_2-2026-09-21.tar.gz");
    expect(a).not.toBe(b);
  });
});
