import { describe, it, expect } from "vitest";
import { LexoRank } from "lexorank";

import { isValidOrderRank, sequentialOrderRanks } from "../order-rank";

describe("isValidOrderRank", () => {
  it("accepts the LexoRank strings the plugin writes", () => {
    expect(isValidOrderRank("0|10002w:")).toBe(true);
    expect(isValidOrderRank(LexoRank.min().toString())).toBe(true);
    expect(isValidOrderRank(LexoRank.middle().genNext().toString())).toBe(true);
  });

  it("rejects the zero-padded ordinals that crashed the Studio", () => {
    // seed-profile-prompts wrote these; `LexoRank.parse("000002")` blows up with
    // "Cannot read properties of undefined (reading 'indexOf')" because there is
    // no `|` to split on.
    expect(isValidOrderRank("000000")).toBe(false);
    expect(isValidOrderRank("000002")).toBe(false);
    expect(() => LexoRank.parse("000002")).toThrow(/indexOf/);
  });

  it("rejects empty and non-string values", () => {
    expect(isValidOrderRank("")).toBe(false);
    expect(isValidOrderRank(undefined)).toBe(false);
    expect(isValidOrderRank(null)).toBe(false);
    expect(isValidOrderRank(2)).toBe(false);
  });
});

describe("sequentialOrderRanks", () => {
  it("produces parseable, strictly ascending ranks", () => {
    const ranks = sequentialOrderRanks(5);

    expect(ranks).toHaveLength(5);
    expect(ranks.every(isValidOrderRank)).toBe(true);
    // The plugin orders documents by the raw string, so plain string comparison
    // has to agree with the intended order.
    expect([...ranks].sort()).toEqual(ranks);
  });

  it("leaves room to drop an item between neighbours", () => {
    const [first, second] = sequentialOrderRanks(2);
    const between = LexoRank.parse(first).between(LexoRank.parse(second)).toString();

    expect(between > first).toBe(true);
    expect(between < second).toBe(true);
  });

  it("continues after an existing rank", () => {
    const existing = "0|10002w:";
    const ranks = sequentialOrderRanks(3, existing);

    expect(ranks.every((rank) => rank > existing)).toBe(true);
  });

  it("starts from the minimum when given no or an unusable starting rank", () => {
    const fromScratch = sequentialOrderRanks(3);

    expect(sequentialOrderRanks(3, null)).toEqual(fromScratch);
    expect(sequentialOrderRanks(3, "")).toEqual(fromScratch);
    // A malformed legacy value must not throw — it falls back to the minimum.
    expect(sequentialOrderRanks(3, "000002")).toEqual(fromScratch);
  });

  it("returns nothing for a count of zero", () => {
    expect(sequentialOrderRanks(0)).toEqual([]);
  });
});
