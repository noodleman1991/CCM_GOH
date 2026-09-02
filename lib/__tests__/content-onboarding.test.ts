import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
  queryPreviewable: vi.fn(),
}));

import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import {
  getActiveProfilePrompts,
  getOnboardingCommunities,
  getOnboardingContent,
} from "@/lib/content/onboarding";

const mockQuery = vi.mocked(query);
const mockQueryPreviewable = vi.mocked(queryPreviewable);

beforeEach(() => {
  mockQuery.mockReset();
  mockQueryPreviewable.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("getOnboardingContent", () => {
  it("returns the content the source resolves", async () => {
    mockQuery.mockResolvedValue({ _id: "onb-en", language: "en", title: "Onboarding" });
    await expect(getOnboardingContent("en")).resolves.toEqual({
      _id: "onb-en",
      language: "en",
      title: "Onboarding",
    });
  });

  it("passes the requested locale through as $locale", async () => {
    mockQuery.mockResolvedValue(null);
    await getOnboardingContent("ar");
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), { locale: "ar" });
  });

  it("returns null when the source resolves null", async () => {
    mockQuery.mockResolvedValue(null);
    await expect(getOnboardingContent("en")).resolves.toBeNull();
  });

  it("uses query, not queryPreviewable — both original call sites used client.fetch directly", async () => {
    mockQuery.mockResolvedValue(null);
    await getOnboardingContent("en");
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });

  it("throws through on failure — page.tsx has no try/catch around this read", async () => {
    mockQuery.mockRejectedValue(new Error("402 plan_limit_reached"));
    await expect(getOnboardingContent("en")).rejects.toThrow("402 plan_limit_reached");
  });
});

describe("getActiveProfilePrompts", () => {
  it("returns the prompts the source resolves", async () => {
    mockQueryPreviewable.mockResolvedValue([
      { id: "p1", prompt: { en: "What drew you to this work?" }, category: "motivation" },
    ]);
    await expect(getActiveProfilePrompts()).resolves.toEqual([
      { id: "p1", prompt: { en: "What drew you to this work?" }, category: "motivation" },
    ]);
  });

  it("defaults to [] when the source resolves a falsy value", async () => {
    mockQueryPreviewable.mockResolvedValue(null);
    await expect(getActiveProfilePrompts()).resolves.toEqual([]);
  });

  it("uses queryPreviewable, not query — the original omitted perspective/stega (draft-aware)", async () => {
    mockQueryPreviewable.mockResolvedValue([]);
    await getActiveProfilePrompts();
    expect(mockQueryPreviewable).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("throws through on failure — neither call site wraps this in try/catch", async () => {
    mockQueryPreviewable.mockRejectedValue(new Error("boom"));
    await expect(getActiveProfilePrompts()).rejects.toThrow("boom");
  });
});

describe("getOnboardingCommunities", () => {
  it("maps _id/slug/name/active rows to OnboardingRegionalCommunity[]", async () => {
    mockQuery.mockResolvedValue([
      { _id: "rc1", slug: "oceania", name: { en: "Oceania", ar: "أوقيانوسيا" }, active: true },
    ]);
    await expect(getOnboardingCommunities()).resolves.toEqual([
      { id: "rc1", slug: "oceania", name: { en: "Oceania", ar: "أوقيانوسيا" }, active: true },
    ]);
  });

  it("uses query, not queryPreviewable — the original called client.fetch directly", async () => {
    mockQuery.mockResolvedValue([]);
    await getOnboardingCommunities();
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQueryPreviewable).not.toHaveBeenCalled();
  });

  it("degrades to [] on failure — the original getRegionalCommunities() swallowed its own errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("network error"));
    await expect(getOnboardingCommunities()).resolves.toEqual([]);
  });
});
