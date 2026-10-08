/**
 * A member's name as the hub shows it: first name then last name, the way
 * they wrote them, in every language. Right-to-left pages used to flip the
 * order, which turned Latin names around ("Lokszinski Amit") — bidi
 * isolation (<bdi>) already keeps each name's own direction. Pure.
 */
export function displayNameOf(user: { firstName?: string | null; lastName?: string | null; username?: string | null }): string {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  return user.firstName || user.lastName || user.username || "Anonymous User";
}
