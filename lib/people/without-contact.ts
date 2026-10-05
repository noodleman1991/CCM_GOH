/**
 * Contact details never leave the server in a member record (user, 2026-10-05:
 * "all personal data should be protected even if the member's settings say
 * public"). Pages get the record without them; an email is revealed only
 * through revealContactEmail, behind a Cloudflare Turnstile check.
 */
export const CONTACT_FIELDS = ["email", "emailVerified", "phoneNumber", "phoneVerified"] as const;
type ContactField = (typeof CONTACT_FIELDS)[number];

export function withoutContact<T extends object>(person: T): Omit<T, ContactField> {
  const copy = { ...person } as Record<string, unknown>;
  for (const field of CONTACT_FIELDS) delete copy[field];
  return copy as Omit<T, ContactField>;
}
