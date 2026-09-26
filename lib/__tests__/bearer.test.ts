/**
 * `lib/auth/bearer.ts` — the one bearer-token comparison for every secret-keyed
 * route (cron, internal sync, search webhooks, cache revalidate).
 *
 * Hub audit 2026-09-16, H3: with `INTERNAL_SYNC_SECRET` unset, the hand-rolled
 * `authHeader !== \`Bearer ${secret}\`` matched the literal header
 * `Authorization: Bearer undefined`, so CI (which has no secret) could re-index
 * the live Algolia indices. The helper must never match when the secret is
 * unset or empty, and must not leak the secret's length or content through
 * timing.
 */
import { describe, expect, it } from "vitest";
import { bearerMatches } from "@/lib/auth/bearer";

describe("bearerMatches", () => {
  it("never matches when the secret is unset — not even `Bearer undefined`", () => {
    expect(bearerMatches("Bearer undefined", undefined)).toBe(false);
    expect(bearerMatches("Bearer ", undefined)).toBe(false);
    expect(bearerMatches(null, undefined)).toBe(false);
  });

  it("never matches when the secret is the empty string", () => {
    expect(bearerMatches("Bearer ", "")).toBe(false);
    expect(bearerMatches("Bearer x", "")).toBe(false);
  });

  it("returns false for a missing header", () => {
    expect(bearerMatches(null, "s3cret")).toBe(false);
    expect(bearerMatches("", "s3cret")).toBe(false);
  });

  it("returns false when the `Bearer ` prefix is missing", () => {
    expect(bearerMatches("s3cret", "s3cret")).toBe(false);
    expect(bearerMatches("Basic s3cret", "s3cret")).toBe(false);
    expect(bearerMatches("bearer s3cret", "s3cret")).toBe(false);
  });

  it("returns false for a token of the wrong length", () => {
    expect(bearerMatches("Bearer s3cre", "s3cret")).toBe(false);
    expect(bearerMatches("Bearer s3cret!", "s3cret")).toBe(false);
  });

  it("returns false for a same-length wrong token", () => {
    expect(bearerMatches("Bearer s3crEt", "s3cret")).toBe(false);
  });

  it("returns true for the right token", () => {
    expect(bearerMatches("Bearer s3cret", "s3cret")).toBe(true);
  });

  it("does not trim or split on extra whitespace", () => {
    expect(bearerMatches("Bearer  s3cret", "s3cret")).toBe(false);
    expect(bearerMatches("Bearer s3cret ", "s3cret")).toBe(false);
  });
});
