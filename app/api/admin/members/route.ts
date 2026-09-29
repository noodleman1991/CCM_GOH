import { NextResponse } from "next/server";
import { getActor, isStaff } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const displayName = (u: { firstName: string | null; lastName: string | null; email: string | null }) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "Member";

/**
 * Staff-only member lookup for the admin's "Community leads" picker
 * (editor-experience spec §3.5): `?q=` searches names and emails (2+ letters),
 * `?ids=a,b` names the people already chosen. At most 10 results.
 */
export async function GET(request: Request) {
  if (!isStaff(await getActor())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean).slice(0, 10) ?? [];
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (ids.length === 0 && q.length < 2) return NextResponse.json({ members: [] });
  const users = await prisma.user.findMany({
    where: ids.length
      ? { id: { in: ids } }
      : {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
    select: { id: true, firstName: true, lastName: true, email: true },
    take: 10,
  });
  return NextResponse.json(
    { members: users.map((u) => ({ id: u.id, name: displayName(u), email: u.email })) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
