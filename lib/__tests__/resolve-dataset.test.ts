import { describe, expect, it } from "vitest";
import { resolveDataset } from "@/scripts/lib/resolve-dataset";

const env = {
  NEXT_PUBLIC_SANITY_PROJECT_ID: "gm67v7rk",
  SANITY_API_READ_TOKEN: "sk-test-token",
};

describe("resolveDataset", () => {
  it("proceeds with production_2 when --prod is passed", () => {
    const result = resolveDataset(["--prod"], { ...env, NEXT_PUBLIC_SANITY_DATASET: "production_2" });
    expect(result).toEqual({
      dataset: "production_2",
      projectId: "gm67v7rk",
      token: "sk-test-token",
    });
  });

  it("refuses production_2 when --prod is not passed", () => {
    const result = resolveDataset([], { ...env, NEXT_PUBLIC_SANITY_DATASET: "production_2" });
    expect("refuse" in result).toBe(true);
    expect((result as { refuse: string }).refuse).toMatch(/--prod/);
  });

  it("proceeds with development when --prod is not passed", () => {
    const result = resolveDataset([], { ...env, NEXT_PUBLIC_SANITY_DATASET: "development" });
    expect(result).toEqual({
      dataset: "development",
      projectId: "gm67v7rk",
      token: "sk-test-token",
    });
  });

  it("refuses when a required env var is missing, regardless of dataset", () => {
    const result = resolveDataset(["--prod"], { NEXT_PUBLIC_SANITY_DATASET: "production_2" });
    expect("refuse" in result).toBe(true);
    expect((result as { refuse: string }).refuse).toMatch(/Missing/);
  });
});
