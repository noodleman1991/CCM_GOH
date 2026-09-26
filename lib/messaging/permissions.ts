/**
 * Pure messaging-permission logic (no server/DB deps — unit-testable). The
 * messaging actions enforce these same rules with data loaded from the DB.
 */

export type MessagePrivacy = "EVERYONE" | "FOLLOWERS" | "CONTACTS" | "NOBODY";

/**
 * Whether `senderId` may start/continue a DM with the recipient, given the
 * recipient's inbox setting, blocks, and the sender↔recipient relations:
 *  - FOLLOWERS: the sender must follow the recipient (Follow USER target).
 *  - CONTACTS: an ACCEPTED ContactRequest must exist in either direction.
 */
export function canMessage(params: {
  senderId: string;
  recipientId: string;
  recipientAllowsMessages: MessagePrivacy;
  blockedEitherWay: boolean;
  /** Does the sender follow the recipient? Only consulted for FOLLOWERS. */
  senderFollowsRecipient?: boolean;
  /** Accepted contact relation (either direction). Only consulted for CONTACTS. */
  areContacts?: boolean;
}): boolean {
  if (params.senderId === params.recipientId) return false;
  if (params.blockedEitherWay) return false;
  switch (params.recipientAllowsMessages) {
    case "NOBODY":
      return false;
    case "FOLLOWERS":
      return params.senderFollowsRecipient === true;
    case "CONTACTS":
      return params.areContacts === true;
    case "EVERYONE":
      return true;
  }
}
