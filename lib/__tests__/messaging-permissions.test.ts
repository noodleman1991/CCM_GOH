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

  describe("FOLLOWERS tier", () => {
    it("allows a sender who follows the recipient", () => {
      expect(
        canMessage({ ...base, recipientAllowsMessages: "FOLLOWERS", senderFollowsRecipient: true })
      ).toBe(true);
    });
    it("rejects a non-follower", () => {
      expect(
        canMessage({ ...base, recipientAllowsMessages: "FOLLOWERS", senderFollowsRecipient: false })
      ).toBe(false);
    });
    it("fails closed when the relation flag is missing", () => {
      expect(canMessage({ ...base, recipientAllowsMessages: "FOLLOWERS" })).toBe(false);
    });
    it("a block beats a follow", () => {
      expect(
        canMessage({
          ...base,
          recipientAllowsMessages: "FOLLOWERS",
          senderFollowsRecipient: true,
          blockedEitherWay: true,
        })
      ).toBe(false);
    });
  });

  describe("CONTACTS tier", () => {
    it("allows accepted contacts", () => {
      expect(canMessage({ ...base, recipientAllowsMessages: "CONTACTS", areContacts: true })).toBe(true);
    });
    it("rejects non-contacts", () => {
      expect(canMessage({ ...base, recipientAllowsMessages: "CONTACTS", areContacts: false })).toBe(false);
    });
    it("fails closed when the relation flag is missing", () => {
      expect(canMessage({ ...base, recipientAllowsMessages: "CONTACTS" })).toBe(false);
    });
    it("a follow does not satisfy CONTACTS", () => {
      expect(
        canMessage({ ...base, recipientAllowsMessages: "CONTACTS", senderFollowsRecipient: true })
      ).toBe(false);
    });
  });
});
