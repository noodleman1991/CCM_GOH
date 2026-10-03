import { expect, it } from "vitest";
import { withBlocked, withoutBlocked } from "@/lib/events/blocked-list";

it("adds a person once and removes them", () => {
  const one = withBlocked([], "u1", "spam");
  expect(withBlocked(one, "u1")).toEqual([{ userId: "u1", note: "spam" }]);
  expect(withoutBlocked(one, "u1")).toEqual([]);
  expect(withoutBlocked(one, "u2")).toEqual(one);
});
