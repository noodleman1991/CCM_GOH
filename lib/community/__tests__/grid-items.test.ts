import { describe, it, expect } from "vitest";
import {
  mergePinnedWithDynamic,
  modeFetchesDynamic,
  modeUsesPins,
  modeIsFeatured,
  itemId,
} from "../grid-items";

const item = (id: string, extra = {}) => ({ _id: id, ...extra });

describe("mergePinnedWithDynamic", () => {
  it("puts pinned items first, then dynamic fill", () => {
    const out = mergePinnedWithDynamic([item("a"), item("b")], [item("c"), item("d")]);
    expect(out.map((i) => i._id)).toEqual(["a", "b", "c", "d"]);
  });

  it("dedupes a dynamic item that is also pinned (by id)", () => {
    const out = mergePinnedWithDynamic([item("a")], [item("a"), item("b")]);
    expect(out.map((i) => i._id)).toEqual(["a", "b"]);
  });

  it("caps the result at limit, keeping pins", () => {
    const out = mergePinnedWithDynamic([item("a"), item("b")], [item("c"), item("d")], 3);
    expect(out.map((i) => i._id)).toEqual(["a", "b", "c"]);
  });

  it("handles missing pinned or dynamic arrays", () => {
    expect(mergePinnedWithDynamic(null, [item("x")]).map((i) => i._id)).toEqual(["x"]);
    expect(mergePinnedWithDynamic([item("y")], null).map((i) => i._id)).toEqual(["y"]);
    expect(mergePinnedWithDynamic(null, null)).toEqual([]);
  });

  it("falls back to _key when _id is absent, and keeps id-less items", () => {
    const out = mergePinnedWithDynamic(
      [{ _key: "k1" }],
      [{ _key: "k1" }, { _key: "k2" }, {}]
    );
    // k1 deduped, k2 kept, the id-less {} is kept (can't dedupe)
    expect(out.length).toBe(3);
  });

  it("itemId prefers _id over _key", () => {
    expect(itemId({ _id: "i", _key: "k" })).toBe("i");
    expect(itemId({ _key: "k" })).toBe("k");
    expect(itemId({})).toBeNull();
    expect(itemId(null)).toBeNull();
  });
});

describe("grid mode predicates", () => {
  it("modeFetchesDynamic is false only for manual", () => {
    expect(modeFetchesDynamic("manual")).toBe(false);
    expect(modeFetchesDynamic("dynamic-recent")).toBe(true);
    expect(modeFetchesDynamic("dynamic-with-pinned")).toBe(true);
    expect(modeFetchesDynamic(undefined)).toBe(true);
  });

  it("modeUsesPins is true for manual and dynamic-with-pinned", () => {
    expect(modeUsesPins("manual")).toBe(true);
    expect(modeUsesPins("dynamic-with-pinned")).toBe(true);
    expect(modeUsesPins("dynamic-recent")).toBe(false);
  });

  it("modeIsFeatured only for dynamic-featured", () => {
    expect(modeIsFeatured("dynamic-featured")).toBe(true);
    expect(modeIsFeatured("dynamic-recent")).toBe(false);
  });
});
