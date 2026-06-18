import { describe, it, expect } from "vitest";
import { canMessage } from "../messaging/permissions";

const base = {
  senderId: "a",
  recipientId: "b",
  recipientAllowsMessages: "EVERYONE" as const,
  blockedEitherWay: false,
};

describe("canMessage", () => {
  it("allows a normal message", () => {
    expect(canMessage(base)).toBe(true);
  });
  it("blocks messaging yourself", () => {
    expect(canMessage({ ...base, recipientId: "a" })).toBe(false);
  });
  it("respects a closed inbox (NOBODY)", () => {
    expect(canMessage({ ...base, recipientAllowsMessages: "NOBODY" })).toBe(false);
  });
  it("blocks when either party blocked the other", () => {
    expect(canMessage({ ...base, blockedEitherWay: true })).toBe(false);
  });
});
