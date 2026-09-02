import { describe, expect, it, vi, afterEach } from "vitest";
import { safe } from "@/lib/content/internal/safe";

afterEach(() => vi.restoreAllMocks());

describe("safe", () => {
  it("returns the resolved value when the fetch succeeds", async () => {
    await expect(safe("demo", [], async () => [1, 2])).resolves.toEqual([1, 2]);
  });

  it("returns the fallback when the fetch throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      safe("demo", [], async () => {
        throw new Error("upstream 402");
      }),
    ).resolves.toEqual([]);
  });

  it("logs the label and the error so outages are diagnosable", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("upstream 402");
    await safe("lived-experiences", null, async () => {
      throw boom;
    });
    expect(spy).toHaveBeenCalledWith("[content:lived-experiences]", boom);
  });

  it("preserves the fallback's type, including null", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      safe("demo", null, async () => {
        throw new Error("x");
      }),
    ).resolves.toBeNull();
  });
});
