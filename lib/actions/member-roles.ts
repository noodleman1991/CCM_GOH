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

export async function searchMembers(q: string): Promise<{ ok: true; members: MemberRow[] } | { ok: false; error: string }> {
  if (!(await asAdmin())) return { ok: false, error: NOT_ALLOWED };
  const term = q.trim();
  if (term.length < 2) return { ok: true, members: [] };

  const contains = { contains: term, mode: "insensitive" as const };
  const rows = await prisma.user.findMany({
    where: { OR: [{ firstName: contains }, { lastName: contains }, { username: contains }] },
    select: { id: true, firstName: true, lastName: true, username: true, image: true, role: true },
    orderBy: [{ role: "desc" }, { firstName: "asc" }],
    take: 20,
  });
  return {
    ok: true,
    members: rows.map((r) => ({
      id: r.id,
      name: [r.firstName, r.lastName].filter(Boolean).join(" ") || r.username || "—",
      username: r.username,
      image: r.image,
      role: String(r.role),
    })),
  };
}

/** The hub's staff, for the page's opening list. */
export async function listStaff(): Promise<{ ok: true; members: MemberRow[] } | { ok: false; error: string }> {
  if (!(await asAdmin())) return { ok: false, error: NOT_ALLOWED };
  const rows = await prisma.user.findMany({
    where: { role: { in: ["team_editor", "admin"] } },
    select: { id: true, firstName: true, lastName: true, username: true, image: true, role: true },
    orderBy: [{ role: "asc" }, { firstName: "asc" }],
  });
  return {
    ok: true,
    members: rows.map((r) => ({
      id: r.id,
      name: [r.firstName, r.lastName].filter(Boolean).join(" ") || r.username || "—",
      username: r.username,
      image: r.image,
      role: String(r.role),
    })),
  };
}

export async function setMemberRole(userId: string, role: MemberRole): Promise<{ ok: true; role: MemberRole } | { ok: false; error: string }> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: NOT_ALLOWED };
  if (!(MEMBER_ROLES as readonly string[]).includes(role)) return { ok: false, error: "That isn't a role on the hub." };
  if (typeof userId !== "string" || !userId) return { ok: false, error: "Choose a member first." };
  if (userId === actor.id) return { ok: false, error: "You can't change your own role — ask another admin." };

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!target) return { ok: false, error: "That member no longer exists." };
  const from = String(target.role);
  if (from === role) return { ok: true, role };

  if (from === "admin") {
    const admins = await prisma.user.count({ where: { role: "admin" } });
    if (admins <= 1) return { ok: false, error: "The hub needs at least one admin — make someone else an admin first." };
  }

  await prisma.user.update({ where: { id: userId }, data: { role }, select: { role: true } });
  console.info(`[member-roles] ${actor.id} changed ${userId}: ${from} → ${role}`);
  return { ok: true, role };
}
