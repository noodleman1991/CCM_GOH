/**
 * Contact-request state machine (pure; no Prisma, no I/O).
 *
 * Why this exists: `requestContact` used to be a blind upsert that wrote
 * `status: "PENDING"` on every re-request. That silently re-opened a DECLINED
 * request (the recipient's "no" lasted one click) and, worse, downgraded an
 * ACCEPTED one back to PENDING, which broke CONTACTS-tier messaging because the
 * messaging guard only counts ACCEPTED rows (audit finding M7).
 *
 * The rules, kept here so they can be unit-tested without a database:
 *   - no row            → create a PENDING request
 *   - PENDING           → no-op (idempotent; do not re-notify)
 *   - ACCEPTED          → never touched; report the connection as-is
 *   - DECLINED          → re-open as PENDING only once the cooldown has
 *                         elapsed, otherwise refuse
 *
 * This module is intentionally NOT inside `lib/actions/requests.ts`: a
 * `"use server"` file may only export async functions, and the constant plus a
 * synchronous pure function belong where any caller can import them.
 */

import type { RequestStatus } from "@/generated/prisma";

/**
 * Days a requester must wait after a decline before the same recipient can be
 * asked again. Long enough that "decline" means something, short enough that
 * a changed mind is not locked out forever.
 */
export const CONTACT_REQUEST_COOLDOWN_DAYS = 30;

const DAY_MS = 86_400_000;

/** The slice of a `ContactRequest` row the decision needs. */
export type ExistingContactRequest = {
  status: RequestStatus;
  createdAt: Date;
  /** Set when the recipient accepted/declined; null while PENDING. */
  resolvedAt: Date | null;
};

export type ContactRequestTransition =
  /** No row yet: insert a PENDING request and notify the recipient. */
  | { kind: "create" }
  /** Nothing to write. `status` tells the caller what already stands. */
  | { kind: "noop"; status: "PENDING" | "ACCEPTED" }
  /** DECLINED long enough ago: flip back to PENDING and notify again. */
  | { kind: "reopen" }
  /** DECLINED too recently: refuse. `retryAt` is when the cooldown lifts. */
  | { kind: "cooldown"; retryAt: Date };

/**
 * Decide what `requestContact` may do given the current row for
 * (requester, recipient). `now` is injected so the cooldown boundary is
 * testable to the millisecond.
 *
 * The cooldown clock is the decline time (`resolvedAt`). The table has no
 * `updatedAt` column and adding one would need a migration this change does
 * not carry, so rows that pre-date `resolvedAt` being set fall back to
 * `createdAt` (the row cannot have been declined before it was created).
 */
export function nextContactRequestState(
  existing: ExistingContactRequest | null,
  now: Date
): ContactRequestTransition {
  if (!existing) return { kind: "create" };

  switch (existing.status) {
    case "PENDING":
      return { kind: "noop", status: "PENDING" };
    case "ACCEPTED":
      return { kind: "noop", status: "ACCEPTED" };
    case "DECLINED": {
      const declinedAt = existing.resolvedAt ?? existing.createdAt;
      const retryAt = new Date(declinedAt.getTime() + CONTACT_REQUEST_COOLDOWN_DAYS * DAY_MS);
      // Inclusive: exactly N days after the decline is allowed again.
      return now.getTime() >= retryAt.getTime() ? { kind: "reopen" } : { kind: "cooldown", retryAt };
    }
  }
}
