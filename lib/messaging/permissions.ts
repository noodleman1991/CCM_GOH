/**
 * Pure messaging-permission logic (no server/DB deps — unit-testable). The
 * messaging actions enforce these same rules with data loaded from the DB.
 */

export type MessagePrivacy = "EVERYONE" | "NOBODY";

/**
 * Whether `senderId` may start/continue a DM with the recipient, given the
 * recipient's inbox setting and whether either party has blocked the other.
 */
export function canMessage(params: {
  senderId: string;
  recipientId: string;
  recipientAllowsMessages: MessagePrivacy;
  blockedEitherWay: boolean;
}): boolean {
  if (params.senderId === params.recipientId) return false;
  if (params.recipientAllowsMessages === "NOBODY") return false;
  if (params.blockedEitherWay) return false;
  return true;
}
