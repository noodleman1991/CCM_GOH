"use server";

import { getActor } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { MEMBER_ROLES, type MemberRole } from "@/lib/members/roles";

/**
 * Settings → Members & roles (dashboard/profile spec D6): an admin finds a
 * member and changes their role, without the `pnpm user:role` script.
 *
 * Admins only, checked here on every call. The hub never shows a member's
 * email or phone (user, 2026-10-05), so the search is by name and username and
 * returns neither. Two guards keep the hub administrable: an admin can't change
 * their own role, and the last admin can't be demoted. Every change is logged
 * with who made it — no new table.
 */

export type MemberRow = { id: string; name: string; username: string | null; image: string | null; role: string };

const NOT_ALLOWED = "Only admins can change roles.";

async function asAdmin() {
  const actor = await getActor();
  return actor?.role === "admin" ? actor : null;
}

/**
 * One search box for names, usernames and email addresses. An address must
 * match exactly (no partial matches, so the box can't be used to fish for
 * addresses) and is never sent back for a member: the result says only which
 * address was searched, so the page can offer to reserve a role for it when
 * nobody on the hub uses it yet.
 */
export async function searchMembers(
  q: string,
): Promise<{ ok: true; members: MemberRow[]; email: string | null } | { ok: false; error: string }> {
  if (!(await asAdmin())) return { ok: false, error: NOT_ALLOWED };
  const term = typeof q === "string" ? q.trim() : "";
  const email = emailKey(term);
  if (!email && term.length < 2) return { ok: true, members: [], email: null };

  const contains = { contains: term, mode: "insensitive" as const };
  const rows = await prisma.user.findMany({
    where: email
      ? { email: { equals: email, mode: "insensitive" } }
      : { OR: [{ firstName: contains }, { lastName: contains }, { username: contains }] },
    select: { id: true, firstName: true, lastName: true, username: true, image: true, role: true },
    orderBy: [{ role: "desc" }, { firstName: "asc" }],
    take: 20,
  });
  return { ok: true, members: rows.map(toRow), email };
}

const toRow = (r: { id: string; firstName: string | null; lastName: string | null; username: string | null; image: string | null; role: unknown }): MemberRow => ({
  id: r.id,
  name: [r.firstName, r.lastName].filter(Boolean).join(" ") || r.username || "—",
  username: r.username,
  image: r.image,
  role: String(r.role),
});

/** The hub's staff, for the page's opening list. */
export async function listStaff(): Promise<{ ok: true; members: MemberRow[] } | { ok: false; error: string }> {
  if (!(await asAdmin())) return { ok: false, error: NOT_ALLOWED };
  const rows = await prisma.user.findMany({
    where: { role: { in: ["team_editor", "admin"] } },
    select: { id: true, firstName: true, lastName: true, username: true, image: true, role: true },
    orderBy: [{ role: "asc" }, { firstName: "asc" }],
  });
  return { ok: true, members: rows.map(toRow) };
}

export async function setMemberRole(userId: string, role: MemberRole): Promise<{ ok: true; role: MemberRole } | { ok: false; error: string }> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: NOT_ALLOWED };
  if (!(MEMBER_ROLES as readonly string[]).includes(role)) return { ok: false, error: "That isn't a role on the hub." };
  if (typeof userId !== "string" || !userId) return { ok: false, error: "Choose a member first." };
  return applyRole(actor.id, userId, role);
}

/** The one place a role is written: the self and last-admin guards, then the log line. */
async function applyRole(actorId: string, userId: string, role: MemberRole): Promise<{ ok: true; role: MemberRole } | { ok: false; error: string }> {
  if (userId === actorId) return { ok: false, error: "You can't change your own role — ask another admin." };

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!target) return { ok: false, error: "That member no longer exists." };
  const from = String(target.role);
  if (from === role) return { ok: true, role };

  if (from === "admin") {
    const admins = await prisma.user.count({ where: { role: "admin" } });
    if (admins <= 1) return { ok: false, error: "The hub needs at least one admin — make someone else an admin first." };
  }

  await prisma.user.update({ where: { id: userId }, data: { role }, select: { role: true } });
  console.info(`[member-roles] ${actorId} changed ${userId}: ${from} → ${role}`);
  return { ok: true, role };
}

// ---------------------------------------------------------------------------
// Roles for people who haven't joined yet (the StaffRoleInvite table, also
// written by `pnpm user:role --invite`). The role is applied the moment an
// account with that address is created. These addresses were typed in by an
// admin for people who aren't members yet, and the list is shown to admins
// only; once the person joins, the reservation — and the address — is gone.
// ---------------------------------------------------------------------------

export type Reservation = { email: string; role: string; createdAt: string };

const emailKey = (email: string) => {
  const e = typeof email === "string" ? email.trim().toLowerCase() : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
};

export async function listReservations(): Promise<{ ok: true; reservations: Reservation[] } | { ok: false; error: string }> {
  if (!(await asAdmin())) return { ok: false, error: NOT_ALLOWED };
  const rows = await prisma.staffRoleInvite.findMany({ orderBy: { email: "asc" }, select: { email: true, role: true, createdAt: true } });
  return { ok: true, reservations: rows.map((r) => ({ email: r.email, role: String(r.role), createdAt: r.createdAt.toISOString() })) };
}

/**
 * Reserve a role for an address. If a member already uses that address, they
 * get the role now instead (with the same guards as a change), and nothing is
 * reserved — `applied: true` says which happened.
 */
export async function reserveRole(email: string, role: MemberRole): Promise<{ ok: true; applied: boolean } | { ok: false; error: string }> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: NOT_ALLOWED };
  const key = emailKey(email);
  if (!key) return { ok: false, error: "That doesn't look like an email address." };
  if (!(MEMBER_ROLES as readonly string[]).includes(role)) return { ok: false, error: "That isn't a role on the hub." };

  const member = await prisma.user.findFirst({ where: { email: { equals: key, mode: "insensitive" } }, select: { id: true, role: true } });
  if (member) {
    const res = await applyRole(actor.id, member.id, role);
    return res.ok ? { ok: true, applied: true } : res;
  }

  await prisma.staffRoleInvite.upsert({ where: { email: key }, update: { role }, create: { email: key, role } });
  console.info(`[member-roles] ${actor.id} reserved ${role} for an address not yet on the hub`);
  return { ok: true, applied: false };
}

export async function cancelReservation(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: NOT_ALLOWED };
  const key = emailKey(email);
  if (!key) return { ok: false, error: "That doesn't look like an email address." };
  await prisma.staffRoleInvite.deleteMany({ where: { email: key } });
  console.info(`[member-roles] ${actor.id} removed a reserved role`);
  return { ok: true };
}
